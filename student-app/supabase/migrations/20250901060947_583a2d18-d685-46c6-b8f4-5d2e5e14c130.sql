-- Fix security definer function search path
CREATE OR REPLACE FUNCTION public.accept_connection_request(request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_sender UUID;
  req_receiver UUID;
BEGIN
  -- Get request details
  SELECT sender_id, receiver_id INTO req_sender, req_receiver
  FROM public.connection_requests
  WHERE id = request_id AND receiver_id = auth.uid() AND status = 'pending';
  
  IF req_sender IS NULL THEN
    RAISE EXCEPTION 'Connection request not found or unauthorized';
  END IF;
  
  -- Update request status
  UPDATE public.connection_requests
  SET status = 'accepted', updated_at = now()
  WHERE id = request_id;
  
  -- Create connection (ensure consistent ordering)
  INSERT INTO public.connections (user1_id, user2_id)
  VALUES (
    LEAST(req_sender, req_receiver),
    GREATEST(req_sender, req_receiver)
  )
  ON CONFLICT (user1_id, user2_id) DO NOTHING;
  
  -- Update connections count for both users
  UPDATE public.profiles 
  SET connections_count = connections_count + 1
  WHERE user_id IN (req_sender, req_receiver);
END;
$$;

-- Fix existing handle_new_user function search path
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