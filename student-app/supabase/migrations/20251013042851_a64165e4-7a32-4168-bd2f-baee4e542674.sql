-- Update handle_new_user function to include year_of_study
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    full_name,
    email,
    role,
    institution_id,
    institution_roll_number,
    department,
    year_of_study
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email,
    (NEW.raw_user_meta_data ->> 'role')::user_role,
    (NEW.raw_user_meta_data ->> 'institution_id')::uuid,
    NEW.raw_user_meta_data ->> 'institution_roll_number',
    COALESCE(NEW.raw_user_meta_data ->> 'department', 'Not Specified'),
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'year_of_study' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'year_of_study')::integer
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$;