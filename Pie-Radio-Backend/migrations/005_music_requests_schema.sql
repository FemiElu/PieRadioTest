-- ============================================================================
-- Migration: 005_music_requests_schema.sql
-- Description: Additive changes to music_requests table for full feature support
--              Includes new columns, strict RLS, and enum updates.
-- Author: Antigravity
-- ============================================================================

-- 1. Update request_status Enum safely
-- ============================================================================
DO $$
BEGIN
    ALTER TYPE "public"."request_status" ADD VALUE 'rejected';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    ALTER TYPE "public"."request_status" ADD VALUE 'expired';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Additive Schema Changes
-- ============================================================================
-- Note: existing columns (artist_name, song_title, etc.) are preserved.
-- 'user_id' is preserved but deprecated in favor of 'requested_by_user_id'.

ALTER TABLE "public"."music_requests"
    ADD COLUMN IF NOT EXISTS "requested_by_user_id" uuid REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS "station_id" bigint, -- Logical reference to station_metadata(id), no FK constraint
    ADD COLUMN IF NOT EXISTS "show_id" uuid REFERENCES "public"."shows"(id),
    ADD COLUMN IF NOT EXISTS "listener_note" text,
    ADD COLUMN IF NOT EXISTS "device_id" text,
    ADD COLUMN IF NOT EXISTS "rejection_reason" text,
    ADD COLUMN IF NOT EXISTS "approved_at" timestamptz,
    ADD COLUMN IF NOT EXISTS "played_at" timestamptz,
    ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now();

-- Data Migration: Copy existing user_id to requested_by_user_id if needed
UPDATE "public"."music_requests"
SET "requested_by_user_id" = "user_id"
WHERE "requested_by_user_id" IS NULL AND "user_id" IS NOT NULL;

-- 3. Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_music_requests_status" ON "public"."music_requests" ("status");
CREATE INDEX IF NOT EXISTS "idx_music_requests_station_id" ON "public"."music_requests" ("station_id");
CREATE INDEX IF NOT EXISTS "idx_music_requests_requested_by" ON "public"."music_requests" ("requested_by_user_id");
CREATE INDEX IF NOT EXISTS "idx_music_requests_created_at" ON "public"."music_requests" ("created_at");

-- 4. RLS Policies (Strict Rewrite)
-- ============================================================================
-- First, drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can view own music requests" ON "public"."music_requests";
DROP POLICY IF EXISTS "Users can submit music requests" ON "public"."music_requests";
DROP POLICY IF EXISTS "Users can update own pending requests" ON "public"."music_requests";
DROP POLICY IF EXISTS "Users can delete own pending requests" ON "public"."music_requests";

-- Enable RLS just in case
ALTER TABLE "public"."music_requests" ENABLE ROW LEVEL SECURITY;

-- POLICY 1: Listeners (Authenticated) - INSERT
-- Rule: Can only insert their own user_id. Strict Auth.
CREATE POLICY "Listeners can submit requests"
ON "public"."music_requests"
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = requested_by_user_id
);

-- POLICY 2: Listeners (Authenticated) - SELECT
-- Rule: Can only view their own requests.
CREATE POLICY "Listeners can view own requests"
ON "public"."music_requests"
FOR SELECT
TO authenticated
USING (
    auth.uid() = requested_by_user_id
);

-- POLICY 3: Staff (Admins & Presenters) - SELECT
-- Rule: Admins view all. Presenters view requests ONLY for their shows.
CREATE POLICY "Staff can view requests"
ON "public"."music_requests"
FOR SELECT
TO authenticated
USING (
    -- Admin: Full Access
    (EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    ))
    OR
    -- Presenter: Scoped to their Shows
    (EXISTS (
        SELECT 1 FROM shows
        WHERE shows.id = music_requests.show_id
        AND shows.host_id = auth.uid()
    ))
);

-- POLICY 4: Staff (Admins & Presenters) - UPDATE
-- Rule: Handled by Triggers for column safety, but scoped visibility check applies.
CREATE POLICY "Staff can update requests"
ON "public"."music_requests"
FOR UPDATE
TO authenticated
USING (
    -- Admin: Full Access
    (EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    ))
    OR
    -- Presenter: Scoped to their Shows
    (EXISTS (
        SELECT 1 FROM shows
        WHERE shows.id = music_requests.show_id
        AND shows.host_id = auth.uid()
    ))
);

-- 5. Hardening Triggers
-- ============================================================================
-- Function to enforce immutability and expiry
CREATE OR REPLACE FUNCTION protect_music_request_mutation()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Enforce Immutable Columns
    IF (OLD.artist_name IS DISTINCT FROM NEW.artist_name) OR
       (OLD.song_title IS DISTINCT FROM NEW.song_title) OR
       (OLD.requested_by_user_id IS DISTINCT FROM NEW.requested_by_user_id) OR
       (OLD.station_id IS DISTINCT FROM NEW.station_id) OR
       (OLD.device_id IS DISTINCT FROM NEW.device_id) THEN
        RAISE EXCEPTION 'Cannot modify immutable fields (artist, song, user, station, device)';
    END IF;

    -- 2. Enforce Expiry (24 Hours)
    -- Allow updates only within 24 hours of creation
    IF (OLD.created_at < now() - interval '24 hours') THEN
        RAISE EXCEPTION 'Cannot modify expired requests (older than 24 hours)';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Trigger
DROP TRIGGER IF EXISTS trigger_protect_music_request_mutation ON "public"."music_requests";
CREATE TRIGGER trigger_protect_music_request_mutation
    BEFORE UPDATE ON "public"."music_requests"
    FOR EACH ROW
    EXECUTE FUNCTION protect_music_request_mutation();

-- Note: Listener UPDATE/DELETE is implicitly DENIED by not creating a policy for them.
