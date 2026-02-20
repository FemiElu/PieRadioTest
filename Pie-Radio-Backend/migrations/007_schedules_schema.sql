-- Migration: Add schedules table for dynamic radio schedule
-- This migration adds:
-- 1. schedules table
-- 2. RLS policies for public read and admin/service write

-- =====================================================
-- 1. CREATE SCHEDULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    presenter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    image_url TEXT,
    is_live BOOLEAN DEFAULT FALSE, -- Optional manual override, usually computed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint to ensure end_time is after start_time
    CONSTRAINT schedules_dates_check CHECK (end_time > start_time)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON schedules(start_time);
CREATE INDEX IF NOT EXISTS idx_schedules_end_time ON schedules(end_time);
CREATE INDEX IF NOT EXISTS idx_schedules_presenter_id ON schedules(presenter_id);
-- Index for date range overlap checks if needed
CREATE INDEX IF NOT EXISTS idx_schedules_time_range ON schedules USING gist (tstzrange(start_time, end_time));

-- =====================================================
-- 2. ENABLE RLS
-- =====================================================
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access
DROP POLICY IF EXISTS "Public can view schedules" ON schedules;
CREATE POLICY "Public can view schedules"
    ON schedules FOR SELECT
    USING (true);

-- Policy: Admins can full access
DROP POLICY IF EXISTS "Admins can manage schedules" ON schedules;
CREATE POLICY "Admins can manage schedules"
    ON schedules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Note: Service Role bypasses RLS, so the API route will work without a specific policy 
-- if using the service role key. If using authenticated user (e.g. cron), 
-- they need to be admin or have a specific policy.

-- =====================================================
-- 3. TRIGGER FOR UPDATED_AT
-- =====================================================
-- Re-use existing update_updated_at_column function
DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;
CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
