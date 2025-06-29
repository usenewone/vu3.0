/*
  # Add Education Table and Fix Save Functionality

  1. New Tables
    - `education_entries`
      - `id` (uuid, primary key)
      - `period` (text)
      - `degree` (text)
      - `institution` (text)
      - `description` (text)
      - `order_index` (integer)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `education_entries` table
    - Add policies for public viewing and owner editing
*/

-- Create education_entries table
CREATE TABLE IF NOT EXISTS public.education_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL DEFAULT '',
  degree TEXT NOT NULL DEFAULT '',
  institution TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.education_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view education entries" ON public.education_entries;
DROP POLICY IF EXISTS "Only owners can modify education entries" ON public.education_entries;

-- Allow anyone to view active education entries
CREATE POLICY "Anyone can view education entries" ON public.education_entries
FOR SELECT TO public USING (is_active = true);

-- Allow owners to modify education entries
CREATE POLICY "Only owners can modify education entries" ON public.education_entries
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id::text = auth.uid()::text 
    AND users.role = 'owner'
  )
);

-- Insert default education data
INSERT INTO public.education_entries (period, degree, institution, description, order_index) VALUES
('2014 - 2018', 'Bachelor of Design', 'Borcelle University', 'Comprehensive study in interior design principles, space planning, color theory, and sustainable design practices. Graduated with honors.', 1),
('2015 - 2019', 'Bachelor of Design', 'Salford & Co. University', 'Advanced coursework in commercial design, project management, and client relations. Specialized in hospitality and retail design.', 2)
ON CONFLICT DO NOTHING;