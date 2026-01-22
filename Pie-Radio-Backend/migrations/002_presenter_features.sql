-- Migration: Add presenter-related tables and columns for Presenters page
-- This migration adds:
-- 1. presenter_messages table for contact form submissions
-- 2. slug column to profiles for SEO-friendly URLs
-- 3. category column to presenter_meta for filtering

-- =====================================================
-- 1. ADD SLUG COLUMN TO PROFILES
-- =====================================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);

-- =====================================================
-- 2. ADD CATEGORY COLUMN TO PRESENTER_META
-- =====================================================
ALTER TABLE presenter_meta 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Main Station';

-- =====================================================
-- 3. CREATE PRESENTER_MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS presenter_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presenter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_presenter_messages_presenter_id ON presenter_messages(presenter_id);
CREATE INDEX IF NOT EXISTS idx_presenter_messages_created_at ON presenter_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_presenter_messages_is_read ON presenter_messages(is_read);

-- =====================================================
-- 4. ENABLE RLS ON PRESENTER_MESSAGES
-- =====================================================
ALTER TABLE presenter_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can INSERT (public contact form)
DROP POLICY IF EXISTS "Anyone can send messages to presenters" ON presenter_messages;
CREATE POLICY "Anyone can send messages to presenters"
    ON presenter_messages FOR INSERT
    WITH CHECK (true);

-- Policy: Presenters can view their own messages
DROP POLICY IF EXISTS "Presenters can view their own messages" ON presenter_messages;
CREATE POLICY "Presenters can view their own messages"
    ON presenter_messages FOR SELECT
    USING (
        auth.uid() = presenter_id
    );

-- Policy: Admins can view all messages
DROP POLICY IF EXISTS "Admins can view all presenter messages" ON presenter_messages;
CREATE POLICY "Admins can view all presenter messages"
    ON presenter_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: Presenters can update their own messages (mark as read)
DROP POLICY IF EXISTS "Presenters can update their own messages" ON presenter_messages;
CREATE POLICY "Presenters can update their own messages"
    ON presenter_messages FOR UPDATE
    USING (auth.uid() = presenter_id)
    WITH CHECK (auth.uid() = presenter_id);

-- Policy: Admins can update all messages
DROP POLICY IF EXISTS "Admins can update all presenter messages" ON presenter_messages;
CREATE POLICY "Admins can update all presenter messages"
    ON presenter_messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: Admins can delete messages
DROP POLICY IF EXISTS "Admins can delete presenter messages" ON presenter_messages;
CREATE POLICY "Admins can delete presenter messages"
    ON presenter_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- 5. UPDATE FUNCTION FOR UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for presenter_messages
DROP TRIGGER IF EXISTS update_presenter_messages_updated_at ON presenter_messages;
CREATE TRIGGER update_presenter_messages_updated_at
    BEFORE UPDATE ON presenter_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. GENERATE SLUGS FOR EXISTING PRESENTERS
-- =====================================================
-- This updates existing presenters to have slugs based on their username or full_name
UPDATE profiles
SET slug = LOWER(REPLACE(COALESCE(username, full_name, id::text), ' ', '-'))
WHERE role = 'presenter' AND slug IS NULL;
