-- Events MVP Migration
-- Expands the existing events table with fields required for the MVP:
--   artist, category, status, featured flag, external ticket URL,
--   price range, venue details, audit columns.

-- 1. Add new columns
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS artist_name TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ticket_url TEXT,
  ADD COLUMN IF NOT EXISTS price_min INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_max INTEGER,
  ADD COLUMN IF NOT EXISTS venue_name TEXT,
  ADD COLUMN IF NOT EXISTS venue_address TEXT,
  ADD COLUMN IF NOT EXISTS venue_city TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Default currency to GBP for existing and future rows
ALTER TABLE public.events ALTER COLUMN currency SET DEFAULT 'GBP';

-- 3. Constraints
-- Status must be one of the simplified MVP values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_status_check'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_status_check
        CHECK (status IN ('upcoming', 'past', 'cancelled'));
  END IF;
END $$;

-- Category must be a known value
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_category_check'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_category_check
        CHECK (category IN ('general', 'pop', 'jazz', 'electronic', 'rock', 'hiphop', 'acoustic'));
  END IF;
END $$;

-- 4. Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON public.events(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);

-- 5. Auto-update trigger (reuses existing set_updated_at function)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_events_updated_at'
  ) THEN
    CREATE TRIGGER set_events_updated_at
      BEFORE UPDATE ON public.events
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 6. Enable RLS (idempotent)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Events are viewable by everyone'
  ) THEN
    CREATE POLICY "Events are viewable by everyone"
      ON public.events FOR SELECT USING (true);
  END IF;
END $$;

-- Admin full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Admins can insert events'
  ) THEN
    CREATE POLICY "Admins can insert events"
      ON public.events FOR INSERT
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Admins can update events'
  ) THEN
    CREATE POLICY "Admins can update events"
      ON public.events FOR UPDATE
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Admins can delete events'
  ) THEN
    CREATE POLICY "Admins can delete events"
      ON public.events FOR DELETE
      USING (public.is_admin());
  END IF;
END $$;
