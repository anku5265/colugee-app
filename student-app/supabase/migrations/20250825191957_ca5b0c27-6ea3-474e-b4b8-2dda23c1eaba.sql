-- Create institutions table
CREATE TABLE public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  contact_email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('student', 'mentor', 'teacher', 'authority');

-- Update profiles table to include role and institution
ALTER TABLE public.profiles 
ADD COLUMN role user_role DEFAULT 'student',
ADD COLUMN institution_id UUID REFERENCES public.institutions(id),
ADD COLUMN institution_roll_number TEXT,
ADD COLUMN daily_streak INTEGER DEFAULT 0,
ADD COLUMN last_activity_date DATE,
ADD COLUMN connections_count INTEGER DEFAULT 0;

-- Create unique constraint for roll number within institution
ALTER TABLE public.profiles 
ADD CONSTRAINT unique_roll_per_institution 
UNIQUE (institution_id, institution_roll_number);

-- Create mentoring relationships table
CREATE TABLE public.mentoring_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(mentor_id, mentee_id)
);

-- Create work management table
CREATE TABLE public.work_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_by UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create approvals/requests table for authorities
CREATE TABLE public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  request_type TEXT NOT NULL,
  requested_by UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  certificate_url TEXT,
  verification_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert sample institutions
INSERT INTO public.institutions (code, name, address, contact_email, phone) VALUES
('IITD', 'Indian Institute of Technology Delhi', 'Hauz Khas, New Delhi, Delhi 110016', 'info@iitd.ac.in', '+91-11-2659-1000'),
('IITB', 'Indian Institute of Technology Bombay', 'Powai, Mumbai, Maharashtra 400076', 'info@iitb.ac.in', '+91-22-2572-2545'),
('IISC', 'Indian Institute of Science Bangalore', 'CV Raman Road, Bangalore, Karnataka 560012', 'info@iisc.ac.in', '+91-80-2293-2001'),
('NITK', 'National Institute of Technology Karnataka', 'Surathkal, Mangalore, Karnataka 575025', 'info@nitk.edu.in', '+91-824-247-3000'),
('MIT', 'Massachusetts Institute of Technology', '77 Massachusetts Ave, Cambridge, MA 02139, USA', 'info@mit.edu', '+1-617-253-1000');

-- Enable RLS on new tables
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentoring_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for institutions (public read)
CREATE POLICY "Institutions are viewable by everyone" 
ON public.institutions FOR SELECT USING (true);

-- RLS Policies for mentoring relationships
CREATE POLICY "Users can view their own mentoring relationships" 
ON public.mentoring_relationships FOR SELECT 
USING (auth.uid() IN (mentor_id, mentee_id));

CREATE POLICY "Users can manage their own mentoring relationships" 
ON public.mentoring_relationships FOR ALL 
USING (auth.uid() IN (mentor_id, mentee_id));

-- RLS Policies for work assignments
CREATE POLICY "Users can view their assigned work" 
ON public.work_assignments FOR SELECT 
USING (auth.uid() IN (assigned_by, assigned_to));

CREATE POLICY "Users can manage work they assigned or are assigned to" 
ON public.work_assignments FOR ALL 
USING (auth.uid() IN (assigned_by, assigned_to));

-- RLS Policies for approval requests
CREATE POLICY "Users can view their approval requests" 
ON public.approval_requests FOR SELECT 
USING (auth.uid() IN (requested_by, assigned_to));

CREATE POLICY "Users can manage their approval requests" 
ON public.approval_requests FOR ALL 
USING (auth.uid() IN (requested_by, assigned_to));

-- RLS Policies for certificates
CREATE POLICY "Users can view all certificates" 
ON public.certificates FOR SELECT USING (true);

CREATE POLICY "Users can manage their own certificates" 
ON public.certificates FOR ALL 
USING (auth.uid() = user_id);

-- Update triggers for timestamps
CREATE TRIGGER update_institutions_updated_at
BEFORE UPDATE ON public.institutions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentoring_relationships_updated_at
BEFORE UPDATE ON public.mentoring_relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_assignments_updated_at
BEFORE UPDATE ON public.work_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approval_requests_updated_at
BEFORE UPDATE ON public.approval_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();