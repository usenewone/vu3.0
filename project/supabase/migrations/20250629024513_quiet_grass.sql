/*
  # Fix Projects Table RLS Policies

  1. Problem
    - The projects table has conflicting RLS policies for public access
    - "Anyone can view projects" policy conflicts with user-specific policies
    - uid() function returns null for unauthenticated users causing fetch failures

  2. Solution
    - Simplify RLS policies to allow public read access to active projects
    - Keep owner-only policies for modifications
    - Ensure public users can view projects without authentication

  3. Changes
    - Drop conflicting policies
    - Create clear, non-conflicting policies for public and authenticated access
*/

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Only owners can modify projects" ON projects;

-- Create new clear policies
-- Allow anyone (including unauthenticated users) to view active projects
CREATE POLICY "Public can view active projects"
  ON projects
  FOR SELECT
  TO public
  USING (is_active = true);

-- Allow authenticated users to view their own projects (including inactive ones)
CREATE POLICY "Users can view own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own projects
CREATE POLICY "Users can insert own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own projects
CREATE POLICY "Users can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow owners to manage all projects
CREATE POLICY "Owners can manage all projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND users.role = 'owner'
    )
  );