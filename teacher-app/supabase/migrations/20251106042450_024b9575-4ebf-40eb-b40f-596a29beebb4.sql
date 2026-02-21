-- Fix announcements RLS policies to check profile role instead of user_roles table

-- Drop existing policies
DROP POLICY IF EXISTS "Authorities can create announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authorities can update their own announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authorities can delete their own announcements" ON public.announcements;

-- Create new policies that check the profile role directly
CREATE POLICY "Authorities can create announcements"
ON public.announcements
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'authority'
  )
);

CREATE POLICY "Authorities can update their own announcements"
ON public.announcements
FOR UPDATE
USING (
  auth.uid() = created_by 
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'authority'
  )
);

CREATE POLICY "Authorities can delete their own announcements"
ON public.announcements
FOR DELETE
USING (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'authority'
  )
);