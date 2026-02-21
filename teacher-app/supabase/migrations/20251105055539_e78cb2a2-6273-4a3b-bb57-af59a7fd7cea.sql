-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  action_type text,
  action_id uuid,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_description text,
  p_action_type text DEFAULT NULL,
  p_action_id uuid DEFAULT NULL,
  p_created_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    description,
    action_type,
    action_id,
    created_by
  )
  VALUES (
    p_user_id,
    p_type,
    p_title,
    p_description,
    p_action_type,
    p_action_id,
    p_created_by
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Trigger function for connection request notifications
CREATE OR REPLACE FUNCTION public.notify_connection_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name text;
BEGIN
  -- Get sender's name
  SELECT full_name INTO sender_name
  FROM public.profiles
  WHERE user_id = NEW.sender_id;
  
  -- Create notification for receiver
  PERFORM create_notification(
    NEW.receiver_id,
    'connection_request',
    'New Connection Request',
    sender_name || ' wants to connect with you',
    'connection_request',
    NEW.id,
    NEW.sender_id
  );
  
  RETURN NEW;
END;
$$;

-- Trigger function for connection accepted notifications
CREATE OR REPLACE FUNCTION public.notify_connection_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  receiver_name text;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Get receiver's name
    SELECT full_name INTO receiver_name
    FROM public.profiles
    WHERE user_id = NEW.receiver_id;
    
    -- Create notification for sender
    PERFORM create_notification(
      NEW.sender_id,
      'connection_accepted',
      'Connection Accepted',
      receiver_name || ' accepted your connection request',
      'connection',
      NEW.id,
      NEW.receiver_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS on_connection_request_created ON public.connection_requests;
CREATE TRIGGER on_connection_request_created
  AFTER INSERT ON public.connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_connection_request();

DROP TRIGGER IF EXISTS on_connection_request_updated ON public.connection_requests;
CREATE TRIGGER on_connection_request_updated
  AFTER UPDATE ON public.connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_connection_accepted();

-- Update updated_at trigger
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();