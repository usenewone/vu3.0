/*
  # Add comprehensive RLS policies for profiles table

  1. Security Updates
    - Add RLS policies for the profiles table
    - Ensure users can only access their own profile data
    - Allow authenticated users to update their profiles

  2. Profile Management
    - Users can view and update their own profiles
    - Profiles are automatically created when users sign up
*/

-- Enable RLS on profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update profile" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO public USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO public USING (auth.uid() = id);

-- Add policy for user_profile table to allow authenticated users to update
DROP POLICY IF EXISTS "Authenticated users can view profile" ON public.user_profile;
DROP POLICY IF EXISTS "Authenticated users can update profile" ON public.user_profile;

CREATE POLICY "Authenticated users can view profile" ON public.user_profile
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update profile" ON public.user_profile
FOR UPDATE TO authenticated USING (true);