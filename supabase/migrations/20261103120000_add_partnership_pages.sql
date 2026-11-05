BEGIN;

CREATE TABLE IF NOT EXISTS public.partnership_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  brand_name TEXT NOT NULL CHECK (char_length(brand_name) BETWEEN 1 AND 120),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  social_image_url TEXT NOT NULL DEFAULT '',
  content JSONB NOT NULL CHECK (jsonb_typeof(content) = 'object'),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS partnership_pages_status_updated_idx
  ON public.partnership_pages (status, updated_at DESC);

DROP TRIGGER IF EXISTS partnership_pages_updated_at ON public.partnership_pages;
CREATE TRIGGER partnership_pages_updated_at
  BEFORE UPDATE ON public.partnership_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.partnership_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS partnership_pages_public_read ON public.partnership_pages;
DROP POLICY IF EXISTS partnership_pages_admin_manage ON public.partnership_pages;

CREATE POLICY partnership_pages_public_read
  ON public.partnership_pages FOR SELECT TO anon, authenticated
  USING (status = 'published' OR public.is_admin());

CREATE POLICY partnership_pages_admin_manage
  ON public.partnership_pages FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.episodes
  ADD COLUMN IF NOT EXISTS partnership_page_id UUID
    REFERENCES public.partnership_pages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS episodes_partnership_page_aired_idx
  ON public.episodes (partnership_page_id, aired_at DESC)
  WHERE partnership_page_id IS NOT NULL;

-- Keep old presenter episodes public. Linked partnership episodes are only
-- exposed when both their page and episode are published; admins retain access
-- to drafts through the same policy.
DROP POLICY IF EXISTS "Allow public read access" ON public.episodes;
DROP POLICY IF EXISTS partnership_episodes_public_read ON public.episodes;
CREATE POLICY partnership_episodes_public_read
  ON public.episodes FOR SELECT TO anon, authenticated
  USING (
    public.is_admin()
    OR partnership_page_id IS NULL
    OR (
      published_at IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.partnership_pages p
        WHERE p.id = episodes.partnership_page_id
          AND p.status = 'published'
      )
    )
  );

-- RLS policies are permissive by default. Replace the existing presenter
-- policies so a presenter cannot attach their episode to an admin's page.
DROP POLICY IF EXISTS "Allow presenters to insert own episodes" ON public.episodes;
CREATE POLICY "Allow presenters to insert own episodes"
  ON public.episodes FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      public.is_presenter()
      AND presenter_id = auth.uid()
      AND partnership_page_id IS NULL
    )
  );

DROP POLICY IF EXISTS "Allow presenters to update own episodes" ON public.episodes;
CREATE POLICY "Allow presenters to update own episodes"
  ON public.episodes FOR UPDATE TO authenticated
  USING (public.is_admin() OR presenter_id = auth.uid())
  WITH CHECK (
    public.is_admin()
    OR (presenter_id = auth.uid() AND partnership_page_id IS NULL)
  );

-- Store partner mixes separately in a private bucket. Public access is granted
-- only through RLS for published episode/page pairs; draft mixes remain private.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('partnership-audio', 'partnership-audio', false, 157286400, ARRAY['audio/mpeg'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS partnership_audio_read_published ON storage.objects;
CREATE POLICY partnership_audio_read_published
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'partnership-audio'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.episodes e
        JOIN public.partnership_pages p ON p.id = e.partnership_page_id
        WHERE e.file_key = storage.objects.name
          AND e.partnership_page_id IS NOT NULL
          AND e.published_at IS NOT NULL
          AND p.status = 'published'
      )
    )
  );

DROP POLICY IF EXISTS partnership_audio_admin_insert ON storage.objects;
CREATE POLICY partnership_audio_admin_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'partnership-audio' AND public.is_admin()
  );

DROP POLICY IF EXISTS partnership_audio_admin_delete ON storage.objects;
CREATE POLICY partnership_audio_admin_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'partnership-audio' AND public.is_admin()
  );

-- The old public URL remains and the import uses existing local assets and
-- episode object keys. Conflict handling makes the import safe to re-run.
INSERT INTO public.partnership_pages (
  id,
  slug,
  title,
  brand_name,
  description,
  social_image_url,
  content,
  status,
  published_at
)
VALUES (
  'd02d6fb4-23bc-4f03-b6e2-2bc237ff12e1',
  'popeyesuk',
  'Pie Radio × Popeyes UK',
  'Popeyes® UK',
  'Pie Radio has teamed up with Popeyes® UK to bring music, culture and community to store openings and live events.',
  '/assets/POPEYES STREET FLYER.webp',
  '{
    "hero": {
      "background": {"src":"/assets/popeyes_heroImg.webp","alt":"Restaurant interior with warm lighting"},
      "stationLogo": {"src":"/assets/logo.png","alt":"Pie Radio logo"},
      "partnerLogo": {"src":"/assets/popeyeUse.png","alt":"Popeyes Louisiana Kitchen logo"},
      "title":"Turning Up the Flavor.",
      "accentTitle":"Turning Up the Volume.",
      "intro":"Pie Radio has teamed up with Popeyes® UK, the global home of bold New Orleans flavour. Together, we’re bringing the energy of music, culture and community to a series of upcoming store openings.\n\nOur DJs, presenters and special guests will be supplying the soundtrack - including the highly anticipated Wilmslow Road launch featuring Saoirse Marie and DJ G2. (Line-ups subject to change. More details coming soon.) Expect live broadcasts and big energy as Popeyes® brings its bold flavour to launch day.",
      "showHeading":"The Source Radio Show - Powered by Popeyes® UK",
      "showDetails":"Launching **Tuesday 14 April - Tuesday 26 May**\n\nA brand-new weekly show exploring the sounds, culture and influence of New Orleans - and its connection to Manchester.\n\nEvery **Tuesday | 5 - 6PM** with **DJ G.A.S.K.I.N & ELISHA**\n\nExpect:\n- Guest DJs & presenters\n- Cultural deep dives\n- Weekly giveaways",
      "closing":"We’re closing the series in style with a live celebration in Manchester (date and location TBA) featuring Manchester artists, DJs, special guests, limited-edition Popeyes® UK and merch.",
      "capacity":"Capacity is limited - sign up now 🎶🍗",
      "waitlistCta":"Join the Waitlist",
      "pressCta":"See Press Release",
      "pressHref":"/press",
      "audioCta":"Preview Heaters Show"
    },
    "gallery": {
      "eyebrow":"Sneak Peek",
      "title":"Behind the Scenes",
      "images":[
        {"src":"/assets/PopeyesBirminghamNewSt_mediumres_38.webp","alt":"Popeyes Birmingham store opening"},
        {"src":"/assets/popeyes_18102023_social-26.webp","alt":"Popeyes food close-up"},
        {"src":"/assets/popeyes_manchester_0001.webp","alt":"Popeyes Manchester store"},
        {"src":"/assets/popeye-3.jpeg","alt":"Popeyes food"}
      ]
    },
    "event": {
      "flyer":{"src":"/assets/POPEYES STREET FLYER.webp","alt":"Feel The Heat event flyer - Pie Radio x Popeyes"},
      "badge":"Exclusive Event",
      "title":"Feel The",
      "accentTitle":"Heat",
      "subtitle":"PIE Radio x Popeyes® · Exclusive Live Event",
      "tags":["Live DJ sets","Epic giveaways"],
      "facts":[
        {"label":"Venue","value":"CUPRA City Garage, Manchester, M2 7LG"},
        {"label":"Date & Time","value":"Friday 22nd May . 7PM - 11:30PM"},
        {"label":"Entry","value":"Free entry (exclusive guest list)"}
      ],
      "fullNameLabel":"Full name",
      "fullNamePlaceholder":"Joe Doe",
      "emailLabel":"Email address",
      "emailPlaceholder":"you@example.com",
      "consent":"I agree to receive marketing emails, updates, and special offers from Popeyes® UK.",
      "submitLabel":"Join the Waitlist",
      "successTitle":"You’re in!",
      "successMessage":"We’ll send event updates to you. Stay hungry. Stay vibing."
    },
    "socials": {
      "eyebrow":"Follow the vibe",
      "title":"Stay Connected",
      "links":[
        {"platform":"instagram","label":"Instagram","href":"https://www.instagram.com/popeyesuk/"},
        {"platform":"twitter","label":"X (Twitter)","href":"https://twitter.com/popeyesuk"},
        {"platform":"facebook","label":"Facebook","href":"https://www.facebook.com/popeyesuk"}
      ]
    },
    "closing": {
      "badge":"Coming Soon",
      "title":"Something Delicious Is on the Way",
      "body":"We’re putting the finishing touches on an unforgettable collaboration. Stay tuned."
    },
    "audio": {
      "showName":"The Heaters Show",
      "brandName":"Popeyes® UK",
      "description":"Listen back to the latest episodes of our sponsored show.",
      "eyebrow":"Partner Spotlight",
      "footer":"Powered by Pie Radio"
    }
  }'::jsonb,
  'published',
  now()
)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.episodes
SET partnership_page_id = (
  SELECT id FROM public.partnership_pages WHERE slug = 'popeyesuk'
)
WHERE category = 'partnership:popeyes-heaters_show'
  AND partnership_page_id IS NULL;

COMMIT;
