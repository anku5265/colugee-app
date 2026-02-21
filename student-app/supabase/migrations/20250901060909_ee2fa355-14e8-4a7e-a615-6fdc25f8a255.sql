-- Create connection requests table
CREATE TABLE public.connection_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Create connections table for accepted connections
CREATE TABLE public.connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id) -- Ensure consistent ordering
);

-- Create study groups table
CREATE TABLE public.study_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  type TEXT NOT NULL DEFAULT 'virtual' CHECK (type IN ('virtual', 'in-person', 'hybrid')),
  location TEXT,
  max_members INTEGER DEFAULT 50,
  current_members INTEGER DEFAULT 1,
  tags TEXT[],
  image_url TEXT,
  created_by UUID NOT NULL,
  institution_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  meeting_schedule TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group memberships table
CREATE TABLE public.group_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connection_requests
CREATE POLICY "Users can view their connection requests" 
ON public.connection_requests 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create connection requests" 
ON public.connection_requests 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their connection requests" 
ON public.connection_requests 
FOR UPDATE 
USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- RLS Policies for connections
CREATE POLICY "Users can view their connections" 
ON public.connections 
FOR SELECT 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create connections" 
ON public.connections 
FOR INSERT 
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for study_groups
CREATE POLICY "Study groups are viewable by everyone" 
ON public.study_groups 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create study groups" 
ON public.study_groups 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can manage their groups" 
ON public.study_groups 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups" 
ON public.study_groups 
FOR DELETE 
USING (auth.uid() = created_by);

-- RLS Policies for group_memberships
CREATE POLICY "Group memberships are viewable by group members" 
ON public.group_memberships 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.group_memberships gm 
    WHERE gm.group_id = group_memberships.group_id 
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join groups" 
ON public.group_memberships 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" 
ON public.group_memberships 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Group admins can manage memberships" 
ON public.group_memberships 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.group_memberships gm 
    WHERE gm.group_id = group_memberships.group_id 
    AND gm.user_id = auth.uid() 
    AND gm.role = 'admin'
  )
);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_connection_requests_updated_at
BEFORE UPDATE ON public.connection_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_groups_updated_at
BEFORE UPDATE ON public.study_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle connection acceptance
CREATE OR REPLACE FUNCTION public.accept_connection_request(request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
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