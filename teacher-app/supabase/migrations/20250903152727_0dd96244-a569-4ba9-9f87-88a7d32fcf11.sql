-- Fix the search path for the function
CREATE OR REPLACE FUNCTION accept_connection_request(request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    req_record connection_requests;
BEGIN
    -- Get the connection request
    SELECT * INTO req_record FROM connection_requests WHERE id = request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Connection request not found';
    END IF;
    
    -- Update the request status to accepted
    UPDATE connection_requests 
    SET status = 'accepted', updated_at = now()
    WHERE id = request_id;
    
    -- Create the connection
    INSERT INTO connections (user1_id, user2_id)
    VALUES (req_record.sender_id, req_record.receiver_id);
    
    -- Update connection counts for both users
    UPDATE profiles 
    SET connections_count = connections_count + 1
    WHERE user_id IN (req_record.sender_id, req_record.receiver_id);
    
END;
$$;