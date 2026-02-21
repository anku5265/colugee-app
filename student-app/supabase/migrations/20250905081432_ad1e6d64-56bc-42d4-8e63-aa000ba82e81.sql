-- Remove the remaining problematic policy that allows public access
DROP POLICY IF EXISTS "Public discovery of limited profile info" ON public.profiles;
DROP POLICY IF EXISTS "Connected users can view basic profile info" ON public.profiles;

-- Update the application to use the secure function for discovery instead of direct table access