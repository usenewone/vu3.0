/*
  # Add analytics and view tracking

  1. New Tables
    - `project_views` - Track project view counts and analytics
    - `contact_inquiries` - Store contact form submissions
    - `site_analytics` - General site analytics and metrics

  2. Analytics Features
    - Project popularity tracking
    - Contact form management
    - Site usage statistics
*/

-- Create project views tracking table
CREATE TABLE IF NOT EXISTS public.project_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  viewer_ip TEXT,
  viewer_location TEXT,
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMP DEFAULT NOW()
);

-- Create contact inquiries table
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  source TEXT DEFAULT 'website',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create site analytics table
CREATE TABLE IF NOT EXISTS public.site_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  metric_data JSONB,
  recorded_at TIMESTAMP DEFAULT NOW(),
  period_type TEXT DEFAULT 'daily' CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly'))
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_views_project_id ON public.project_views(project_id);
CREATE INDEX IF NOT EXISTS idx_project_views_viewed_at ON public.project_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON public.contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON public.contact_inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_site_analytics_metric_name ON public.site_analytics(metric_name);
CREATE INDEX IF NOT EXISTS idx_site_analytics_recorded_at ON public.site_analytics(recorded_at);

-- Add RLS policies
ALTER TABLE public.project_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;

-- Project views policies (public can insert, only owners can view details)
CREATE POLICY "Anyone can record project views" ON public.project_views
FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Only owners can view analytics" ON public.project_views
FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id::text = auth.uid()::text 
  AND users.role = 'owner'
));

-- Contact inquiries policies
CREATE POLICY "Anyone can submit inquiries" ON public.contact_inquiries
FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Only owners can view inquiries" ON public.contact_inquiries
FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id::text = auth.uid()::text 
  AND users.role = 'owner'
));

CREATE POLICY "Only owners can update inquiries" ON public.contact_inquiries
FOR UPDATE TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id::text = auth.uid()::text 
  AND users.role = 'owner'
));

-- Site analytics policies
CREATE POLICY "Only owners can view analytics" ON public.site_analytics
FOR SELECT TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id::text = auth.uid()::text 
  AND users.role = 'owner'
));

CREATE POLICY "System can insert analytics" ON public.site_analytics
FOR INSERT TO authenticated WITH CHECK (true);

-- Create a function to get project view counts
CREATE OR REPLACE FUNCTION get_project_view_count(project_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.project_views 
    WHERE project_id = project_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get popular projects
CREATE OR REPLACE FUNCTION get_popular_projects(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  project_id UUID,
  title TEXT,
  view_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    COUNT(pv.id) as view_count
  FROM public.projects p
  LEFT JOIN public.project_views pv ON p.id = pv.project_id
  WHERE p.is_active = true
  GROUP BY p.id, p.title
  ORDER BY view_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;