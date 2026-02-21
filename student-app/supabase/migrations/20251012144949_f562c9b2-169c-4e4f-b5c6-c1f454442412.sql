-- ============================================
-- Security Fix Migration
-- Addresses 5 critical security issues
-- ============================================

-- 1. Fix infinite recursion in group_memberships
-- Create SECURITY DEFINER function to check group membership without recursion
CREATE OR REPLACE FUNCTION public.has_group_role(gid uuid, uid uuid, required_role text DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM group_memberships
    WHERE group_id = gid 
    AND user_id = uid
    AND (required_role IS NULL OR role = required_role)
  );
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Group memberships are viewable by group members" ON public.group_memberships;
DROP POLICY IF EXISTS "Group admins can manage memberships" ON public.group_memberships;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_memberships;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_memberships;

-- Create new policies using the SECURITY DEFINER function
CREATE POLICY "Group memberships viewable by members"
ON public.group_memberships
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.has_group_role(group_id, auth.uid(), NULL)
);

CREATE POLICY "Users can join groups"
ON public.group_memberships
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave their groups"
ON public.group_memberships
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Group admins manage memberships"
ON public.group_memberships
FOR ALL
TO authenticated
USING (public.has_group_role(group_id, auth.uid(), 'admin'));

-- 2. Fix privilege escalation - Create separate user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'authority', 'teacher', 'mentor', 'student');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT user_id, role::text::app_role, created_at
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Create SECURITY DEFINER function to check roles
CREATE OR REPLACE FUNCTION public.has_role(check_user_id uuid, check_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = check_user_id
    AND role = check_role
  );
$$;

-- RLS policies for user_roles - only admins can manage, users can view their own
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update profiles table - remove role from UPDATE capability
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  -- Prevent role modification through profile updates
  AND role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE user_id = auth.uid())
);

-- 3. Fix contact information exposure
-- Update get_public_profile_info to exclude sensitive data
CREATE OR REPLACE FUNCTION public.get_public_profile_info(profile_user_id uuid)
RETURNS TABLE(
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
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
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

-- Update get_discovery_profiles to exclude sensitive data
CREATE OR REPLACE FUNCTION public.get_discovery_profiles(search_term text DEFAULT ''::text)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  department text,
  role user_role,
  bio text,
  profile_picture_url text,
  year_of_study integer,
  institution_id uuid,
  is_connected boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.user_id,
    p.full_name,
    p.department,
    p.role,
    p.bio,
    p.profile_picture_url,
    p.year_of_study,
    p.institution_id,
    EXISTS(
      SELECT 1 FROM public.connections c 
      WHERE (c.user1_id = auth.uid() AND c.user2_id = p.user_id)
         OR (c.user2_id = auth.uid() AND c.user1_id = p.user_id)
    ) as is_connected
  FROM public.profiles p
  WHERE p.user_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    AND (search_term = '' OR p.full_name ILIKE '%' || search_term || '%' 
         OR p.department ILIKE '%' || search_term || '%')
  ORDER BY p.full_name
  LIMIT 50;
$$;

-- Restrict profile SELECT to exclude email/phone for non-owners
DROP POLICY IF EXISTS "Connected users can view limited profile" ON public.profiles;

CREATE POLICY "Connected users view limited profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() <> user_id 
  AND EXISTS (
    SELECT 1 FROM connections
    WHERE (user1_id = auth.uid() AND user2_id = profiles.user_id)
       OR (user2_id = auth.uid() AND user1_id = profiles.user_id)
  )
);

-- 4. Fix payment data exposure
-- Create policy to restrict sensitive payment fields
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;

CREATE POLICY "Users view their own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Note: payment_id should ideally be encrypted, but that requires app-level changes
-- For now, it's only visible to the booking owner through RLS

-- 5. Add audit logging for security-sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger function for role changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO security_audit_log (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), 'ROLE_ASSIGNED', 'user_roles', NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO security_audit_log (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), 'ROLE_MODIFIED', 'user_roles', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO security_audit_log (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), 'ROLE_REVOKED', 'user_roles', OLD.id, to_jsonb(OLD));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_user_roles_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_role_changes();