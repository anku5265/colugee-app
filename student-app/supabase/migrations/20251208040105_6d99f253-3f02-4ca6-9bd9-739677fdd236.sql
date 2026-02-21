-- Fix infinite recursion by making get_user_institution_id() bypass RLS
CREATE OR REPLACE FUNCTION public.get_user_institution_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;