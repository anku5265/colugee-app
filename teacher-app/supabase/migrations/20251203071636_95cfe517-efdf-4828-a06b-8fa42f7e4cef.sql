-- Add institution_id to tables that don't have it yet
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id);
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id);
ALTER TABLE public.campus_events ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id);
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id);

-- Create function to get user's institution_id
CREATE OR REPLACE FUNCTION public.get_user_institution_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Update profiles RLS - users can only see profiles from same institution
DROP POLICY IF EXISTS "Users can view basic public profile info" ON public.profiles;
CREATE POLICY "Users can view profiles from same institution"
ON public.profiles FOR SELECT
USING (
  institution_id = get_user_institution_id() 
  OR auth.uid() = user_id
  OR auth.uid() IS NULL
);

-- Update posts RLS - institution isolated
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts viewable by same institution"
ON public.posts FOR SELECT
USING (institution_id = get_user_institution_id() OR institution_id IS NULL);

DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
CREATE POLICY "Users can create posts in their institution"
ON public.posts FOR INSERT
WITH CHECK (auth.uid() = author_id AND institution_id = get_user_institution_id());

-- Update resources RLS - institution isolated
DROP POLICY IF EXISTS "Resources are viewable by everyone" ON public.resources;
CREATE POLICY "Resources viewable by same institution"
ON public.resources FOR SELECT
USING (institution_id = get_user_institution_id() OR institution_id IS NULL);

DROP POLICY IF EXISTS "Users can create their own resources" ON public.resources;
CREATE POLICY "Users can create resources in their institution"
ON public.resources FOR INSERT
WITH CHECK (auth.uid() = user_id AND institution_id = get_user_institution_id());

-- Update study_groups RLS - institution isolated
DROP POLICY IF EXISTS "Study groups are viewable by everyone" ON public.study_groups;
CREATE POLICY "Study groups viewable by same institution"
ON public.study_groups FOR SELECT
USING (institution_id = get_user_institution_id() OR institution_id IS NULL);

DROP POLICY IF EXISTS "Users can create study groups" ON public.study_groups;
CREATE POLICY "Users can create study groups in their institution"
ON public.study_groups FOR INSERT
WITH CHECK (auth.uid() = created_by AND institution_id = get_user_institution_id());

-- Update campus_events RLS - institution isolated
DROP POLICY IF EXISTS "Campus events are viewable by everyone" ON public.campus_events;
CREATE POLICY "Campus events viewable by same institution"
ON public.campus_events FOR SELECT
USING (institution_id = get_user_institution_id() OR institution_id IS NULL);

DROP POLICY IF EXISTS "Users can manage their own events" ON public.campus_events;
CREATE POLICY "Users can create events in their institution"
ON public.campus_events FOR INSERT
WITH CHECK (auth.uid() = created_by AND institution_id = get_user_institution_id());

CREATE POLICY "Users can update their own events"
ON public.campus_events FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events"
ON public.campus_events FOR DELETE
USING (auth.uid() = created_by);

-- Update connections RLS - only connect within same institution
DROP POLICY IF EXISTS "Users can view their connections" ON public.connections;
CREATE POLICY "Users can view connections in same institution"
ON public.connections FOR SELECT
USING (
  (auth.uid() = user1_id OR auth.uid() = user2_id)
  AND EXISTS (
    SELECT 1 FROM profiles p1, profiles p2 
    WHERE p1.user_id = user1_id AND p2.user_id = user2_id 
    AND p1.institution_id = p2.institution_id
  )
);

-- Update connection_requests RLS - only request within same institution  
DROP POLICY IF EXISTS "Users can view their connection requests" ON public.connection_requests;
CREATE POLICY "Users can view connection requests in same institution"
ON public.connection_requests FOR SELECT
USING (
  (auth.uid() = sender_id OR auth.uid() = receiver_id)
  AND EXISTS (
    SELECT 1 FROM profiles p1, profiles p2 
    WHERE p1.user_id = sender_id AND p2.user_id = receiver_id 
    AND p1.institution_id = p2.institution_id
  )
);

DROP POLICY IF EXISTS "Users can create connection requests" ON public.connection_requests;
CREATE POLICY "Users can create connection requests in same institution"
ON public.connection_requests FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM profiles p1, profiles p2 
    WHERE p1.user_id = sender_id AND p2.user_id = receiver_id 
    AND p1.institution_id = p2.institution_id
  )
);

-- Update announcements RLS - institution isolated
DROP POLICY IF EXISTS "Announcements are viewable by authenticated users" ON public.announcements;
CREATE POLICY "Announcements viewable by same institution"
ON public.announcements FOR SELECT
USING (institution_id = get_user_institution_id() OR institution_id IS NULL);

DROP POLICY IF EXISTS "Authorities can create announcements" ON public.announcements;
CREATE POLICY "Authorities can create announcements in their institution"
ON public.announcements FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'authority')
  AND institution_id = get_user_institution_id()
);

-- Update conversations RLS - institution isolated
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view conversations in same institution"
ON public.conversations FOR SELECT
USING (
  (auth.uid() = participant1_id OR auth.uid() = participant2_id)
  AND institution_id = get_user_institution_id()
);

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations in their institution"
ON public.conversations FOR INSERT
WITH CHECK (
  (auth.uid() = participant1_id OR auth.uid() = participant2_id)
  AND institution_id = get_user_institution_id()
);