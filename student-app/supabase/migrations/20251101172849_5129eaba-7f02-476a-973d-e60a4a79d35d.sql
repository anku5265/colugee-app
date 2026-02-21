-- Allow all authenticated users to view basic public profile information
-- This is needed for displaying author names in feeds, posts, comments, etc.
CREATE POLICY "Users can view basic public profile info"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);