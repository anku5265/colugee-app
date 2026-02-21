-- Add authority role to user_role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'authority') THEN
    ALTER TYPE user_role ADD VALUE 'authority';
  END IF;
END $$;

-- Drop existing profile update policies
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Connected users view limited profile" ON profiles;

-- Create new RLS policies for profiles with authority control
-- Authority can update ALL fields for ANY user
CREATE POLICY "Authority can update all profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'authority'::app_role
  )
);

-- Users can only update non-sensitive fields (bio, profile_picture_url, cover_picture_url, links)
CREATE POLICY "Users can update non-sensitive profile fields"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND (
    -- Only non-sensitive fields can be updated
    (full_name IS NOT DISTINCT FROM (SELECT full_name FROM profiles WHERE user_id = auth.uid()))
    AND (email IS NOT DISTINCT FROM (SELECT email FROM profiles WHERE user_id = auth.uid()))
    AND (student_id IS NOT DISTINCT FROM (SELECT student_id FROM profiles WHERE user_id = auth.uid()))
    AND (institution_roll_number IS NOT DISTINCT FROM (SELECT institution_roll_number FROM profiles WHERE user_id = auth.uid()))
    AND (department IS NOT DISTINCT FROM (SELECT department FROM profiles WHERE user_id = auth.uid()))
    AND (year_of_study IS NOT DISTINCT FROM (SELECT year_of_study FROM profiles WHERE user_id = auth.uid()))
    AND (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE user_id = auth.uid()))
    AND (institution_id IS NOT DISTINCT FROM (SELECT institution_id FROM profiles WHERE user_id = auth.uid()))
    AND (phone_number IS NOT DISTINCT FROM (SELECT phone_number FROM profiles WHERE user_id = auth.uid()))
  )
);

-- Recreate view policy for connected users
CREATE POLICY "Connected users view limited profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  (auth.uid() IS NOT NULL) 
  AND (auth.uid() <> user_id) 
  AND (
    EXISTS (
      SELECT 1 FROM connections
      WHERE ((connections.user1_id = auth.uid() AND connections.user2_id = profiles.user_id)
         OR (connections.user2_id = auth.uid() AND connections.user1_id = profiles.user_id))
    )
  )
);

-- Authority can manage all skills
CREATE POLICY "Authority can manage all skills"
ON skills
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'authority'::app_role
  )
);

-- Authority can manage all experience
CREATE POLICY "Authority can manage all experience"
ON experience
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'authority'::app_role
  )
);

-- Authority can manage all projects
CREATE POLICY "Authority can manage all projects"
ON projects
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'authority'::app_role
  )
);

-- Authority can manage all education details
CREATE POLICY "Authority can manage all education"
ON education_details
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'authority'::app_role
  )
);

-- Authority can manage all certificates
CREATE POLICY "Authority can manage all certificates"
ON certificates
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'authority'::app_role
  )
);