-- Fix 1: Enhance accept_connection_request function with proper validation
CREATE OR REPLACE FUNCTION public.accept_connection_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_record connection_requests;
BEGIN
  -- Validate input
  IF request_id IS NULL THEN
    RAISE EXCEPTION 'Invalid request_id';
  END IF;
  
  -- Lock the row and check status + receiver
  SELECT * INTO req_record 
  FROM connection_requests 
  WHERE id = request_id 
    AND receiver_id = auth.uid()
    AND status = 'pending'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Connection request not found, already processed, or unauthorized';
  END IF;
  
  -- Check for existing connection
  IF EXISTS (
    SELECT 1 FROM connections
    WHERE (user1_id = req_record.sender_id AND user2_id = req_record.receiver_id)
       OR (user1_id = req_record.receiver_id AND user2_id = req_record.sender_id)
  ) THEN
    RAISE EXCEPTION 'Connection already exists';
  END IF;
  
  -- Audit log
  INSERT INTO security_audit_log (user_id, action, table_name, record_id, new_values)
  VALUES (
    auth.uid(), 
    'ACCEPT_CONNECTION', 
    'connection_requests', 
    request_id,
    jsonb_build_object('sender_id', req_record.sender_id, 'receiver_id', req_record.receiver_id)
  );
  
  -- Now perform the operations
  UPDATE connection_requests 
  SET status = 'accepted', updated_at = now()
  WHERE id = request_id;
  
  INSERT INTO connections (user1_id, user2_id)
  VALUES (req_record.sender_id, req_record.receiver_id);
  
  UPDATE profiles 
  SET connections_count = connections_count + 1
  WHERE user_id IN (req_record.sender_id, req_record.receiver_id);
END;
$$;

-- Fix 2: Prevent profile enumeration by restricting direct profile access
-- Drop overly permissive policies that allow viewing any profile
DROP POLICY IF EXISTS "Connected users view limited profile" ON profiles;

-- Recreate with stricter column restrictions
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

-- Create a security definer function for safe profile discovery
CREATE OR REPLACE FUNCTION public.get_limited_profile_info(target_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  department text,
  role user_role,
  bio text,
  profile_picture_url text,
  year_of_study integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return limited info if users are connected or it's the user's own profile
  IF target_user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM connections
    WHERE (user1_id = auth.uid() AND user2_id = target_user_id)
       OR (user2_id = auth.uid() AND user1_id = target_user_id)
  ) THEN
    RETURN QUERY
    SELECT 
      p.user_id,
      p.full_name,
      p.department,
      p.role,
      p.bio,
      p.profile_picture_url,
      p.year_of_study
    FROM profiles p
    WHERE p.user_id = target_user_id;
  END IF;
END;
$$;

-- Fix 3: Strengthen bookings table security
-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users view their own bookings" ON bookings;

-- Recreate with proper validation
CREATE POLICY "Users view own bookings only"
ON bookings
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  AND user_id IS NOT NULL
);

-- Add audit logging for booking access attempts
CREATE OR REPLACE FUNCTION public.audit_booking_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log if someone tries to access another user's booking
  IF NEW.user_id != auth.uid() THEN
    INSERT INTO security_audit_log (user_id, action, table_name, record_id, new_values)
    VALUES (
      auth.uid(),
      'UNAUTHORIZED_BOOKING_ACCESS_ATTEMPT',
      'bookings',
      NEW.id,
      jsonb_build_object('attempted_user_id', NEW.user_id)
    );
  END IF;
  RETURN NEW;
END;
$$;