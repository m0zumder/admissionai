
-- Add stream column to subjects for HSC filtering
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS stream text DEFAULT NULL;

-- Update existing HSC subjects with stream info
UPDATE public.subjects SET stream = 'science' WHERE class_level = 'HSC' AND name_en IN ('Physics', 'Chemistry', 'Biology', 'Mathematics');
UPDATE public.subjects SET stream = 'commerce' WHERE class_level = 'HSC' AND name_en IN ('Accounting', 'Business Organization', 'Economics');
UPDATE public.subjects SET stream = 'compulsory' WHERE class_level = 'HSC' AND name_en IN ('Bangla', 'English');
