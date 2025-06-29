/*
  # Robust Data Persistence System for Portfolio

  1. Enhanced Tables
    - Improved portfolio_data table with better indexing and constraints
    - Added audit logging for data changes
    - Enhanced RLS policies for security
    
  2. Security
    - Strict RLS policies for authenticated users only
    - Data validation at database level
    - Audit trail for all changes
    
  3. Performance
    - Optimized indexes for fast queries
    - Efficient upsert operations
*/

-- Create enhanced portfolio_data table with better structure
CREATE TABLE IF NOT EXISTS public.portfolio_data_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  element_type TEXT NOT NULL CHECK (element_type IN ('text', 'image', 'project', 'education', 'profile')),
  element_id TEXT NOT NULL,
  element_value TEXT,
  json_data JSONB,
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, element_type, element_id)
);

-- Create audit log table for tracking changes
CREATE TABLE IF NOT EXISTS public.portfolio_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create backup table for data recovery
CREATE TABLE IF NOT EXISTS public.portfolio_data_backup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  element_type TEXT NOT NULL,
  element_id TEXT NOT NULL,
  element_value TEXT,
  json_data JSONB,
  backup_reason TEXT DEFAULT 'auto_backup',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.portfolio_data_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_data_backup ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolio_data_v2_user_type_id ON public.portfolio_data_v2(user_id, element_type, element_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_data_v2_updated_at ON public.portfolio_data_v2(updated_at);
CREATE INDEX IF NOT EXISTS idx_portfolio_audit_log_user_id ON public.portfolio_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_audit_log_created_at ON public.portfolio_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_portfolio_data_backup_user_id ON public.portfolio_data_backup(user_id);

-- RLS Policies for portfolio_data_v2
CREATE POLICY "Users can view own portfolio data" ON public.portfolio_data_v2
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio data" ON public.portfolio_data_v2
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio data" ON public.portfolio_data_v2
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio data" ON public.portfolio_data_v2
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for audit log (read-only for users)
CREATE POLICY "Users can view own audit log" ON public.portfolio_audit_log
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for backup data (read-only for users)
CREATE POLICY "Users can view own backup data" ON public.portfolio_data_backup
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Function to create automatic backups before updates
CREATE OR REPLACE FUNCTION public.create_portfolio_backup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create backup of old data before update
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.portfolio_data_backup (
      original_id, user_id, element_type, element_id, 
      element_value, json_data, backup_reason
    ) VALUES (
      OLD.id, OLD.user_id, OLD.element_type, OLD.element_id,
      OLD.element_value, OLD.json_data, 'pre_update_backup'
    );
  END IF;
  
  -- Update version and timestamp
  NEW.version = COALESCE(OLD.version, 0) + 1;
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log changes to audit table
CREATE OR REPLACE FUNCTION public.log_portfolio_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields TEXT[] := '{}';
  old_data JSONB;
  new_data JSONB;
BEGIN
  -- Convert records to JSONB
  IF TG_OP = 'DELETE' THEN
    old_data = to_jsonb(OLD);
    new_data = NULL;
  ELSIF TG_OP = 'INSERT' THEN
    old_data = NULL;
    new_data = to_jsonb(NEW);
  ELSE -- UPDATE
    old_data = to_jsonb(OLD);
    new_data = to_jsonb(NEW);
    
    -- Identify changed fields
    IF OLD.element_value IS DISTINCT FROM NEW.element_value THEN
      changed_fields = array_append(changed_fields, 'element_value');
    END IF;
    IF OLD.json_data IS DISTINCT FROM NEW.json_data THEN
      changed_fields = array_append(changed_fields, 'json_data');
    END IF;
    IF OLD.metadata IS DISTINCT FROM NEW.metadata THEN
      changed_fields = array_append(changed_fields, 'metadata');
    END IF;
  END IF;
  
  -- Insert audit log entry
  INSERT INTO public.portfolio_audit_log (
    user_id, table_name, record_id, action, 
    old_data, new_data, changed_fields
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    old_data,
    new_data,
    changed_fields
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for data validation and sanitization
CREATE OR REPLACE FUNCTION public.validate_portfolio_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate element_type
  IF NEW.element_type NOT IN ('text', 'image', 'project', 'education', 'profile') THEN
    RAISE EXCEPTION 'Invalid element_type: %', NEW.element_type;
  END IF;
  
  -- Sanitize text content
  IF NEW.element_value IS NOT NULL THEN
    -- Remove potentially harmful content
    NEW.element_value = regexp_replace(NEW.element_value, '<script[^>]*>.*?</script>', '', 'gi');
    NEW.element_value = regexp_replace(NEW.element_value, 'javascript:', '', 'gi');
    NEW.element_value = trim(NEW.element_value);
    
    -- Validate length
    IF length(NEW.element_value) > 10000 THEN
      RAISE EXCEPTION 'Element value too long. Maximum 10000 characters allowed.';
    END IF;
  END IF;
  
  -- Validate JSON data structure
  IF NEW.json_data IS NOT NULL THEN
    -- Ensure it's valid JSON and not too large
    IF pg_column_size(NEW.json_data) > 1048576 THEN -- 1MB limit
      RAISE EXCEPTION 'JSON data too large. Maximum 1MB allowed.';
    END IF;
  END IF;
  
  -- Set user_id if not provided
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  
  -- Validate user ownership
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied. Users can only modify their own data.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS portfolio_data_backup_trigger ON public.portfolio_data_v2;
CREATE TRIGGER portfolio_data_backup_trigger
  BEFORE UPDATE ON public.portfolio_data_v2
  FOR EACH ROW EXECUTE FUNCTION public.create_portfolio_backup();

DROP TRIGGER IF EXISTS portfolio_data_audit_trigger ON public.portfolio_data_v2;
CREATE TRIGGER portfolio_data_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.portfolio_data_v2
  FOR EACH ROW EXECUTE FUNCTION public.log_portfolio_changes();

DROP TRIGGER IF EXISTS portfolio_data_validation_trigger ON public.portfolio_data_v2;
CREATE TRIGGER portfolio_data_validation_trigger
  BEFORE INSERT OR UPDATE ON public.portfolio_data_v2
  FOR EACH ROW EXECUTE FUNCTION public.validate_portfolio_data();

-- Create function for safe upsert operations
CREATE OR REPLACE FUNCTION public.upsert_portfolio_data(
  p_element_type TEXT,
  p_element_id TEXT,
  p_element_value TEXT DEFAULT NULL,
  p_json_data JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  result_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Perform upsert
  INSERT INTO public.portfolio_data_v2 (
    user_id, element_type, element_id, element_value, json_data, metadata
  ) VALUES (
    current_user_id, p_element_type, p_element_id, p_element_value, p_json_data, p_metadata
  )
  ON CONFLICT (user_id, element_type, element_id)
  DO UPDATE SET
    element_value = EXCLUDED.element_value,
    json_data = EXCLUDED.json_data,
    metadata = EXCLUDED.metadata,
    updated_at = NOW()
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get portfolio data with caching
CREATE OR REPLACE FUNCTION public.get_portfolio_data(
  p_element_type TEXT DEFAULT NULL,
  p_element_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  element_type TEXT,
  element_id TEXT,
  element_value TEXT,
  json_data JSONB,
  metadata JSONB,
  version INTEGER,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  RETURN QUERY
  SELECT 
    pd.id, pd.element_type, pd.element_id, pd.element_value, 
    pd.json_data, pd.metadata, pd.version, pd.updated_at
  FROM public.portfolio_data_v2 pd
  WHERE pd.user_id = current_user_id
    AND pd.is_active = true
    AND (p_element_type IS NULL OR pd.element_type = p_element_type)
    AND (p_element_id IS NULL OR pd.element_id = p_element_id)
  ORDER BY pd.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for bulk data operations
CREATE OR REPLACE FUNCTION public.bulk_update_portfolio_data(
  p_updates JSONB
)
RETURNS INTEGER AS $$
DECLARE
  update_record JSONB;
  updated_count INTEGER := 0;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Process each update in the array
  FOR update_record IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    PERFORM public.upsert_portfolio_data(
      update_record->>'element_type',
      update_record->>'element_id',
      update_record->>'element_value',
      update_record->'json_data',
      COALESCE(update_record->'metadata', '{}')
    );
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migrate existing data from old table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolio_data') THEN
    INSERT INTO public.portfolio_data_v2 (
      user_id, element_type, element_id, element_value, json_data, created_at, updated_at
    )
    SELECT 
      COALESCE(auth.uid(), gen_random_uuid()), -- Use current user or generate UUID
      element_type,
      element_id,
      element_value,
      json_data,
      COALESCE(updated_at, NOW()),
      COALESCE(updated_at, NOW())
    FROM public.portfolio_data
    ON CONFLICT (user_id, element_type, element_id) DO NOTHING;
  END IF;
END $$;