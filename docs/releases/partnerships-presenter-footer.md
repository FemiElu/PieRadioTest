# Partnerships, presenter show editing, and footer release

## Candidate and boundaries

Branch: `release/partnerships-presenter-footer`, based on production `09ab61ef58f46f93c190cdb786f4e9ee9ecadb79` (Vercel deployment `dpl_BF5xgj1gQv9Yruk61nbQgsmDKMS5`). Includes source features `6555378`, `ac18595`, and `5d8b372`, plus partner themes and matching web React/React DOM 19.2.3. Mobile React remains 19.1.0. The original iCloud checkouts and their uncommitted changes are preserved.

This candidate transfers functionality only. Do not copy Preview partnerships, users, subscriber records, or uploaded media into production. No production SQL, production merge, or live deployment is authorized by this preparation stage.

## Reproducible checks

Use a clean checkout outside iCloud, Node 20, and npm with the committed `.npmrc`. Run `npm ci` from the monorepo root; a web-only workspace install can omit the hoisted Tailwind peer used by `tailwindcss-animate`. The Supabase CLI root postinstall downloads GitHub assets and needs working network access.

Run `npm ls react react-dom --workspace=web`, `npm run test --workspace=web -- --run --maxWorkers=1 --testTimeout=20000`, `npm exec --workspace=web -- tsc --noEmit --incremental false`, `npm run lint --workspace=web`, and `npm run build --workspace=web`. The single test worker avoids UI timeouts on the shared local machine. Do not disable type/lint errors to obtain a build.

Vercel currently selects Node 24 for this project. Record the runtime used by the deployed Preview separately from the local Node 20 checks; do not silently change the production project's runtime.

## Production database prerequisites — next rollout stage only

Back up production database data and Storage objects separately. Inspect the actual schema and `supabase_migrations.schema_migrations`; SQL-editor executions do not populate the CLI ledger. Never run a general `supabase db push` until history and schema are reconciled. Only mark a migration applied after verifying its complete effects.

Check existing admin helpers, `set_updated_at`, profiles/presenter tables, episode fields (including `aired_at`, file metadata, publication fields), category support, and episode/storage RLS. Review the existing presenter/episode prerequisite migrations and apply only genuinely missing changes.

Review these targeted migrations in order:

1. `20261103120000_add_partnership_pages.sql`: page schema, episode linking, RLS, private partnership-audio bucket. **Do not blindly run the whole file in production.** Its trailing Popeyes INSERT/episode UPDATE is a content import, including automatic publication. Prepare a reviewed schema-only production script excluding both content statements; preserve original migration files and reconcile their history deliberately.
2. `20261104120000_ensure_partnership_image_storage.sql`: image bucket and upload policies. Existing bucket settings are preserved by the INSERT; independently verify public access, MIME types, and size limits.
3. `20261104140000_partnership_draft_deletion.sql`: admin deletion transaction, cleanup jobs/RPCs, media deletion permissions.
4. `20261104150000_lock_partnership_draft_mix_ownership.sql`: concurrency protection for mix ownership during deletion.
5. `20261106120000_ensure_presenter_show_artwork_storage.sql`: avatars bucket and admin show-artwork uploads, only if missing.
6. `20261106121000_ensure_presenter_alias.sql`: nullable presenter alias needed by the existing presenter list, only if missing.

Existing public `/popeyesuk` becomes database-backed in this release. Before switching live traffic, establish and verify a production record reflecting the currently approved live page, using production-owned assets and deliberate editorial review. This is preservation of existing production content, not transfer of Preview campaigns. Do not release while that URL would return 404. Newly created production campaigns remain drafts until explicitly published by an admin.

## Environment, cron, and release gates

The release branch has its own three Preview Supabase keys. Validate URL and JWT project/role together without logging values. Before a future production build, verify the corresponding Production values, auth redirects and image loader. Keep the service-role key server-only. Do not reuse a Preview build artifact as the production artifact.

The effective config is `apps/web/vercel.json`, because the Vercel Root Directory is `apps/web`. It now schedules the existing `/api/cron/sync-schedule` runtime daily at 03:00 UTC, within Vercel Hobby limits. The platform may invoke it within the scheduled hour. The earlier hourly expression was rejected before a build; increasing frequency requires a supported plan or scheduler. This route also retries at most three cleanup jobs and requires `CRON_SECRET` for privileged cleanup. Verify Production `CRON_SECRET` and service role, schedule source configuration, and the active cron definition after the future production deployment. Preview testing uses authenticated admin Retry cleanup; do not invoke the schedule synchronization against production during candidate QA.

Test the deployed candidate with disposable Preview records: draft save/status, uploads and mixes, publish/readiness failures, batch actions/pagination, stale saves, draft-only deletion, durable cleanup and retry, rich text, themes/flyer crop, footer add/rename/remove, public draft isolation, and presenter editing/create/reorder/delete on desktop/mobile and keyboard. Remove only QA-owned records/assets; record any abandoned presenter artwork and remove only those uniquely created by QA.

After candidate approval, back up, apply reviewed prerequisites, build using Production settings without assigning live domains, verify the production build, then explicitly promote and synchronize the production branch. Retain the prior deployment for application rollback. Rolling back application code does not undo database migrations, content writes, or permanent deletion. Prefer compatible schema retention and forward fixes over dropping live tables or buckets.
