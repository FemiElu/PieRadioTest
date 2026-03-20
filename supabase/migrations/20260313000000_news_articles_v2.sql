-- Migration: news_articles_v2
-- Extends the existing news_articles table with all fields required by the UI data model.
-- This is a purely ADDITIVE migration: no columns are dropped or renamed.
-- Safe to run against an empty or pre-existing news_articles table.

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. New columns
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.news_articles
  -- Content hierarchy / display tier
  ADD COLUMN IF NOT EXISTS tier          TEXT    NOT NULL DEFAULT 'update'
    CONSTRAINT news_articles_tier_check
      CHECK (tier IN ('breaking','trending','update','archive','audio','poll','sponsor')),

  -- Taxonomy
  ADD COLUMN IF NOT EXISTS category      TEXT,

  -- Short excerpt shown on cards (distinct from long-form "content")
  ADD COLUMN IF NOT EXISTS summary       TEXT,

  -- Human-readable author name (fallback when author_id is NULL)
  ADD COLUMN IF NOT EXISTS author_name   TEXT,

  -- CMS workflow status
  ADD COLUMN IF NOT EXISTS status        TEXT    NOT NULL DEFAULT 'draft'
    CONSTRAINT news_articles_status_check
      CHECK (status IN ('draft','published','archived')),

  -- Quick "BREAKING" flag independent of tier (allows trending articles to also be breaking)
  ADD COLUMN IF NOT EXISTS is_breaking   BOOLEAN NOT NULL DEFAULT FALSE,

  -- Optional audio clip URL for "Read & Listen" feature
  ADD COLUMN IF NOT EXISTS audio_preview_url TEXT,

  -- Array of timestamped audio moments: [{label, timestamp, duration}]
  ADD COLUMN IF NOT EXISTS audio_moments JSONB   DEFAULT '[]'::jsonb,

  -- Denormalised engagement counters (incremented by server-side functions to avoid row-level locks)
  ADD COLUMN IF NOT EXISTS likes_count    INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  ADD COLUMN IF NOT EXISTS comments_count INTEGER NOT NULL DEFAULT 0 CHECK (comments_count >= 0),
  ADD COLUMN IF NOT EXISTS shares_count   INTEGER NOT NULL DEFAULT 0 CHECK (shares_count >= 0),

  -- Audit
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT NOW();

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Keep published_at nullable — it is set when status transitions to 'published'
--    (already exists, no change needed)
-- ────────────────────────────────────────────────────────────────────────────

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Auto-update updated_at via existing trigger helper
-- ────────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS set_news_articles_updated_at ON public.news_articles;

CREATE TRIGGER set_news_articles_updated_at
  BEFORE UPDATE ON public.news_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Indexes for common query patterns
-- ────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_news_articles_status
  ON public.news_articles (status);

CREATE INDEX IF NOT EXISTS idx_news_articles_tier
  ON public.news_articles (tier);

CREATE INDEX IF NOT EXISTS idx_news_articles_published_at
  ON public.news_articles (published_at DESC NULLS LAST)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_news_articles_category
  ON public.news_articles (category);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Row Level Security
-- ────────────────────────────────────────────────────────────────────────────

-- Enable RLS (idempotent)
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to re-create cleanly
DROP POLICY IF EXISTS "news_articles_public_read" ON public.news_articles;
DROP POLICY IF EXISTS "news_articles_admin_all"   ON public.news_articles;

-- Public: can only read published articles
CREATE POLICY "news_articles_public_read"
  ON public.news_articles
  FOR SELECT
  USING (status = 'published');

-- Admins: full access to all rows/operations
CREATE POLICY "news_articles_admin_all"
  ON public.news_articles
  FOR ALL
  USING     (public.is_admin())
  WITH CHECK (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- 6. Storage bucket policy for cover images (news-images)
--    The bucket itself must be created via Supabase Dashboard or CLI.
--    The policy below grants public read and admin-only write.
-- ────────────────────────────────────────────────────────────────────────────

-- Public read policy for news-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('news-images', 'news-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "news_images_admin_upload" ON storage.objects;
DROP POLICY IF EXISTS "news_images_public_read"  ON storage.objects;

CREATE POLICY "news_images_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'news-images');

CREATE POLICY "news_images_admin_upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'news-images'
    AND public.is_admin()
  );

CREATE POLICY "news_images_admin_update"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'news-images' AND public.is_admin());

CREATE POLICY "news_images_admin_delete"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'news-images' AND public.is_admin());

COMMIT;
