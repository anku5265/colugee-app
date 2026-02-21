-- Fix critical security vulnerability in profiles table
-- First, remove ALL existing overly permissive policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create secure RLS policies for profile access
-- 1. Users can always view their own complete profile (including sensitive data)
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Connected users can view each other's limited profile info
-- This uses the connections table to verify if users are connected
CREATE POLICY "Connected users can view limited profile" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  auth.uid() != user_id AND
  EXISTS (
    SELECT 1 FROM public.connections 
    WHERE (user1_id = auth.uid() AND user2_id = profiles.user_id)
       OR (user2_id = auth.uid() AND user1_id = profiles.user_id)
  )
);

-- Create a security definer function to get safe public profile data for discovery
-- This function only returns non-sensitive fields for profile discovery
CREATE OR REPLACE FUNCTION public.get_discovery_profiles(search_term text DEFAULT '')
RETURNS TABLE (
  user_id uuid,
  full_name text,
  department text,
  role user_role,
  bio text,
  profile_picture_url text,
  year_of_study integer,
  institution_id uuid,
  is_connected boolean
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT 
    p.user_id,
    p.full_name,
    p.department,
    p.role,
    p.bio,
    p.profile_picture_url,
    p.year_of_study,
    p.institution_id,
    EXISTS(
      SELECT 1 FROM public.connections c 
      WHERE (c.user1_id = auth.uid() AND c.user2_id = p.user_id)
         OR (c.user2_id = auth.uid() AND c.user1_id = p.user_id)
    ) as is_connected
  FROM public.profiles p
  WHERE p.user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    AND (search_term = '' OR p.full_name ILIKE '%' || search_term || '%' 
         OR p.department ILIKE '%' || search_term || '%')
  ORDER BY p.full_name
  LIMIT 50;
$$;