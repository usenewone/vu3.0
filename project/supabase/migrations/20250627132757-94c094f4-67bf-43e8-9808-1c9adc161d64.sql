
-- First, let's make sure the users table has the right structure
-- Add RLS policies for security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own data
CREATE POLICY "Users can view own data" ON public.users
FOR SELECT USING (auth.uid()::text = id::text OR role = 'owner');

-- Create policy for users to update their own data
CREATE POLICY "Users can update own data" ON public.users
FOR UPDATE USING (auth.uid()::text = id::text);

-- Add RLS to portfolio_content table
ALTER TABLE public.portfolio_content ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read portfolio content (for guest access)
CREATE POLICY "Anyone can view portfolio content" ON public.portfolio_content
FOR SELECT TO public USING (true);

-- Only allow authenticated users with owner role to modify content
CREATE POLICY "Only owners can modify portfolio content" ON public.portfolio_content
FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id::text = auth.uid()::text 
  AND users.role = 'owner'
));
