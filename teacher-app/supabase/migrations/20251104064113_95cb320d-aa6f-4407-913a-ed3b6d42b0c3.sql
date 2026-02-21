-- Add foreign key constraints for connections table
ALTER TABLE public.connections
ADD CONSTRAINT connections_user1_id_fkey 
FOREIGN KEY (user1_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.connections
ADD CONSTRAINT connections_user2_id_fkey 
FOREIGN KEY (user2_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key constraint for announcements table
ALTER TABLE public.announcements
ADD CONSTRAINT announcements_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;