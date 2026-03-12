CREATE TABLE public.artist_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_verified BOOLEAN DEFAULT false,
    spotify_id TEXT,
    apple_music_id TEXT,
    stage_name TEXT,
    bio TEXT,
    featured_track_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Turn on row level security
ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.artist_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own artist profile" ON public.artist_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artist profile" ON public.artist_profiles
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_artist_profiles_updated_at
    BEFORE UPDATE ON public.artist_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
