/*
  # Real-time Forms System Migration

  1. Enhanced Tables
    - Add form-specific tables for better organization
    - Add real-time capabilities with proper indexing
    - Add form submission tracking
    - Add share link management

  2. Security
    - Proper RLS policies for form access
    - Share link validation
    - Submission tracking with audit

  3. Performance
    - Optimized indexes for real-time queries
    - Efficient form data retrieval
*/

-- Create form submissions table
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_data JSONB NOT NULL,
  ip_address INET,
  user_agent TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create form shares table for managing share links
CREATE TABLE IF NOT EXISTS public.form_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id TEXT UNIQUE NOT NULL,
  form_id TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permissions TEXT[] DEFAULT ARRAY['read'],
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create form analytics table
CREATE TABLE IF NOT EXISTS public.form_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  metric_data JSONB,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  period_type TEXT DEFAULT 'daily' CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly'))
);

-- Enable RLS on new tables
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_analytics ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON public.form_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_form_submissions_user_id ON public.form_submissions(user_id);

CREATE INDEX IF NOT EXISTS idx_form_shares_share_id ON public.form_shares(share_id);
CREATE INDEX IF NOT EXISTS idx_form_shares_form_id ON public.form_shares(form_id);
CREATE INDEX IF NOT EXISTS idx_form_shares_created_by ON public.form_shares(created_by);
CREATE INDEX IF NOT EXISTS idx_form_shares_expires_at ON public.form_shares(expires_at);

CREATE INDEX IF NOT EXISTS idx_form_analytics_form_id ON public.form_analytics(form_id);
CREATE INDEX IF NOT EXISTS idx_form_analytics_recorded_at ON public.form_analytics(recorded_at);

-- RLS Policies for form_submissions
CREATE POLICY "Users can view own form submissions" ON public.form_submissions
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anyone can submit forms" ON public.form_submissions
FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Form owners can view all submissions" ON public.form_submissions
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.portfolio_data_v2 pd
    WHERE pd.element_type = 'form' 
    AND pd.element_id = form_submissions.form_id
    AND pd.user_id = auth.uid()
  )
);

-- RLS Policies for form_shares
CREATE POLICY "Users can view own form shares" ON public.form_shares
FOR SELECT TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can create form shares" ON public.form_shares
FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own form shares" ON public.form_shares
FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own form shares" ON public.form_shares
FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- RLS Policies for form_analytics
CREATE POLICY "Form owners can view analytics" ON public.form_analytics
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.portfolio_data_v2 pd
    WHERE pd.element_type = 'form' 
    AND pd.element_id = form_analytics.form_id
    AND pd.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert analytics" ON public.form_analytics
FOR INSERT TO authenticated WITH CHECK (true);

-- Function to validate share links
CREATE OR REPLACE FUNCTION public.validate_share_link(p_share_id TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  form_id TEXT,
  permissions TEXT[],
  requires_password BOOLEAN
) AS $$
DECLARE
  share_record RECORD;
BEGIN
  SELECT * INTO share_record
  FROM public.form_shares
  WHERE share_id = p_share_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());
  
  IF share_record IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT[], false;
    RETURN;
  END IF;
  
  -- Update access tracking
  UPDATE public.form_shares
  SET access_count = access_count + 1,
      last_accessed_at = NOW()
  WHERE share_id = p_share_id;
  
  RETURN QUERY SELECT 
    true,
    share_record.form_id,
    share_record.permissions,
    (share_record.password_hash IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get form submission statistics
CREATE OR REPLACE FUNCTION public.get_form_stats(p_form_id TEXT)
RETURNS TABLE (
  total_submissions BIGINT,
  submissions_today BIGINT,
  submissions_this_week BIGINT,
  submissions_this_month BIGINT,
  avg_completion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_submissions,
    COUNT(*) FILTER (WHERE submitted_at >= CURRENT_DATE) as submissions_today,
    COUNT(*) FILTER (WHERE submitted_at >= DATE_TRUNC('week', CURRENT_DATE)) as submissions_this_week,
    COUNT(*) FILTER (WHERE submitted_at >= DATE_TRUNC('month', CURRENT_DATE)) as submissions_this_month,
    AVG(
      CASE 
        WHEN jsonb_typeof(submitted_data) = 'object' 
        THEN (
          SELECT COUNT(*) 
          FROM jsonb_object_keys(submitted_data) 
          WHERE submitted_data->>jsonb_object_keys(submitted_data) IS NOT NULL 
          AND submitted_data->>jsonb_object_keys(submitted_data) != ''
        )::NUMERIC / GREATEST(jsonb_object_keys(submitted_data), 1)
        ELSE 0
      END
    ) * 100 as avg_completion_rate
  FROM public.form_submissions
  WHERE form_id = p_form_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired shares
CREATE OR REPLACE FUNCTION public.cleanup_expired_shares()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE public.form_shares
  SET is_active = false,
      updated_at = NOW()
  WHERE expires_at < NOW()
    AND is_active = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to handle real-time form updates
CREATE OR REPLACE FUNCTION public.notify_form_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify about form data changes
  IF TG_TABLE_NAME = 'portfolio_data_v2' AND NEW.element_type = 'form' THEN
    PERFORM pg_notify(
      'form_change',
      json_build_object(
        'form_id', NEW.element_id,
        'action', TG_OP,
        'data', NEW.json_data,
        'timestamp', NOW()
      )::text
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for real-time notifications
DROP TRIGGER IF EXISTS form_change_trigger ON public.portfolio_data_v2;
CREATE TRIGGER form_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.portfolio_data_v2
  FOR EACH ROW EXECUTE FUNCTION public.notify_form_change();

-- Create a scheduled job to clean up expired shares (if pg_cron is available)
-- This would typically be set up separately in production
-- SELECT cron.schedule('cleanup-expired-shares', '0 2 * * *', 'SELECT public.cleanup_expired_shares();');