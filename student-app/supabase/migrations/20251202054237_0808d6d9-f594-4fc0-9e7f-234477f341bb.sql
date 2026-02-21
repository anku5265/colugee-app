-- Create authority audit log table for tracking all authority actions
CREATE TABLE public.authority_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  authority_user_id uuid NOT NULL,
  action_type text NOT NULL, -- 'login', 'add_user', 'edit_user', 'delete_user', 'export', 'import'
  target_user_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.authority_audit_log ENABLE ROW LEVEL SECURITY;

-- Only authorities can view audit logs
CREATE POLICY "Authorities can view audit logs"
ON public.authority_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'authority'
  )
);

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.authority_audit_log
FOR INSERT
WITH CHECK (true);

-- Create admin panel settings table
CREATE TABLE public.admin_panel_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Enable RLS
ALTER TABLE public.admin_panel_settings ENABLE ROW LEVEL SECURITY;

-- Authorities can view settings
CREATE POLICY "Authorities can view admin settings"
ON public.admin_panel_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'authority'
  )
);

-- Authorities can update settings
CREATE POLICY "Authorities can update admin settings"
ON public.admin_panel_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'authority'
  )
);

-- Insert default password (admin123)
INSERT INTO public.admin_panel_settings (setting_key, setting_value)
VALUES ('admin_panel_password', 'admin123');

-- Add section and branch columns to profiles if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS section text,
ADD COLUMN IF NOT EXISTS branch text;

-- Create function to log authority actions
CREATE OR REPLACE FUNCTION public.log_authority_action(
  p_action_type text,
  p_target_user_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.authority_audit_log (
    authority_user_id,
    action_type,
    target_user_id,
    details
  )
  VALUES (
    auth.uid(),
    p_action_type,
    p_target_user_id,
    p_details
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;