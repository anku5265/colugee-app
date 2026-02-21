-- Create announcements table
CREATE TABLE public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  announcement_type text NOT NULL CHECK (announcement_type IN ('department_update', 'college_circular', 'club_event', 'authority_alert')),
  created_by uuid NOT NULL,
  institution_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Announcements are viewable by everyone in the same institution
CREATE POLICY "Announcements are viewable by authenticated users"
ON public.announcements
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only authorities can create announcements
CREATE POLICY "Authorities can create announcements"
ON public.announcements
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'authority'::app_role
  )
);

-- Only authorities can update their own announcements
CREATE POLICY "Authorities can update their own announcements"
ON public.announcements
FOR UPDATE
USING (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'authority'::app_role
  )
);

-- Only authorities can delete their own announcements
CREATE POLICY "Authorities can delete their own announcements"
ON public.announcements
FOR DELETE
USING (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'authority'::app_role
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();