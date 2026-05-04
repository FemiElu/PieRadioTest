-- migration: 20260429100000_account_cascade_deletion.sql
-- Create deletion_requests table to track pending and processed accounts
CREATE TABLE IF NOT EXISTS public.deletion_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'pending'::text,
    requested_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ,
    error_message TEXT
);

-- RLS Policies for deletion_requests
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own deletion requests" 
ON public.deletion_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own deletion requests" 
ON public.deletion_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all deletion requests" 
ON public.deletion_requests 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- RPC Function to safely cascade delete all public dataset elements
-- (Leaving Storage bucket objects + auth.users to the Edge Function)
CREATE OR REPLACE FUNCTION admin_cascade_delete_user(target_uid UUID) 
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- 1. Remove User Favorites
    DELETE FROM public.user_favorites WHERE user_id = target_uid;
    
    -- 2. Remove Music Requests
    DELETE FROM public.music_requests WHERE user_id = target_uid OR requested_by_user_id = target_uid;
    
    -- 3. Remove Chat Messages
    DELETE FROM public.chat_messages WHERE user_id = target_uid;
    
    -- 4. Remove Event Tickets
    DELETE FROM public.tickets WHERE user_id = target_uid;
    
    -- 5. Remove Artist Upload Metadata
    DELETE FROM public.artist_uploads WHERE artist_id = target_uid;
    
    -- 6. Remove Presenter/Admin Metadata (if applicable)
    DELETE FROM public.presenter_meta WHERE user_id = target_uid;
    DELETE FROM public.presenter_messages WHERE presenter_id = target_uid;
    DELETE FROM public.presenter_shows WHERE presenter_id = target_uid;
    
    -- 7. Remove Role Change Audits (Change references to NULL or delete)
    DELETE FROM public.role_change_audit WHERE user_id = target_uid;
    UPDATE public.role_change_audit SET changed_by = NULL WHERE changed_by = target_uid;

    -- 8. Remove the public profile record
    DELETE FROM public.profiles WHERE id = target_uid;
END;
$$;
