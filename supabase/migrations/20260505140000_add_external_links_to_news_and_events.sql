-- Migration: add_external_links_to_news_and_events
-- Adds youtube_url and external_url to news_articles
-- Adds external_url to events

BEGIN;

-- 1. news_articles
ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS youtube_url  TEXT,
  ADD COLUMN IF NOT EXISTS external_url TEXT;

-- 2. events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS external_url TEXT;

COMMIT;
