-- Create comprehensive portfolio data table for all editable content
CREATE TABLE IF NOT EXISTS public.portfolio_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_type TEXT NOT NULL, -- 'text', 'image', 'json'
  element_id TEXT NOT NULL,   -- unique identifier for each editable element
  element_value TEXT,         -- stores text content or image URLs
  json_data JSONB,           -- stores complex data structures
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(element_type, element_id)
);

-- Create projects table with complete image storage
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'New Project',
  category TEXT DEFAULT 'Residential',
  description TEXT DEFAULT '',
  client TEXT DEFAULT '',
  date TEXT DEFAULT '2024',
  elevation_images JSONB DEFAULT '[]',
  floor_plan_images JSONB DEFAULT '[]',
  top_view_images JSONB DEFAULT '[]',
  design_2d_images JSONB DEFAULT '[]',
  render_3d_images JSONB DEFAULT '[]',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user profile table for owner information
CREATE TABLE IF NOT EXISTS public.user_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT DEFAULT 'Vaishnavi Upadhyay',
  title TEXT DEFAULT 'Interior Designer & Space Planner',
  bio TEXT DEFAULT 'With over 8 years of experience in transforming spaces...',
  profile_image_url TEXT,
  phone TEXT DEFAULT '+1 (555) 123-4567',
  email TEXT DEFAULT 'vaishnavi@upadhyaydesign.com',
  years_experience TEXT DEFAULT '8+ Years',
  completed_projects TEXT DEFAULT '150+ Projects',
  specializations TEXT DEFAULT 'Residential & Commercial Design',
  philosophy TEXT DEFAULT 'Every space tells a story. My role is to help you write yours beautifully.',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-images',
  'portfolio-images', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for portfolio_data (everyone can read, only owners can modify)
ALTER TABLE public.portfolio_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view portfolio data" ON public.portfolio_data
FOR SELECT TO public USING (true);

CREATE POLICY "Only owners can modify portfolio data" ON public.portfolio_data
FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id::text = auth.uid()::text 
  AND users.role = 'owner'
));

-- RLS policies for projects (everyone can read, only owners can modify)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view projects" ON public.projects
FOR SELECT TO public USING (true);

CREATE POLICY "Only owners can modify projects" ON public.projects
FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id::text = auth.uid()::text 
  AND users.role = 'owner'
));

-- RLS policies for user_profile (everyone can read, only owners can modify)
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user profile" ON public.user_profile
FOR SELECT TO public USING (true);

CREATE POLICY "Only owners can modify user profile" ON public.user_profile
FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id::text = auth.uid()::text 
  AND users.role = 'owner'
));

-- Storage policies for portfolio images
CREATE POLICY "Anyone can view portfolio images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'portfolio-images');

CREATE POLICY "Only owners can upload portfolio images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-images' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id::text = auth.uid()::text 
    AND users.role = 'owner'
  )
);

CREATE POLICY "Only owners can update portfolio images" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'portfolio-images' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id::text = auth.uid()::text 
    AND users.role = 'owner'
  )
);

CREATE POLICY "Only owners can delete portfolio images" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'portfolio-images' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id::text = auth.uid()::text 
    AND users.role = 'owner'
  )
);

-- Insert default user profile data
INSERT INTO public.user_profile (name, title, bio, phone, email, years_experience, completed_projects, specializations, philosophy)
VALUES (
  'Vaishnavi Upadhyay',
  'Interior Designer & Space Planner',
  'With over 8 years of experience in transforming spaces, I specialize in creating harmonious environments that blend functionality with aesthetic appeal. My passion lies in understanding each client''s unique vision and bringing it to life through thoughtful design and meticulous attention to detail.',
  '+1 (555) 123-4567',
  'vaishnavi@upadhyaydesign.com',
  '8+ Years',
  '150+ Projects',
  'Residential & Commercial Design',
  'Every space tells a story. My role is to help you write yours beautifully.'
)
ON CONFLICT DO NOTHING;
