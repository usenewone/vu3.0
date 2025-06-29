/*
  # Create owner user for authentication

  1. New User
    - Create user with username 'vaishnavi' and password '789456123'
    - Set role as 'owner'
    - Enable authentication for portfolio management

  2. Security
    - User can authenticate and manage portfolio content
    - Owner role provides full access to edit functionality
*/

-- Insert the owner user
INSERT INTO public.users (username, password, role, created_at)
VALUES (
  'vaishnavi',
  '789456123',
  'owner',
  NOW()
)
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  created_at = EXCLUDED.created_at;

-- Ensure the user profile exists with default data
INSERT INTO public.user_profile (
  name, 
  title, 
  bio, 
  phone, 
  email, 
  years_experience, 
  completed_projects, 
  specializations, 
  philosophy,
  updated_at
)
VALUES (
  'Vaishnavi Upadhyay',
  'Interior Designer & Space Planner',
  'With over 8 years of experience in transforming spaces, I specialize in creating harmonious environments that blend functionality with aesthetic appeal. My passion lies in understanding each client''s unique vision and bringing it to life through thoughtful design and meticulous attention to detail.',
  '+1 (555) 123-4567',
  'vaishnavi@upadhyaydesign.com',
  '8+ Years',
  '150+ Projects',
  'Residential & Commercial Design',
  'Every space tells a story. My role is to help you write yours beautifully.',
  NOW()
)
ON CONFLICT DO NOTHING;