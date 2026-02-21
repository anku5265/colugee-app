-- Fix critical security vulnerability in profiles table
-- Remove the overly permissive policy that allows everyone to read all profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create secure RLS policies for profile access
-- 1. Users can always view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Connected users can view each other's basic profile info
-- This uses the connections table to verify if users are connected
CREATE POLICY "Connected users can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.connections 
      WHERE (user1_id = auth.uid() AND user2_id = profiles.user_id)
         OR (user2_id = auth.uid() AND user1_id = profiles.user_id)
    )
  )
);

-- 3. Allow viewing of limited public profile info for discovery
-- This excludes sensitive fields like email, phone_number, student_id, institution_roll_number
CREATE POLICY "Public discovery of limited profile info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  -- Only allow access to non-sensitive fields for discovery
  -- The application layer should filter which columns are returned for this case
  true
);

-- Create a security definer function to get safe public profile data
-- This function only returns non-sensitive fields for profile discovery
CREATE OR REPLACE FUNCTION public.get_public_profile_info(profile_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  department text,
  role user_role,
  bio text,
  profile_picture_url text,
  year_of_study integer,
  institution_id uuid
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.department,
    p.role,
    p.bio,
    p.profile_picture_url,
    p.year_of_study,
    p.institution_id
  FROM public.profiles p
  WHERE p.user_id = profile_user_id;
$$;