-- Create function to accept connection requests
CREATE OR REPLACE FUNCTION accept_connection_request(request_id UUID)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage bucket for resources
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true);

-- Create policies for resource uploads
CREATE POLICY "Users can view all resource files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'resources');

CREATE POLICY "Authenticated users can upload resources" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'resources' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own resource files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own resource files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create resources table for metadata
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'document',
  file_url TEXT NOT NULL,
  file_size INTEGER,
  downloads_count INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0.0,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on resources table
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create policies for resources table
CREATE POLICY "Resources are viewable by everyone" 
ON public.resources 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own resources" 
ON public.resources 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resources" 
ON public.resources 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resources" 
ON public.resources 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();