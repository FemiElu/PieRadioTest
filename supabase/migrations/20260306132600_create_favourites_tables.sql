-- ============================================================
-- Migration: Create Favourites Join Tables
-- liked_shows, liked_presenters, liked_songs
-- ============================================================

-- 1. Liked Shows
CREATE TABLE IF NOT EXISTS public.liked_shows (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    show_id     UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, show_id)
);

ALTER TABLE public.liked_shows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own liked shows"
    ON public.liked_shows FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own liked shows"
    ON public.liked_shows FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own liked shows"
    ON public.liked_shows FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Liked Presenters
CREATE TABLE IF NOT EXISTS public.liked_presenters (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    presenter_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, presenter_id)
);

ALTER TABLE public.liked_presenters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own liked presenters"
    ON public.liked_presenters FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own liked presenters"
    ON public.liked_presenters FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own liked presenters"
    ON public.liked_presenters FOR DELETE
    USING (auth.uid() = user_id);

-- 3. Liked Songs (snapshot from ICY stream metadata — not in DB catalogue)
CREATE TABLE IF NOT EXISTS public.liked_songs (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    song_title  TEXT NOT NULL,
    artist_name TEXT,
    cover_url   TEXT,
    created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
    -- Prevent exact duplicate by same user (same title + artist)
    UNIQUE(user_id, song_title, artist_name)
);

ALTER TABLE public.liked_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own liked songs"
    ON public.liked_songs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own liked songs"
    ON public.liked_songs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own liked songs"
    ON public.liked_songs FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes for efficient per-user lookups
CREATE INDEX IF NOT EXISTS liked_shows_user_id_idx ON public.liked_shows(user_id);
CREATE INDEX IF NOT EXISTS liked_presenters_user_id_idx ON public.liked_presenters(user_id);
CREATE INDEX IF NOT EXISTS liked_songs_user_id_idx ON public.liked_songs(user_id);
