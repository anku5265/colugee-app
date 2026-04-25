-- =============================================
-- COLUGEE MULTI-TENANT SAAS MIGRATION
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Add super_admin and institute_admin to role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'institute_admin';

-- 2. Add status + metadata to institutions table
ALTER TABLE institutions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'deleted')),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 500,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- 3. Tenant audit log table
CREATE TABLE IF NOT EXISTS tenant_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL,
  actor_role TEXT NOT NULL,
  target_type TEXT NOT NULL,   -- 'institution' | 'user'
  target_id UUID,
  action TEXT NOT NULL,        -- 'create' | 'update' | 'suspend' | 'activate' | 'delete'
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Update get_user_institution_id to handle super_admin (returns NULL for super_admin)
CREATE OR REPLACE FUNCTION public.get_user_institution_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 5. Function to check if current user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;

-- 6. RLS: institutions - super_admin sees all, others see only their own
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "institutions_select" ON institutions;
CREATE POLICY "institutions_select" ON institutions
  FOR SELECT USING (
    is_super_admin()
    OR id = get_user_institution_id()
  );

DROP POLICY IF EXISTS "institutions_insert" ON institutions;
CREATE POLICY "institutions_insert" ON institutions
  FOR INSERT WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "institutions_update" ON institutions;
CREATE POLICY "institutions_update" ON institutions
  FOR UPDATE USING (is_super_admin());

DROP POLICY IF EXISTS "institutions_delete" ON institutions;
CREATE POLICY "institutions_delete" ON institutions
  FOR DELETE USING (is_super_admin());

-- 7. RLS: profiles - super_admin sees all, institute_admin sees own tenant
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    is_super_admin()
    OR user_id = auth.uid()
    OR institution_id = get_user_institution_id()
  );

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (
    is_super_admin()
    OR institution_id = get_user_institution_id()
  );

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (
    is_super_admin()
    OR user_id = auth.uid()
    OR (
      institution_id = get_user_institution_id()
      AND EXISTS (
        SELECT 1 FROM profiles p2
        WHERE p2.user_id = auth.uid()
        AND p2.role IN ('authority', 'institute_admin')
      )
    )
  );

DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE USING (
    is_super_admin()
    OR (
      institution_id = get_user_institution_id()
      AND EXISTS (
        SELECT 1 FROM profiles p2
        WHERE p2.user_id = auth.uid()
        AND p2.role IN ('authority', 'institute_admin')
      )
    )
  );

-- 8. RLS: tenant_audit_log - super_admin sees all, institute_admin sees own
ALTER TABLE tenant_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_select" ON tenant_audit_log;
CREATE POLICY "audit_select" ON tenant_audit_log
  FOR SELECT USING (is_super_admin() OR actor_user_id = auth.uid());

DROP POLICY IF EXISTS "audit_insert" ON tenant_audit_log;
CREATE POLICY "audit_insert" ON tenant_audit_log
  FOR INSERT WITH CHECK (actor_user_id = auth.uid());

-- 9. Schedules RLS (tenant-scoped)
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schedules_select" ON schedules;
CREATE POLICY "schedules_select" ON schedules
  FOR SELECT USING (
    is_super_admin()
    OR institution_id = get_user_institution_id()
  );

DROP POLICY IF EXISTS "schedules_insert" ON schedules;
CREATE POLICY "schedules_insert" ON schedules
  FOR INSERT WITH CHECK (institution_id = get_user_institution_id());

DROP POLICY IF EXISTS "schedules_update" ON schedules;
CREATE POLICY "schedules_update" ON schedules
  FOR UPDATE USING (institution_id = get_user_institution_id());

DROP POLICY IF EXISTS "schedules_delete" ON schedules;
CREATE POLICY "schedules_delete" ON schedules
  FOR DELETE USING (institution_id = get_user_institution_id());

-- 10. Attendance RLS (tenant-scoped via schedule)
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_select" ON attendance;
CREATE POLICY "attendance_select" ON attendance
  FOR SELECT USING (
    is_super_admin()
    OR student_id = auth.uid()
    OR marked_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = attendance.schedule_id
      AND s.institution_id = get_user_institution_id()
    )
  );

DROP POLICY IF EXISTS "attendance_insert" ON attendance;
CREATE POLICY "attendance_insert" ON attendance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_id
      AND s.institution_id = get_user_institution_id()
    )
  );

DROP POLICY IF EXISTS "attendance_update" ON attendance;
CREATE POLICY "attendance_update" ON attendance
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = attendance.schedule_id
      AND s.institution_id = get_user_institution_id()
    )
  );

-- 11. Announcements RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements_select" ON announcements;
CREATE POLICY "announcements_select" ON announcements
  FOR SELECT USING (
    is_super_admin()
    OR institution_id = get_user_institution_id()
  );

DROP POLICY IF EXISTS "announcements_insert" ON announcements;
CREATE POLICY "announcements_insert" ON announcements
  FOR INSERT WITH CHECK (institution_id = get_user_institution_id());

-- 12. Posts RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select" ON posts;
CREATE POLICY "posts_select" ON posts
  FOR SELECT USING (institution_id = get_user_institution_id());

DROP POLICY IF EXISTS "posts_insert" ON posts;
CREATE POLICY "posts_insert" ON posts
  FOR INSERT WITH CHECK (institution_id = get_user_institution_id());

-- 13. Campus events RLS
ALTER TABLE campus_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select" ON campus_events;
CREATE POLICY "events_select" ON campus_events
  FOR SELECT USING (
    is_super_admin()
    OR institution_id = get_user_institution_id()
  );

DROP POLICY IF EXISTS "events_insert" ON campus_events;
CREATE POLICY "events_insert" ON campus_events
  FOR INSERT WITH CHECK (institution_id = get_user_institution_id());

-- 14. Study groups RLS
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "study_groups_select" ON study_groups;
CREATE POLICY "study_groups_select" ON study_groups
  FOR SELECT USING (institution_id = get_user_institution_id());

DROP POLICY IF EXISTS "study_groups_insert" ON study_groups;
CREATE POLICY "study_groups_insert" ON study_groups
  FOR INSERT WITH CHECK (institution_id = get_user_institution_id());

-- 15. Conversations RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select" ON conversations;
CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (
    participant1_id = auth.uid()
    OR participant2_id = auth.uid()
  );

-- 16. Messages RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- =============================================
-- DEMO: Create a super_admin user manually
-- After creating auth user in Supabase dashboard,
-- run this to set them as super_admin:
--
-- UPDATE profiles SET role = 'super_admin', institution_id = NULL
-- WHERE email = 'superadmin@colugee.com';
-- =============================================
