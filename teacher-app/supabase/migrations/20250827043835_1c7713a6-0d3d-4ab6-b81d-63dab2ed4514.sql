-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    full_name,
    email,
    role,
    institution_id,
    institution_roll_number,
    department
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email,
    (NEW.raw_user_meta_data ->> 'role')::user_role,
    (NEW.raw_user_meta_data ->> 'institution_id')::uuid,
    NEW.raw_user_meta_data ->> 'institution_roll_number',
    COALESCE(NEW.raw_user_meta_data ->> 'department', 'General')
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();