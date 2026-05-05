-- Migration: Create spotlights table
-- Description: Stores the "Artist of the Month" / Spotlight data for the home page.

CREATE TABLE IF NOT EXISTS public.spotlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'Artist of the Month',
    artist_name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spotlights ENABLE ROW LEVEL SECURITY;

-- Select: Public access
CREATE POLICY "Public spotlights are viewable by everyone" 
ON public.spotlights FOR SELECT 
USING (is_active = true);

-- Admin policies: Full access for admins
CREATE POLICY "Admins can manage spotlights" 
ON public.spotlights 
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Trigger for updated_at
CREATE TRIGGER set_spotlights_updated_at
BEFORE UPDATE ON public.spotlights
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Insert an initial placeholder or leave empty for fallback logic
-- We'll leave it empty to test the fallback logic on the home page first.
