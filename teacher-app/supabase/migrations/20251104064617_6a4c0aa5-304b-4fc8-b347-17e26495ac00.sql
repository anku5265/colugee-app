-- Add audience column to announcements table
ALTER TABLE public.announcements
ADD COLUMN audience text[] DEFAULT ARRAY['all']::text[];

-- Add comment for clarity
COMMENT ON COLUMN public.announcements.audience IS 'Array of roles that can see this announcement: authority, student, mentor, teacher, or all';