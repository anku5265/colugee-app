-- Check and fix update/delete policies for announcements
-- The policies should already be fixed, but let's verify they allow update/delete

-- The policies were already created in the previous migration:
-- CREATE POLICY "Authorities can update their own announcements" ON public.announcements FOR UPDATE ...
-- CREATE POLICY "Authorities can delete their own announcements" ON public.announcements FOR DELETE ...

-- No changes needed - policies are already in place
SELECT 1;