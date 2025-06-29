/*
  # Fix user authentication and project ownership

  1. Database Changes
    - Add user_id column to projects table linking to auth.users
    - Create profiles table for authenticated users
    - Add trigger function for new user registration

  2. Security Updates
    - Update RLS policies for projects to allow user ownership
    - Enable RLS on profiles table with appropriate policies
    - Allow users to manage their own projects and profiles

  3. Important Notes
    - Uses IF NOT EXISTS and DROP IF EXISTS to prevent conflicts
    - Maintains backward compatibility with existing data
    - Ensures proper foreign key relationships
*/

-- Add user_id column to projects table to link projects to auth users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update RLS policies for projects to allow users to manage their own projects
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

-- Allow users to view their own projects
CREATE POLICY "Users can view own projects" ON public.projects
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Allow users to insert their own projects
CREATE POLICY "Users can insert own projects" ON public.projects
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own projects
CREATE POLICY "Users can update own projects" ON public.projects
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own projects
CREATE POLICY "Users can delete own projects" ON public.projects
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create profiles table for auth users if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Allow users to view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO public USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO public USING (auth.uid() = id);

-- Create or replace function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();