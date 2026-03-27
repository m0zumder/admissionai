
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_photo_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_emoji text DEFAULT '📚';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exam_date date;

ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS importance text NOT NULL DEFAULT 'medium';
