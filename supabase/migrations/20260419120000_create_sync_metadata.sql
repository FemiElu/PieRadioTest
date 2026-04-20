-- Create a table to store synchronization metadata (e.g. hashes to skip redundant processing)
CREATE TABLE IF NOT EXISTS public.sync_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sync_metadata ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role can do everything on sync_metadata" 
ON public.sync_metadata 
FOR ALL 
USING (auth.role() = 'service_role');
