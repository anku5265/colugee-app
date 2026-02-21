-- Fix infinite recursion by getting institution_id from JWT metadata instead of querying profiles
CREATE OR REPLACE FUNCTION public.get_user_institution_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'institution_id')::uuid,
    (SELECT institution_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  );
$$;