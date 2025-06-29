/*
  # Update portfolio_data RLS policies for proper authentication

  1. Security Changes
    - Update RLS policies to work with Supabase's built-in authentication
    - Ensure authenticated users can modify portfolio data
    - Keep public read access for portfolio content
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view portfolio data" ON portfolio_data;
DROP POLICY IF EXISTS "Only owners can modify portfolio data" ON portfolio_data;

-- Create new policies that work with Supabase auth
CREATE POLICY "Anyone can view portfolio data"
  ON portfolio_data
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can modify portfolio data"
  ON portfolio_data
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also update user_profile policies to work with authenticated users
DROP POLICY IF EXISTS "Only owners can modify user profile" ON user_profile;
DROP POLICY IF EXISTS "Authenticated users can update profile" ON user_profile;
DROP POLICY IF EXISTS "Authenticated users can view profile" ON user_profile;

CREATE POLICY "Authenticated users can manage user profile"
  ON user_profile
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);