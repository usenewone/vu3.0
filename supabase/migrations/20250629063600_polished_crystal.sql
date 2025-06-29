/*
  # Add project sections functionality

  1. New Tables
    - `project_sections` - Store custom project sections
    - Enhanced form sharing and analytics tables

  2. Security
    - RLS policies for project sections
    - Proper access control for section management

  3. Functions
    - Section ordering and management functions
*/

-- Create project sections table
CREATE TABLE IF NOT EXISTS public.project_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, name)
);

-- Enable RLS
ALTER TABLE public.project_sections ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_sections_project_id ON public.project_sections(project_id);
CREATE INDEX IF NOT EXISTS idx_project_sections_order ON public.project_sections(project_id, order_index);

-- RLS Policies for project_sections
CREATE POLICY "Anyone can view project sections" ON public.project_sections
FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Project owners can manage sections" ON public.project_sections
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_sections.project_id
    AND (p.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = auth.uid()::text
      AND u.role = 'owner'
    ))
  )
);

-- Function to reorder project sections
CREATE OR REPLACE FUNCTION public.reorder_project_sections(
  p_project_id UUID,
  p_section_orders JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  section_update JSONB;
  section_id UUID;
  new_order INTEGER;
BEGIN
  -- Verify user has permission to modify this project
  IF NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_project_id
    AND (p.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id::text = auth.uid()::text
      AND u.role = 'owner'
    ))
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Update each section's order
  FOR section_update IN SELECT * FROM jsonb_array_elements(p_section_orders)
  LOOP
    section_id := (section_update->>'id')::UUID;
    new_order := (section_update->>'order')::INTEGER;
    
    UPDATE public.project_sections
    SET order_index = new_order,
        updated_at = NOW()
    WHERE id = section_id
      AND project_id = p_project_id;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get project sections with proper ordering
CREATE OR REPLACE FUNCTION public.get_project_sections(p_project_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  order_index INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.name,
    ps.description,
    ps.order_index,
    ps.is_active,
    ps.created_at,
    ps.updated_at
  FROM public.project_sections ps
  WHERE ps.project_id = p_project_id
    AND ps.is_active = true
  ORDER BY ps.order_index ASC, ps.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate section data
CREATE OR REPLACE FUNCTION public.validate_section_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate section name
  IF NEW.name IS NULL OR trim(NEW.name) = '' THEN
    RAISE EXCEPTION 'Section name cannot be empty';
  END IF;
  
  IF length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Section name must be 100 characters or less';
  END IF;
  
  -- Validate description length
  IF NEW.description IS NOT NULL AND length(NEW.description) > 500 THEN
    RAISE EXCEPTION 'Section description must be 500 characters or less';
  END IF;
  
  -- Sanitize inputs
  NEW.name = trim(NEW.name);
  NEW.description = COALESCE(trim(NEW.description), '');
  
  -- Set updated timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for section validation
DROP TRIGGER IF EXISTS validate_section_data_trigger ON public.project_sections;
CREATE TRIGGER validate_section_data_trigger
  BEFORE INSERT OR UPDATE ON public.project_sections
  FOR EACH ROW EXECUTE FUNCTION public.validate_section_data();

-- Insert some default project sections for existing projects
INSERT INTO public.project_sections (project_id, name, description, order_index)
SELECT 
  p.id,
  'Overview',
  'Project overview and key details',
  0
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_sections ps 
  WHERE ps.project_id = p.id
)
ON CONFLICT (project_id, name) DO NOTHING;

INSERT INTO public.project_sections (project_id, name, description, order_index)
SELECT 
  p.id,
  'Design Process',
  'Design development and methodology',
  1
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_sections ps 
  WHERE ps.project_id = p.id AND ps.name = 'Design Process'
)
ON CONFLICT (project_id, name) DO NOTHING;

INSERT INTO public.project_sections (project_id, name, description, order_index)
SELECT 
  p.id,
  'Final Results',
  'Completed project showcase',
  2
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_sections ps 
  WHERE ps.project_id = p.id AND ps.name = 'Final Results'
)
ON CONFLICT (project_id, name) DO NOTHING;