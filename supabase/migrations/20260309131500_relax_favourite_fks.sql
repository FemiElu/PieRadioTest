-- ============================================================
-- Migration: Relax Favourites Foreign Keys
-- Allows liking shows that are in the schedules table but not in shows table
-- ============================================================

-- 1. Drop the hard foreign key constraint on liked_shows
-- This allows show_id to point to schedules.id as well
ALTER TABLE public.liked_shows DROP CONSTRAINT IF EXISTS liked_shows_show_id_fkey;

-- 2. Add snapshot columns (like liked_songs) for metadata fallback
ALTER TABLE public.liked_shows ADD COLUMN IF NOT EXISTS show_title TEXT;
ALTER TABLE public.liked_shows ADD COLUMN IF NOT EXISTS show_image_url TEXT;

COMMENT ON COLUMN public.liked_shows.show_id IS 'Can point to public.shows.id or public.schedules.id';
COMMENT ON COLUMN public.liked_shows.show_title IS 'Snapshot of the show title at the time of liking';
