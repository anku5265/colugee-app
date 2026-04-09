-- =============================================
-- COLUGEE APP - Complete Database Setup
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('student', 'mentor', 'teacher', 'authority');

-- 2. INSTITUTIONS
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  contact_email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role DEFAULT 'student',
  department TEXT NOT NULL DEFAULT '',
  institution_id UUID REFERENCES institutions(id),
  institution_roll_number TEXT,
  bio TEXT,
  branch TEXT,
  section TEXT,
  year_of_study INTEGER,
  phone_number TEXT,
  profile_picture_url TEXT,
  cover_picture_url TEXT,
  links TEXT[],
  daily_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  connections_count INTEGER DEFAULT 0,
  student_id TEXT,
  "Course" TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SCHEDULES
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacher_name TEXT,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_location TEXT,
  institution_id UUID REFERENCES institutions(id),
  target_year INTEGER,
  target_section TEXT,
  target_branch TEXT,
  target_department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ATTENDANCE
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  schedule_id UUID NOT NULL REFERENCES schedules(id),
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  marked_by UUID NOT NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ANNOUNCEMENTS
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_type TEXT NOT NULL,
  audience TEXT[],
  created_by UUID NOT NULL,
  institution_id UUID REFERENCES institutions(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CONNECTIONS
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. POSTS & FEED
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  institution_id UUID REFERENCES institutions(id),
  audience TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MESSAGES
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id UUID NOT NULL,
  participant2_id UUID NOT NULL,
  institution_id UUID REFERENCES institutions(id),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. EVENTS
CREATE TABLE campus_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  category TEXT,
  image_url TEXT,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  institution_id UUID REFERENCES institutions(id),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  venue_name TEXT NOT NULL,
  venue_location TEXT NOT NULL,
  category TEXT NOT NULL,
  base_price NUMERIC NOT NULL DEFAULT 0,
  max_price NUMERIC,
  total_seats INTEGER,
  available_seats INTEGER,
  image_url TEXT,
  rating NUMERIC,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES events(id),
  seats_booked INTEGER NOT NULL,
  seat_numbers TEXT[],
  total_amount NUMERIC NOT NULL,
  booking_status TEXT DEFAULT 'confirmed',
  payment_status TEXT,
  payment_id TEXT,
  booking_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CERTIFICATES
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  certificate_url TEXT,
  verification_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PROJECTS
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  technologies TEXT[],
  github_url TEXT,
  demo_url TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'in_progress',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. STUDY GROUPS
CREATE TABLE study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  institution_id UUID REFERENCES institutions(id),
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  action_id TEXT,
  action_type TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. APPROVAL REQUESTS
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  request_type TEXT NOT NULL,
  requested_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. MENTORING
CREATE TABLE mentoring_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES profiles(id),
  mentee_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. EXPERIENCE & EDUCATION
CREATE TABLE experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE education_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  degree TEXT NOT NULL,
  major TEXT NOT NULL,
  minor TEXT,
  graduation_year INTEGER NOT NULL,
  gpa NUMERIC,
  achievements TEXT[],
  certifications TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. ADMIN SETTINGS
CREATE TABLE admin_panel_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE authority_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_user_id UUID NOT NULL,
  target_user_id UUID,
  action_type TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUTO PROFILE CREATION ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, full_name, email, role, department,
    institution_id, institution_roll_number, year_of_study
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    (NEW.raw_user_meta_data->>'institution_id')::UUID,
    NEW.raw_user_meta_data->>'institution_roll_number',
    (NEW.raw_user_meta_data->>'year_of_study')::INTEGER
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ATTENDANCE STATS FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION get_attendance_stats(p_student_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_classes BIGINT,
  present_count BIGINT,
  absent_count BIGINT,
  late_count BIGINT,
  attendance_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_classes,
    COUNT(*) FILTER (WHERE status = 'present') as present_count,
    COUNT(*) FILTER (WHERE status = 'absent') as absent_count,
    COUNT(*) FILTER (WHERE status = 'late') as late_count,
    CASE WHEN COUNT(*) > 0
      THEN ROUND((COUNT(*) FILTER (WHERE status IN ('present','late'))::NUMERIC / COUNT(*)) * 100, 1)
      ELSE 0
    END as attendance_percentage
  FROM attendance
  WHERE student_id = p_student_id
    AND attendance_date >= CURRENT_DATE - p_days;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DISABLE RLS (for prototype - easy access)
-- =============================================
ALTER TABLE institutions DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE campus_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE mentoring_relationships DISABLE ROW LEVEL SECURITY;
ALTER TABLE experience DISABLE ROW LEVEL SECURITY;
ALTER TABLE education_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_panel_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE authority_audit_log DISABLE ROW LEVEL SECURITY;

-- =============================================
-- DEMO DATA
-- =============================================
INSERT INTO institutions (name, code, address, contact_email, phone)
VALUES ('Colugee Demo College', 'DEMO', 'New Delhi, India', 'admin@demo.edu', '+91-9999999999');

INSERT INTO campus_events (title, description, event_date, location, category, max_participants, current_participants, is_active, created_by)
VALUES 
  ('Tech Fest 2025', 'Annual technical festival with coding competitions and workshops', NOW() + INTERVAL '7 days', 'Main Auditorium', 'technical', 500, 120, TRUE, gen_random_uuid()),
  ('Cultural Night', 'Annual cultural celebration with music and dance performances', NOW() + INTERVAL '14 days', 'Open Air Theatre', 'cultural', 300, 85, TRUE, gen_random_uuid()),
  ('Hackathon 2025', '24-hour coding hackathon for all students', NOW() + INTERVAL '21 days', 'Computer Lab Block', 'technical', 200, 60, TRUE, gen_random_uuid());
