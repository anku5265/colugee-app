-- Drop the restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Authorities can view admin settings" ON public.admin_panel_settings;
DROP POLICY IF EXISTS "Authorities can update admin settings" ON public.admin_panel_settings;

CREATE POLICY "Authorities can view admin settings"
ON public.admin_panel_settings
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND profiles.role = 'authority'::user_role
));

CREATE POLICY "Authorities can update admin settings"
ON public.admin_panel_settings
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND profiles.role = 'authority'::user_role
));