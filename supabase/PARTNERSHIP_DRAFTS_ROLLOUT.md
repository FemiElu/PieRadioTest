# Partnership drafts rollout

The admin workspace opens at `/admin/partnerships/drafts`. Drafts, Published, and Archived are bookmarkable folders; each page displays three records without limiting stored drafts.

## Preview database

Apply these targeted migrations in order after the existing partnership page and image-storage migrations:

1. `migrations/20261104140000_partnership_draft_deletion.sql`
2. `migrations/20261104150000_lock_partnership_draft_mix_ownership.sql`

The second migration freezes linked mix ownership during the deletion transaction. Both migrations are safe to reapply. Reconcile the preview migration ledger with the repository before running a general `supabase db push`; SQL-editor execution does not update CLI migration history automatically.

Without the deletion schema, listing and publishing still work and the workspace disables permanent deletion. SQL-editor success should be followed by a read-only check of `public.partnership_cleanup_jobs` and the cleanup RPCs.

## Server configuration

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY` must belong to the same preview project. Never share the service-role key or expose it through a `NEXT_PUBLIC_` variable. Restart the local server after saving environment changes, and configure the matching server key in Vercel Preview as well.

The authenticated schedule cron also retries up to three pending media cleanup jobs. `CRON_SECRET` is required for that cleanup path even in development. Admins can use **Retry cleanup** through their normal authenticated session; this does not need the service-role key.

## Deletion behavior

Permanent deletion requires typing `DELETE`, applies only to drafts, and compares the exact saved `updated_at` version. Imported/shared mixes block deletion until ownership is resolved. Owned mix rows and the page are removed in one transaction; a durable job remains until Storage API cleanup succeeds.

Only objects in that draft's `partnerships/<page-id>/` namespace in `news-images` and `partnership-audio` are candidates. Saved references from other pages and known content tables are preserved. Static, external, and imported assets remain untouched. A pending-cleanup notice means the draft is deleted but some media still awaits removal.

## Verification

Use disposable preview drafts to check save confirmation, reopening a draft, editing, preview, pagination, selecting ready and incomplete drafts together, and version conflicts. Confirm published and archived pages cannot be permanently deleted. Exercise the `DELETE` dialog with keyboard navigation and confirm media cleanup failures remain retryable.

Automated tests live in `apps/web/tests/partnership/`. The SQL integration fixture `partnership-deletion.integration.sql` runs within a rolled-back transaction against a local Supabase database. Browser layout and interaction checks use isolated fixtures so existing preview campaigns and media are not changed by QA.
