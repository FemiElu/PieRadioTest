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

## Production application verification — 20 November 2026

The reviewed production SQL transaction `20261120130000` has been applied with explicit approval. Its six independent post-commit checks passed. Do not replay the historical migration list above or run a general database push.

A clean release installation exposed newer web-runtime advisories. The application candidate now uses Next.js and eslint-config-next 15.5.29, sharp 0.35.5, and a scoped Next.js PostCSS 8.5.33 override. Compatible Axios, Zod, Resend, WebSocket and build-tool transitive updates are recorded in the lockfile. Web React/React DOM remain 19.2.3; mobile manifests and React requirements are unchanged. A stale nested PostCSS lock entry was regenerated with npm, and a final clean `npm ci` and dependency-tree check passed.

Post-correction verification: 177 tests across 25 files passed; TypeScript, lint, Node 20 production build and a real PNG-to-WebP conversion passed. Vercel remains on Node 24; its build must pass separately. No forced blanket audit upgrade was used. The final `npm audit --omit=dev --workspace=web` reports no critical advisory. The remaining Babel and brace-expansion findings have no path in the web production dependency tree (`npm ls --workspace=web --omit=dev`); the CSV parser's moderate columns-mode finding concerns a mode not enabled by the protected schedule importer. These are not a claim that all monorepo dependency advisories are resolved.

Public advisory references: https://github.com/advisories/GHSA-2464-fhr4-w9xw and https://github.com/advisories/GHSA-f88m-g3jw-g9cj .

Production Popeyes preservation is sourced from the live page at the existing production commit, not the Preview database or the migration seed. A draft record is prepared using the current static assets, wording and production metadata description, with a descriptive page/footer title. Five existing published episodes retain their IDs, file keys, presenter ownership and publication dates; associate them only in the guarded publication transaction. The inherited social href values are retained rather than inventing new destinations. No subscriber records are moved or test submissions sent to the production waitlist webhook.

Deploy the corrected release to Preview using the existing branch-specific Preview credentials. Keep production traffic on deployment `dpl_BF5xgj1gQv9Yruk61nbQgsmDKMS5` until the patched Preview workflow and staged Production build pass. Build with Production settings using `--prod --skip-domain`; inspect both deployment state and active cron configuration before promotion. The production schedule/cleanup runtime must not be invoked manually as a smoke test. Only promote the verified deployment, then synchronize the production branch without triggering a duplicate automatic production build. Retain the prior deployment for application rollback; keep schema and security repairs in place.
