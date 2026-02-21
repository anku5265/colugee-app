-- Drop the problematic SELECT policies that cause recursion
DROP POLICY IF EXISTS "Users can view profiles from same institution" ON public.profiles;
DROP POLICY IF EXISTS "Connected users view limited profile" ON public.profiles;

-- Create a simple, non-recursive SELECT policy for profiles
-- Users can view their own profile OR profiles from the same institution (using JWT metadata)
CREATE POLICY "Users can view own profile and same institution profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR institution_id = (auth.jwt() -> 'user_metadata' ->> 'institution_id')::uuid
);

-- Also need to ensure "Users can view own profile" doesn't conflict
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;