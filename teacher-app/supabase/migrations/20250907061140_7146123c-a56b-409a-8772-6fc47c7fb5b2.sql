-- Add audience field to posts table to allow authority users to target specific roles
ALTER TABLE public.posts 
ADD COLUMN audience TEXT[] DEFAULT ARRAY['all'];

-- Add a check constraint to ensure valid audience values
ALTER TABLE public.posts 
ADD CONSTRAINT valid_audience_values 
CHECK (audience <@ ARRAY['student', 'teacher', 'mentor', 'authority', 'dean', 'all']);

-- Update existing posts to have 'all' as default audience
UPDATE public.posts SET audience = ARRAY['all'] WHERE audience IS NULL;