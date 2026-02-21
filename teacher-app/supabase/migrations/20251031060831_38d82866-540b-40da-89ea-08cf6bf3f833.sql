-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can update non-sensitive profile fields" ON public.profiles;

-- Update the security definer function to only return protected fields
DROP FUNCTION IF EXISTS public.get_original_profile_values(uuid);

CREATE OR REPLACE FUNCTION public.get_original_protected_fields(target_user_id uuid)
RETURNS TABLE(
  full_name text,
  email text,
  student_id text,
  institution_roll_number text,
  department text,
  year_of_study integer,
  role user_role,
  institution_id uuid
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
    p.institution_id
  FROM profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- Recreate the policy to protect only critical fields
CREATE POLICY "Users can update non-sensitive profile fields" ON public.profiles
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.get_original_protected_fields(auth.uid()) orig
    WHERE 
      profiles.full_name = orig.full_name AND
      profiles.email = orig.email AND
      (profiles.student_id IS NOT DISTINCT FROM orig.student_id) AND
      (profiles.institution_roll_number IS NOT DISTINCT FROM orig.institution_roll_number) AND
      profiles.department = orig.department AND
      (profiles.year_of_study IS NOT DISTINCT FROM orig.year_of_study) AND
      profiles.role = orig.role AND
      (profiles.institution_id IS NOT DISTINCT FROM orig.institution_id)
  )
);