-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can update non-sensitive profile fields" ON public.profiles;

-- Create security definer function to get original profile values
CREATE OR REPLACE FUNCTION public.get_original_profile_values(target_user_id uuid)
RETURNS TABLE(
  full_name text,
  email text,
  student_id text,
  institution_roll_number text,
  department text,
  year_of_study integer,
  role user_role,
  institution_id uuid,
  phone_number text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.full_name,
    p.email,
    p.student_id,
    p.institution_roll_number,
    p.department,
    p.year_of_study,
    p.role,
    p.institution_id,
    p.phone_number
  FROM profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Users can update non-sensitive profile fields" ON public.profiles
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.get_original_profile_values(auth.uid()) orig
    WHERE 
      profiles.full_name = orig.full_name AND
      profiles.email = orig.email AND
      profiles.student_id = orig.student_id AND
      profiles.institution_roll_number = orig.institution_roll_number AND
      profiles.department = orig.department AND
      profiles.year_of_study = orig.year_of_study AND
      profiles.role = orig.role AND
      profiles.institution_id = orig.institution_id AND
      profiles.phone_number = orig.phone_number
  )
);