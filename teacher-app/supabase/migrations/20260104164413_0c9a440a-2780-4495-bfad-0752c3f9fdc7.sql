-- Create function to decrement connections count
CREATE OR REPLACE FUNCTION public.decrement_connections_count(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles 
  SET connections_count = GREATEST(0, COALESCE(connections_count, 0) - 1)
  WHERE user_id = user_id_param;
END;
$$;