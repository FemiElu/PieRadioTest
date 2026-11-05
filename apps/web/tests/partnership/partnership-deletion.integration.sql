-- Run against the local database only. Every fixture is rolled back.
\set ON_ERROR_STOP on
BEGIN;

INSERT INTO auth.users (id, email, role, aud) VALUES
  ('11111111-1111-4111-8111-111111111111', 'partnership-admin@example.invalid', 'authenticated', 'authenticated'),
  ('11111111-1111-4111-8111-222222222222', 'partnership-listener@example.invalid', 'authenticated', 'authenticated');
INSERT INTO public.profiles (id, role) VALUES
  ('11111111-1111-4111-8111-111111111111', 'admin'),
  ('11111111-1111-4111-8111-222222222222', 'listener')
  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
INSERT INTO public.partnership_pages (id, slug, title, brand_name, content, status, updated_at) VALUES
  ('22222222-2222-4222-8222-111111111111', 'deletion-fixture-owned', 'Owned fixture', 'Fixture', '{}', 'draft', '2026-11-04T10:00:00.123456+00:00'),
  ('22222222-2222-4222-8222-222222222222', 'deletion-fixture-shared', 'Shared fixture', 'Fixture', '{"hero":{"background":{"src":"https://example.invalid/storage/v1/object/public/news-images/partnerships/22222222-2222-4222-8222-111111111111/shared.webp"}}}', 'draft', now()),
  ('22222222-2222-4222-8222-333333333333', 'deletion-fixture-imported', 'Imported fixture', 'Fixture', '{}', 'draft', now()),
  ('22222222-2222-4222-8222-444444444444', 'deletion-fixture-published', 'Published fixture', 'Fixture', '{}', 'published', now());
INSERT INTO public.episodes (id, title, file_key, partnership_page_id, published_at) VALUES
  ('33333333-3333-4333-8333-111111111111', 'Owned draft audio', 'partnerships/22222222-2222-4222-8222-111111111111/mix.mp3', '22222222-2222-4222-8222-111111111111', now());
INSERT INTO public.episodes (id, title, file_key, partnership_page_id, presenter_id) VALUES
  ('33333333-3333-4333-8333-222222222222', 'Imported presenter audio', 'legacy/imported.mp3', '22222222-2222-4222-8222-333333333333', '11111111-1111-4111-8111-111111111111');
INSERT INTO storage.buckets (id, name, public) VALUES ('news-images', 'news-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.objects (bucket_id, name) VALUES
  ('news-images', 'partnerships/22222222-2222-4222-8222-111111111111/owned.webp'),
  ('news-images', 'partnerships/22222222-2222-4222-8222-111111111111/shared.webp'),
  ('news-images', 'partnerships/22222222-2222-4222-8222-111111111111/unused.webp'),
  ('partnership-audio', 'partnerships/22222222-2222-4222-8222-111111111111/mix.mp3');

-- Simulate a permissive legacy news policy. The new restrictive policies must
-- still guard partnership namespaces without changing ordinary news uploads.
CREATE POLICY fixture_legacy_news_access ON storage.objects
  FOR ALL TO authenticated USING (bucket_id = 'news-images') WITH CHECK (bucket_id = 'news-images');

SELECT set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

DO $$
DECLARE
  v_result JSONB;
  v_job JSONB;
  v_manifest JSONB;
  v_version TIMESTAMPTZ;
  v_job_id UUID;
  v_denied BOOLEAN;
BEGIN
  IF has_function_privilege('anon', 'public.delete_partnership_draft(uuid,timestamptz)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.claim_partnership_cleanup_job(uuid,boolean)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.get_partnership_cleanup_manifest(uuid,boolean,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Anonymous roles must not execute cleanup RPCs';
  END IF;
  v_result := public.delete_partnership_draft('22222222-2222-4222-8222-111111111111', '2026-11-04T10:00:00.123455Z');
  IF v_result->>'outcome' <> 'conflict' THEN RAISE EXCEPTION 'Microsecond conflict was not preserved'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.episodes WHERE id = '33333333-3333-4333-8333-111111111111') THEN RAISE EXCEPTION 'Conflicting delete mutated its episode'; END IF;

  SELECT updated_at INTO v_version FROM public.partnership_pages WHERE id = '22222222-2222-4222-8222-444444444444';
  v_result := public.delete_partnership_draft('22222222-2222-4222-8222-444444444444', v_version);
  IF v_result->>'outcome' <> 'blocked' THEN RAISE EXCEPTION 'Published page deletion was not blocked'; END IF;
  SELECT updated_at INTO v_version FROM public.partnership_pages WHERE id = '22222222-2222-4222-8222-333333333333';
  v_result := public.delete_partnership_draft('22222222-2222-4222-8222-333333333333', v_version);
  IF v_result->>'outcome' <> 'blocked' THEN RAISE EXCEPTION 'Imported mix deletion was not blocked'; END IF;

  v_result := public.delete_partnership_draft('22222222-2222-4222-8222-111111111111', '2026-11-04T10:00:00.123456Z');
  IF v_result->>'outcome' <> 'deleted' THEN RAISE EXCEPTION 'Owned draft deletion failed: %', v_result; END IF;
  IF EXISTS (SELECT 1 FROM public.partnership_pages WHERE id = '22222222-2222-4222-8222-111111111111')
     OR EXISTS (SELECT 1 FROM public.episodes WHERE id = '33333333-3333-4333-8333-111111111111') THEN
    RAISE EXCEPTION 'Page and episode were not deleted together';
  END IF;
  v_job_id := (v_result->>'job_id')::UUID;
  IF NOT EXISTS (SELECT 1 FROM public.partnership_cleanup_jobs WHERE id = v_job_id AND jsonb_array_length(objects) = 4) THEN
    RAISE EXCEPTION 'Durable cleanup manifest did not survive page deletion';
  END IF;
  v_result := public.delete_partnership_draft('22222222-2222-4222-8222-111111111111', '2026-11-04T10:00:00.123456+00:00');
  IF v_result->>'outcome' <> 'already_deleted' OR (v_result->>'job_id')::UUID <> v_job_id THEN RAISE EXCEPTION 'Delete retry was not idempotent'; END IF;

  v_job := public.claim_partnership_cleanup_job(v_job_id, true);
  IF v_job->>'status' <> 'processing' OR (v_job->>'attempts')::INT <> 1 THEN RAISE EXCEPTION 'Cleanup claim failed'; END IF;
  IF public.claim_partnership_cleanup_job(v_job_id, true) IS NOT NULL THEN RAISE EXCEPTION 'An active cleanup lease was stolen'; END IF;
  v_manifest := public.get_partnership_cleanup_manifest(v_job_id, false, (v_job->>'lock_token')::UUID);
  IF jsonb_array_length(v_manifest) <> 3 OR v_manifest::TEXT LIKE '%shared.webp%' THEN RAISE EXCEPTION 'Shared asset was not preserved: %', v_manifest; END IF;
  IF v_manifest::TEXT NOT LIKE '%unused.webp%' THEN RAISE EXCEPTION 'Unused upload was not included'; END IF;

  v_denied := false;
  BEGIN
    PERFORM public.get_partnership_cleanup_manifest(v_job_id, false, gen_random_uuid());
  EXCEPTION WHEN insufficient_privilege THEN v_denied := true; END;
  IF NOT v_denied THEN RAISE EXCEPTION 'Manifest accepted the wrong lease token'; END IF;

  UPDATE public.partnership_cleanup_jobs SET status = 'completed', completed_at = now(), lock_token = NULL, locked_at = NULL WHERE id = v_job_id;
  IF public.claim_partnership_cleanup_job(v_job_id, true)->>'status' <> 'completed' THEN RAISE EXCEPTION 'Completed retry lost its completion state'; END IF;
  RAISE NOTICE 'PASS: version conflicts, published/import guards, atomic deletion, durable job, shared preservation, lease protection, completed retry';
END;
$$;

-- Restrictive Storage INSERT policy blocks an upload whose page was deleted,
-- even when another permissive admin/news policy would otherwise allow it.
-- Storage API uses this transaction-local flag for metadata DELETE. These
-- fixtures contain metadata only, have no real files, and are rolled back.
SELECT set_config('storage.allow_delete_query', 'true', true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE v_denied BOOLEAN := false;
BEGIN
  BEGIN
    INSERT INTO storage.objects (bucket_id, name) VALUES ('news-images', 'partnerships/22222222-2222-4222-8222-111111111111/late.webp');
  EXCEPTION WHEN insufficient_privilege THEN v_denied := true; END;
  IF NOT v_denied THEN RAISE EXCEPTION 'Upload to deleted page was not blocked by RLS'; END IF;
  INSERT INTO storage.objects (bucket_id, name) VALUES ('news-images', 'root-image.webp');
  DELETE FROM storage.objects WHERE bucket_id = 'news-images' AND name = 'partnerships/22222222-2222-4222-8222-111111111111/owned.webp';
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'news-images' AND name = 'partnerships/22222222-2222-4222-8222-111111111111/owned.webp') THEN
    RAISE EXCEPTION 'Admin cleanup DELETE policy did not allow owned image removal';
  END IF;
  RAISE NOTICE 'PASS: admin storage deletion, deleted-parent upload guard, ordinary news uploads preserved';
END;
$$;
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-222222222222","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE v_denied BOOLEAN;
BEGIN
  v_denied := false;
  BEGIN PERFORM public.delete_partnership_draft('22222222-2222-4222-8222-333333333333', now());
  EXCEPTION WHEN insufficient_privilege THEN v_denied := true; END;
  IF NOT v_denied THEN RAISE EXCEPTION 'Listener could delete a draft'; END IF;
  v_denied := false;
  BEGIN PERFORM public.claim_partnership_cleanup_job(gen_random_uuid(), true);
  EXCEPTION WHEN insufficient_privilege THEN v_denied := true; END;
  IF NOT v_denied THEN RAISE EXCEPTION 'Listener could claim cleanup'; END IF;
  v_denied := false;
  BEGIN PERFORM public.get_partnership_cleanup_manifest(gen_random_uuid(), false, NULL);
  EXCEPTION WHEN insufficient_privilege THEN v_denied := true; END;
  IF NOT v_denied THEN RAISE EXCEPTION 'Listener could inspect cleanup manifests'; END IF;
  v_denied := false;
  BEGIN PERFORM public.partnership_storage_object_referenced('private/file.mp3', NULL);
  EXCEPTION WHEN insufficient_privilege THEN v_denied := true; END;
  IF NOT v_denied THEN RAISE EXCEPTION 'Listener could inspect storage references'; END IF;
  v_denied := false;
  BEGIN
    INSERT INTO storage.objects (bucket_id, name) VALUES ('news-images', 'partnerships/22222222-2222-4222-8222-444444444444/listener.webp');
  EXCEPTION WHEN insufficient_privilege THEN v_denied := true; END;
  IF NOT v_denied THEN RAISE EXCEPTION 'Legacy news policy permitted listener partnership upload'; END IF;
  DELETE FROM storage.objects WHERE bucket_id = 'news-images' AND name = 'partnerships/22222222-2222-4222-8222-111111111111/shared.webp';
  IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'news-images' AND name = 'partnerships/22222222-2222-4222-8222-111111111111/shared.webp') THEN
    RAISE EXCEPTION 'Legacy news policy permitted listener partnership deletion';
  END IF;
  RAISE NOTICE 'PASS: all cleanup RPCs reject non-admins; restrictive storage policies override permissive legacy access';
END;
$$;
RESET ROLE;

ROLLBACK;
