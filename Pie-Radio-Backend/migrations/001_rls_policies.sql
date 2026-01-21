-- ============================================================================
-- Migration: 001_rls_policies.sql
-- Description: Enable Row-Level Security (RLS) on all tables with role-based policies
-- Author: Antigravity
-- Date: 2024-12-23
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE presenter_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE station_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE station_metadata_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Public can view all profiles (for presenter listings, chat usernames, etc.)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile (backup for trigger)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile (non-role fields)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    (
      -- If user is not admin, they cannot change their own role
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      OR
      role = (SELECT role FROM profiles WHERE id = auth.uid())
    )
  );

-- Admins can update any profile including role
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- SHOWS TABLE POLICIES
-- ============================================================================

-- Public can view all shows
DROP POLICY IF EXISTS "Shows are viewable by everyone" ON shows;
CREATE POLICY "Shows are viewable by everyone"
  ON shows FOR SELECT
  USING (true);

-- Presenters and admins can create shows
DROP POLICY IF EXISTS "Presenters can create shows" ON shows;
CREATE POLICY "Presenters can create shows"
  ON shows FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('presenter', 'admin')
    )
  );

-- Presenters can update their own shows, admins can update any
DROP POLICY IF EXISTS "Presenters can update own shows" ON shows;
CREATE POLICY "Presenters can update own shows"
  ON shows FOR UPDATE
  USING (
    host_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete shows
DROP POLICY IF EXISTS "Admins can delete shows" ON shows;
CREATE POLICY "Admins can delete shows"
  ON shows FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- SCHEDULE_SLOTS TABLE POLICIES
-- ============================================================================

-- Public can view schedule
DROP POLICY IF EXISTS "Schedule is viewable by everyone" ON schedule_slots;
CREATE POLICY "Schedule is viewable by everyone"
  ON schedule_slots FOR SELECT
  USING (true);

-- Presenters can create slots for their shows, admins for any
DROP POLICY IF EXISTS "Presenters can create schedule slots" ON schedule_slots;
CREATE POLICY "Presenters can create schedule slots"
  ON schedule_slots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('presenter', 'admin')
    ) AND (
      -- Must be for a show they host (or admin)
      EXISTS (
        SELECT 1 FROM shows
        WHERE shows.id = show_id AND (
          shows.host_id = auth.uid() OR
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        )
      )
    )
  );

-- Presenters can update their own slots, admins any
DROP POLICY IF EXISTS "Presenters can update own schedule slots" ON schedule_slots;
CREATE POLICY "Presenters can update own schedule slots"
  ON schedule_slots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shows
      WHERE shows.id = show_id AND shows.host_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Presenters can delete their own slots, admins any
DROP POLICY IF EXISTS "Presenters can delete own schedule slots" ON schedule_slots;
CREATE POLICY "Presenters can delete own schedule slots"
  ON schedule_slots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shows
      WHERE shows.id = show_id AND shows.host_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- ARTIST_UPLOADS TABLE POLICIES
-- ============================================================================

-- Artists can view their own uploads
DROP POLICY IF EXISTS "Users can view own uploads" ON artist_uploads;
CREATE POLICY "Users can view own uploads"
  ON artist_uploads FOR SELECT
  USING (
    artist_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Authenticated users can submit uploads
DROP POLICY IF EXISTS "Users can submit uploads" ON artist_uploads;
CREATE POLICY "Users can submit uploads"
  ON artist_uploads FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    artist_id = auth.uid()
  );

-- Only admins can update uploads (for status changes)
DROP POLICY IF EXISTS "Admins can update uploads" ON artist_uploads;
CREATE POLICY "Admins can update uploads"
  ON artist_uploads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete uploads
DROP POLICY IF EXISTS "Admins can delete uploads" ON artist_uploads;
CREATE POLICY "Admins can delete uploads"
  ON artist_uploads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- CHAT_MESSAGES TABLE POLICIES
-- ============================================================================

-- Authenticated users can view non-hidden messages, admins can view all
DROP POLICY IF EXISTS "Authenticated users can view messages" ON chat_messages;
CREATE POLICY "Authenticated users can view messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    is_hidden = false OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Authenticated users can send messages
DROP POLICY IF EXISTS "Authenticated users can send messages" ON chat_messages;
CREATE POLICY "Authenticated users can send messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

-- Only admins can update messages (for hiding/moderation)
DROP POLICY IF EXISTS "Admins can moderate messages" ON chat_messages;
CREATE POLICY "Admins can moderate messages"
  ON chat_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete messages
DROP POLICY IF EXISTS "Admins can delete messages" ON chat_messages;
CREATE POLICY "Admins can delete messages"
  ON chat_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- MUSIC_REQUESTS TABLE POLICIES
-- ============================================================================

-- Users can view their own requests, admins/presenters can view all
DROP POLICY IF EXISTS "Users can view own music requests" ON music_requests;
CREATE POLICY "Users can view own music requests"
  ON music_requests FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('presenter', 'admin')
    )
  );

-- Authenticated users can submit requests
DROP POLICY IF EXISTS "Users can submit music requests" ON music_requests;
CREATE POLICY "Users can submit music requests"
  ON music_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- Users can update their own pending requests, admins/presenters can update any
DROP POLICY IF EXISTS "Users can update own pending requests" ON music_requests;
CREATE POLICY "Users can update own pending requests"
  ON music_requests FOR UPDATE
  USING (
    (user_id = auth.uid() AND status = 'pending') OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('presenter', 'admin')
    )
  );

-- Users can delete their own pending requests, admins can delete any
DROP POLICY IF EXISTS "Users can delete own pending requests" ON music_requests;
CREATE POLICY "Users can delete own pending requests"
  ON music_requests FOR DELETE
  USING (
    (user_id = auth.uid() AND status = 'pending') OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- EVENTS TABLE POLICIES
-- ============================================================================

-- Public can view all events
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT
  USING (true);

-- Only admins can manage events
DROP POLICY IF EXISTS "Admins can create events" ON events;
CREATE POLICY "Admins can create events"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update events" ON events;
CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete events" ON events;
CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- TICKETS TABLE POLICIES
-- ============================================================================

-- Users can view their own tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can create tickets (via service role or specific policy)
DROP POLICY IF EXISTS "System can create tickets" ON tickets;
CREATE POLICY "System can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- Only admins can update tickets
DROP POLICY IF EXISTS "Admins can update tickets" ON tickets;
CREATE POLICY "Admins can update tickets"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- NEWS_ARTICLES TABLE POLICIES
-- ============================================================================

-- Public can view published articles
DROP POLICY IF EXISTS "Public can view published articles" ON news_articles;
CREATE POLICY "Public can view published articles"
  ON news_articles FOR SELECT
  USING (
    published_at IS NOT NULL OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can manage news articles
DROP POLICY IF EXISTS "Admins can create articles" ON news_articles;
CREATE POLICY "Admins can create articles"
  ON news_articles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update articles" ON news_articles;
CREATE POLICY "Admins can update articles"
  ON news_articles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete articles" ON news_articles;
CREATE POLICY "Admins can delete articles"
  ON news_articles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- PRESENTER_META TABLE POLICIES
-- ============================================================================

-- Public can view presenter metadata
DROP POLICY IF EXISTS "Presenter meta is viewable by everyone" ON presenter_meta;
CREATE POLICY "Presenter meta is viewable by everyone"
  ON presenter_meta FOR SELECT
  USING (true);

-- Presenters can manage their own metadata
DROP POLICY IF EXISTS "Presenters can insert own meta" ON presenter_meta;
CREATE POLICY "Presenters can insert own meta"
  ON presenter_meta FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('presenter', 'admin')
    )
  );

DROP POLICY IF EXISTS "Presenters can update own meta" ON presenter_meta;
CREATE POLICY "Presenters can update own meta"
  ON presenter_meta FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- USER_FAVORITES TABLE POLICIES
-- ============================================================================

-- Users can view their own favorites
DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorites;
CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  USING (user_id = auth.uid());

-- Users can manage their own favorites
DROP POLICY IF EXISTS "Users can insert favorites" ON user_favorites;
CREATE POLICY "Users can insert favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete favorites" ON user_favorites;
CREATE POLICY "Users can delete favorites"
  ON user_favorites FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- STATION_METADATA TABLE POLICIES
-- ============================================================================

-- Public can view station metadata
DROP POLICY IF EXISTS "Station metadata is viewable by everyone" ON station_metadata;
CREATE POLICY "Station metadata is viewable by everyone"
  ON station_metadata FOR SELECT
  USING (true);

-- Only presenters and admins can update station metadata
DROP POLICY IF EXISTS "Presenters can update station metadata" ON station_metadata;
CREATE POLICY "Presenters can update station metadata"
  ON station_metadata FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('presenter', 'admin')
    )
  );

-- ============================================================================
-- STATION_METADATA_HISTORY TABLE POLICIES
-- ============================================================================

-- Presenters and admins can view history
DROP POLICY IF EXISTS "Authorized users can view metadata history" ON station_metadata_history;
CREATE POLICY "Authorized users can view metadata history"
  ON station_metadata_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('presenter', 'admin')
    )
  );

-- System inserts history records (presenters and admins can insert)
DROP POLICY IF EXISTS "Authorized users can insert metadata history" ON station_metadata_history;
CREATE POLICY "Authorized users can insert metadata history"
  ON station_metadata_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('presenter', 'admin')
    )
  );
