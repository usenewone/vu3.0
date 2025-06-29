/*
  # Add categories and tags system for better project organization

  1. New Tables
    - `project_categories` - Predefined categories for projects
    - `project_tags` - Flexible tagging system
    - `project_tag_relations` - Many-to-many relationship between projects and tags

  2. Enhanced Organization
    - Better filtering and searching capabilities
    - Hierarchical category structure
    - Flexible tagging system
*/

-- Create project categories table
CREATE TABLE IF NOT EXISTS public.project_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color_code TEXT DEFAULT '#8B4513',
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create project tags table
CREATE TABLE IF NOT EXISTS public.project_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color_code TEXT DEFAULT '#DAA520',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create project-tag relationship table
CREATE TABLE IF NOT EXISTS public.project_tag_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.project_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, tag_id)
);

-- Insert default categories
INSERT INTO public.project_categories (name, description, color_code, icon, order_index) VALUES
('Residential', 'Home and apartment interior design projects', '#8B4513', '🏠', 1),
('Commercial', 'Office and business space design projects', '#A0522D', '🏢', 2),
('Hospitality', 'Hotel, restaurant, and entertainment venue designs', '#DAA520', '🏨', 3),
('Retail', 'Store and shopping center interior designs', '#CD853F', '🛍️', 4),
('Healthcare', 'Medical facility and wellness center designs', '#DEB887', '🏥', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert default tags
INSERT INTO public.project_tags (name, color_code) VALUES
('Modern', '#2563EB'),
('Traditional', '#7C2D12'),
('Minimalist', '#6B7280'),
('Luxury', '#F59E0B'),
('Sustainable', '#059669'),
('Small Space', '#7C3AED'),
('Open Concept', '#DC2626'),
('Renovation', '#EA580C')
ON CONFLICT (name) DO NOTHING;

-- Add RLS policies for new tables
ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tag_relations ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Anyone can view categories" ON public.project_categories
FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Only owners can modify categories" ON public.project_categories
FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id::text = auth.uid()::text 
  AND users.role = 'owner'
));

-- Tags policies
CREATE POLICY "Anyone can view tags" ON public.project_tags
FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can create tags" ON public.project_tags
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Only owners can modify tags" ON public.project_tags
FOR UPDATE TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id::text = auth.uid()::text 
  AND users.role = 'owner'
));

-- Tag relations policies
CREATE POLICY "Anyone can view tag relations" ON public.project_tag_relations
FOR SELECT TO public USING (true);

CREATE POLICY "Users can manage their project tags" ON public.project_tag_relations
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_id 
    AND (projects.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role = 'owner'
    ))
  )
);