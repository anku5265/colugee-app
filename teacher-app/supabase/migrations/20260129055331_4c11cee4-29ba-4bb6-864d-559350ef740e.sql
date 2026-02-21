-- Create schedules table for class timetables
CREATE TABLE public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES public.institutions(id),
  title text NOT NULL,
  subject text NOT NULL,
  teacher_name text,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time time NOT NULL,
  end_time time NOT NULL,
  room_location text,
  target_year integer,
  target_section text,
  target_branch text,
  target_department text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create attendance table
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES public.schedules(id) ON DELETE CASCADE NOT NULL,
  student_id uuid NOT NULL, -- references profiles.user_id
  attendance_date date NOT NULL,
  status text NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by uuid NOT NULL,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(schedule_id, student_id, attendance_date)
);

-- Enable RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Schedules RLS policies
CREATE POLICY "Schedules viewable by same institution"
ON public.schedules FOR SELECT
USING (institution_id = get_user_institution_id() OR institution_id IS NULL);

CREATE POLICY "Authority can create schedules"
ON public.schedules FOR INSERT
WITH CHECK (
  auth.uid() = created_by 
  AND institution_id = get_user_institution_id()
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('authority', 'teacher')
  )
);

CREATE POLICY "Authority can update schedules"
ON public.schedules FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('authority', 'teacher')
    AND institution_id = schedules.institution_id
  )
);

CREATE POLICY "Authority can delete schedules"
ON public.schedules FOR DELETE
USING (
  auth.uid() = created_by 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'authority'
  )
);

-- Attendance RLS policies
CREATE POLICY "Students can view their own attendance"
ON public.attendance FOR SELECT
USING (
  student_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('authority', 'teacher')
  )
);

CREATE POLICY "Authority can mark attendance"
ON public.attendance FOR INSERT
WITH CHECK (
  auth.uid() = marked_by
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('authority', 'teacher')
  )
);

CREATE POLICY "Authority can update attendance"
ON public.attendance FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('authority', 'teacher')
  )
);

-- Create indexes for performance
CREATE INDEX idx_schedules_institution ON public.schedules(institution_id);
CREATE INDEX idx_schedules_day ON public.schedules(day_of_week);
CREATE INDEX idx_attendance_student ON public.attendance(student_id);
CREATE INDEX idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX idx_attendance_schedule ON public.attendance(schedule_id);

-- Create triggers for updated_at
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get student attendance stats
CREATE OR REPLACE FUNCTION public.get_attendance_stats(p_student_id uuid, p_days integer DEFAULT 30)
RETURNS TABLE(
  total_classes bigint,
  present_count bigint,
  absent_count bigint,
  late_count bigint,
  attendance_percentage numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*) as total_classes,
    COUNT(*) FILTER (WHERE status = 'present') as present_count,
    COUNT(*) FILTER (WHERE status = 'absent') as absent_count,
    COUNT(*) FILTER (WHERE status = 'late') as late_count,
    ROUND(
      (COUNT(*) FILTER (WHERE status IN ('present', 'late'))::numeric / NULLIF(COUNT(*), 0)) * 100, 
      2
    ) as attendance_percentage
  FROM public.attendance
  WHERE student_id = p_student_id
    AND attendance_date >= CURRENT_DATE - p_days;
$$;