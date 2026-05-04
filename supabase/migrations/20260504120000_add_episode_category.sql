-- Add category column to episodes table to support partnership classification
ALTER TABLE public.episodes 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Index for faster filtering by category
CREATE INDEX IF NOT EXISTS idx_episodes_category ON public.episodes(category);

-- Update RLS (Policies already exist for admins in previous migrations, but let's be explicit if needed)
-- Note: is_admin() is already used in existing policies to allow any insert/update/delete.
