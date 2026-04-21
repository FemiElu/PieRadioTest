-- Migration: Update Notifications logic (Add presenter_message type and 30-day expiry)
-- Date: 2026-04-20

-- 1. Add presenter_message to notification_type enum
-- Note: Enum values cannot be added within a transaction in some Postgres versions.
-- Supabase handles this by running migrations carefully.
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'presenter_message';

-- 2. Create function to delete old notifications
CREATE OR REPLACE FUNCTION delete_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM public.notifications
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 3. (Optional) Setup Cron job for daily cleanup if pg_cron is available
-- This might fail if the user doesn't have permissions or pg_cron is not enabled.
-- It's a standard pattern in Supabase.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule('cleanup-notifications-daily', '0 0 * * *', 'SELECT delete_old_notifications()');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pg_cron not available, cleanup function created but not scheduled automatically.';
END $$;
