/*
  # Add user relationship to projects table

  1. Changes
    - Add user_id column to projects table to link projects to specific users
    - Update RLS policies to allow users to manage their own projects
    - Add foreign key constraint to auth.users

  2. Security
    - Users can only view/edit their own projects
    - Owners can view all projects
    - Public can view all active projects
*/

-- Add user_id column to projects table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update RLS policies for projects to be more granular
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;
DROP POLICY IF EXISTS "Only owners can modify projects" ON public.projects;

-- Allow public to view active projects
CREATE POLICY "Anyone can view projects" ON public.projects
FOR SELECT TO public USING (is_active = true);

-- Allow owners to manage all projects
CREATE POLICY "Only owners can modify projects" ON public.projects
FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id::text = auth.uid()::text 
  AND users.role = 'owner'
));

-- Allow users to view their own projects
CREATE POLICY "Users can view own projects" ON public.projects
FOR SELECT TO public USING (auth.uid() = user_id);

-- Allow users to insert their own projects
CREATE POLICY "Users can insert own projects" ON public.projects
FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own projects
CREATE POLICY "Users can update own projects" ON public.projects
FOR UPDATE TO public USING (auth.uid() = user_id);

-- Allow users to delete their own projects
CREATE POLICY "Users can delete own projects" ON public.projects
FOR DELETE TO public USING (auth.uid() = user_id);