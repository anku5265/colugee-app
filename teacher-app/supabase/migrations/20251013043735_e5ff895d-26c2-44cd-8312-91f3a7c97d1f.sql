-- Add cover_picture_url and links fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_picture_url text,
ADD COLUMN IF NOT EXISTS links text[];