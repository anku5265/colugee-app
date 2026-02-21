-- Fix the security issue: Don't use user_metadata in RLS directly
-- Instead, use auth.uid() = user_id for own profile, and use a secure function for institution check

-- Drop the current policy
DROP POLICY IF EXISTS "Users can view own profile and same institution profiles" ON public.profiles;

-- Create a security definer function to safely get institution_id without recursion
-- This function runs as the definer (bypasses RLS) so it won't cause recursion
CREATE OR REPLACE FUNCTION public.get_profile_institution_id(target_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM public.profiles WHERE user_id = target_user_id LIMIT 1;
$$;

-- Create a safe policy using the security definer function
-- First check if it's their own profile (no recursion), 
-- then check if institutions match using the function
CREATE POLICY "Users can view own and same institution profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR institution_id = public.get_profile_institution_id(auth.uid())
);