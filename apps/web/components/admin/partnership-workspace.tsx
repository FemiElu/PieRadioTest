"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, Archive, ArrowUpRight, CheckCircle2, ChevronLeft, ChevronRight, Clock3, ExternalLink, FileText, FolderOpen, Loader2, Pencil, Plus, RefreshCw, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PartnershipActionResult, PartnershipStatus, PartnershipSummary, PartnershipWorkspaceResponse } from "@/lib/partnerships/admin-types";

type PendingAction = { type: "publish" | "delete_drafts"; pages: PartnershipSummary[]; viewKey: string };
const folders = [
    { status: "draft", path: "drafts", label: "Drafts", icon: FileText },
    { status: "published", path: "published", label: "Published", icon: CheckCircle2 },
    { status: "archived", path: "archived", label: "Archived", icon: Archive },
] as const;

function savedAt(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Saved time unavailable" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function PartnershipWorkspace({ status, page = 1 }: { status: PartnershipStatus; page?: number }) {
    const router = useRouter();
    const viewKey = `${status}:${page}`;
    const currentView = useRef(viewKey);
    currentView.current = viewKey;
    const [data, setData] = useState<PartnershipWorkspaceResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState<string[]>([]);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const [confirmation, setConfirmation] = useState("");
    const [actionError, setActionError] = useState("");
    const [busy, setBusy] = useState(false);
    const actionPending = useRef(false);
    const dialogOpener = useRef<HTMLElement | null>(null);
    const folderHeading = useRef<HTMLHeadingElement | null>(null);
    const [results, setResults] = useState<Record<string, PartnershipActionResult>>({});
    const [notice, setNotice] = useState("");
    const folder = folders.find((item) => item.status === status)!;

    const load = useCallback(async (signal?: AbortSignal) => {
        const requestedView = `${status}:${page}`;
        if (currentView.current !== requestedView) return;
        setLoading(true);
        setError("");
        try {
            const response = await fetch(`/api/admin/partnerships?status=${status}&page=${page}`, { cache: "no-store", signal });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Could not load partnerships.");
            if (signal?.aborted || currentView.current !== requestedView) return;
            setData(result);
            if (result.meta.page !== page) router.replace(`/admin/partnerships/${folders.find((item) => item.status === status)!.path}?page=${result.meta.page}`);
        } catch (failure) {
            if (!signal?.aborted && currentView.current === requestedView) setError(failure instanceof Error ? failure.message : "Could not load partnerships.");
        } finally { if (!signal?.aborted && currentView.current === requestedView) setLoading(false); }
    }, [page, router, status]);

    useEffect(() => {
        const controller = new AbortController();
        setData(null); setSelected([]); setResults({}); setNotice(""); setPendingAction(null); setConfirmation("");
        void load(controller.signal);
        return () => controller.abort();
    }, [load]);

    useEffect(() => {
        if (!pendingAction || busy || !data) return;
        if (pendingAction.viewKey !== viewKey || pendingAction.pages.some((item) => !data.pages.some((current) => current.id === item.id && current.updated_at === item.updated_at && current.status === "draft"))) {
            setPendingAction(null); setConfirmation(""); setSelected([]);
            setNotice("The selected drafts changed. Review the current folder before trying again.");
        }
    }, [busy, data, pendingAction, viewKey]);

    const selectedPages = data?.pages.filter((item) => selected.includes(item.id)).slice(0, 3) ?? [];
    const allSelected = Boolean(data?.pages.length) && selectedPages.length === Math.min(3, data?.pages.length ?? 0);
    const toggle = (id: string) => { if (!actionPending.current) setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current); };
    const openAction = (type: PendingAction["type"], pages: PartnershipSummary[]) => {
        if (status !== "draft" || pages.length < 1 || pages.length > 3 || pages.some((item) => item.status !== "draft")) return;
        dialogOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setConfirmation(""); setActionError(""); setPendingAction({ type, pages, viewKey });
    };

    const performAction = async () => {
        if (!pendingAction || actionPending.current || (pendingAction.type === "delete_drafts" && confirmation !== "DELETE")) return;
        if (pendingAction.viewKey !== currentView.current || pendingAction.pages.some((item) => !data?.pages.some((current) => current.id === item.id && current.updated_at === item.updated_at && current.status === "draft"))) {
            setPendingAction(null); setConfirmation(""); setSelected([]);
            setNotice("The selected drafts changed. Review the current folder before trying again.");
            return;
        }
        actionPending.current = true;
        setBusy(true); setActionError("");
        try {
            const response = await fetch("/api/admin/partnerships/actions", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: pendingAction.type, items: pendingAction.pages.map(({ id, updated_at }) => ({ id, updated_at })), ...(pendingAction.type === "delete_drafts" ? { confirmation: "DELETE" } : {}) }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Could not complete this action.");
            const outcomes: PartnershipActionResult[] = result.results;
            const success = outcomes.filter((item) => ["published", "deleted", "cleanup_pending"].includes(item.status));
            const failed = outcomes.length - success.length;
            const message = `${success.length} ${success.length === 1 ? "draft" : "drafts"} ${pendingAction.type === "publish" ? "published" : "deleted"}.${failed ? ` ${failed} ${failed === 1 ? "draft needs" : "drafts need"} attention below.` : ""}`;
            if (pendingAction.viewKey === currentView.current) {
                setResults(Object.fromEntries(outcomes.map((item) => [item.id, item])));
                setNotice(message);
            }
            if (success.length) toast.success(message); else toast.error("No drafts changed. Review the reasons below.");
            setSelected([]); setPendingAction(null);
            await load();
        } catch (failure) {
            const message = failure instanceof Error ? failure.message : "Could not complete this action.";
            setActionError(message); toast.error(message);
        } finally { actionPending.current = false; setBusy(false); }
    };

    const retryCleanup = async () => {
        if (actionPending.current) return;
        actionPending.current = true;
        setBusy(true);
        try {
            const response = await fetch("/api/admin/partnerships/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "retry_cleanup" }) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Could not retry media cleanup.");
            const message = result.cleanup.pending ? `${result.cleanup.pending} media cleanup ${result.cleanup.pending === 1 ? "job is" : "jobs are"} still pending.` : "Media cleanup completed.";
            setNotice(message);
            if (result.cleanup.pending) toast.info(message); else toast.success(message);
            await load();
        } catch (failure) {
            const message = failure instanceof Error ? failure.message : "Could not retry media cleanup.";
            setNotice(message); toast.error(message);
        } finally { actionPending.current = false; setBusy(false); }
    };

    return <section className="mx-auto w-full max-w-6xl space-y-7" aria-labelledby="partnership-workspace-title">
        <header className="flex flex-wrap items-end justify-between gap-5">
            <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Campaign workspace</p><h1 id="partnership-workspace-title" className="font-display text-3xl font-black tracking-tight text-[#141827] sm:text-4xl">Partnerships</h1><p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">Keep every campaign together, from the first saved draft to its live page.</p></div>
            <Button asChild className="h-11 rounded-xl px-5"><Link href="/admin/partnerships/new"><Plus className="mr-2 h-4 w-4" />New partnership</Link></Button>
        </header>

        <nav aria-label="Partnership folders" className="flex gap-1 overflow-x-auto rounded-2xl border border-border/60 bg-white p-2">
            {folders.map((item) => <Link key={item.status} href={`/admin/partnerships/${item.path}`} aria-current={status === item.status ? "page" : undefined} aria-disabled={busy} onClick={(event) => { if (actionPending.current) event.preventDefault(); }} className={`flex min-h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold sm:gap-2 sm:px-3 sm:text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:flex-none sm:min-w-40 ${status === item.status ? "bg-primary/10 text-primary" : "text-zinc-600 hover:bg-zinc-50"}`}><item.icon className="hidden h-4 w-4 shrink-0 sm:block" /><span>{item.label}</span>{data && <span className={`rounded-md px-1.5 py-0.5 text-[11px] sm:px-2 sm:text-xs ${status === item.status ? "bg-primary text-white" : "bg-zinc-100 text-zinc-700"}`}>{data.meta.counts[item.status]}</span>}</Link>)}
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 ref={folderHeading} tabIndex={-1} className="w-fit rounded text-xl font-bold text-[#141827] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">{folder.label}</h2><p className="mt-1 text-sm text-zinc-600">{status === "draft" ? "Saved work in progress. Preview, refine, then publish when ready." : status === "published" ? "Campaigns currently available on the public website." : "Campaigns that have been taken offline."}</p></div>{data && <p className="text-xs font-medium text-zinc-500">{data.meta.total} {data.meta.total === 1 ? "page" : "pages"} · 3 per page</p>}</div>
        {notice && <div role="status" className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{notice}</div>}
        {data && !data.cleanup.available && status === "draft" && <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p>Permanent deletion is not available yet. The draft-deletion database setup must be applied before drafts can be removed.</p></div>}
        {Boolean(data?.cleanup.pending) && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p>{data!.cleanup.pending} deleted {data!.cleanup.pending === 1 ? "draft has" : "drafts have"} media cleanup pending. The files have not all been removed yet.</p><Button type="button" variant="outline" disabled={busy} onClick={() => void retryCleanup()}><RefreshCw className="mr-2 h-4 w-4" />Retry cleanup</Button></div>}

        {error ? <div role="alert" className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-6"><p className="font-semibold text-red-900">Could not load this folder</p><p className="text-sm text-red-800">{error}</p><Button type="button" variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Retry loading</Button></div>
            : loading ? <div role="status" className="space-y-4"><p className="flex items-center gap-2 text-sm text-zinc-600"><Loader2 className="h-4 w-4 animate-spin" />Loading {folder.label.toLowerCase()}…</p>{[0, 1, 2].map((item) => <div key={item} aria-hidden="true" className="h-44 animate-pulse rounded-2xl border border-border/50 bg-white" />)}</div>
            : data && data.pages.length === 0 ? <div className="flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center"><FolderOpen className="mb-5 h-10 w-10 text-primary/70" /><h3 className="text-lg font-bold text-[#141827]">{status === "draft" ? "Your next partnership starts here" : `No ${folder.label.toLowerCase()} pages yet`}</h3><p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">{status === "draft" ? "Create a partnership and save it as a draft. It will be waiting in this folder whenever you return." : "Pages will appear in this folder when their publishing status changes."}</p>{status === "draft" && <Button asChild className="mt-6 rounded-xl"><Link href="/admin/partnerships/new"><Plus className="mr-2 h-4 w-4" />Create a draft</Link></Button>}</div>
            : data && <>
                {status === "draft" && <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-white px-4 py-3"><label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-[#141827]"><input type="checkbox" className="h-4 w-4 accent-[#334aff]" checked={allSelected} disabled={busy} onChange={() => setSelected(allSelected ? [] : data.pages.slice(0, 3).map((item) => item.id))} aria-label="Select all drafts on this page" />{selected.length ? `${selected.length} selected` : "Select this page"}</label><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={!selected.length || busy || !data.cleanup.available} onClick={() => openAction("delete_drafts", selectedPages)} className="text-red-700"><Trash2 className="mr-2 h-4 w-4" />Delete selected</Button><Button type="button" disabled={!selected.length || busy} onClick={() => openAction("publish", selectedPages)}><Send className="mr-2 h-4 w-4" />Publish selected</Button></div></div>}
                <div className="space-y-4" aria-label={`${folder.label} partnership pages`}>{data.pages.map((item) => <PartnershipCard key={item.id} page={item} selected={selected.includes(item.id)} busy={busy} canDelete={data.cleanup.available} result={results[item.id]} onSelect={() => toggle(item.id)} onAction={(type) => openAction(type, [item])} />)}</div>
                <nav aria-label="Partnership pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5"><p className="text-sm text-zinc-600">Page <strong className="text-[#141827]">{data.meta.page}</strong> of {Math.max(1, data.meta.totalPages)}</p><div className="flex gap-2"><Button type="button" variant="outline" disabled={data.meta.page <= 1 || busy} onClick={() => router.push(`/admin/partnerships/${folder.path}?page=${data.meta.page - 1}`)}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button><Button type="button" variant="outline" disabled={data.meta.page >= data.meta.totalPages || busy} onClick={() => router.push(`/admin/partnerships/${folder.path}?page=${data.meta.page + 1}`)}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button></div></nav>
            </>}

        <Dialog open={Boolean(pendingAction)} onOpenChange={(open) => { if (!open && !busy) setPendingAction(null); }}>
            <DialogContent onCloseAutoFocus={(event) => { event.preventDefault(); const opener = dialogOpener.current; if (opener?.isConnected && !opener.hasAttribute("disabled")) opener.focus(); else folderHeading.current?.focus(); }} className="max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-2xl"><DialogHeader><DialogTitle className="text-xl text-[#141827]">{pendingAction?.type === "delete_drafts" ? "Permanently delete drafts?" : "Publish selected drafts"}</DialogTitle><DialogDescription>{pendingAction?.type === "delete_drafts" ? "This permanently removes the selected drafts, their owned mixes and uploaded media. You cannot restore them." : "Ready drafts will go live. Drafts with incomplete content will stay in Drafts with the reasons shown below."}</DialogDescription></DialogHeader>
                <ul className="space-y-3 rounded-xl border border-border/60 bg-zinc-50 p-4">{pendingAction?.pages.map((item) => <li key={item.id}><p className="text-sm font-bold text-[#141827]">{item.title}</p>{pendingAction.type === "publish" && <>{item.content_valid && !item.publish_issues.length ? <p className="mt-1 text-xs font-semibold text-emerald-700">Ready to publish</p> : <div className="mt-1 space-y-1 text-xs text-amber-950">{item.publish_issues.map((issue) => <p key={issue}>{issue}</p>)}<Link className="inline-block font-semibold underline" href={`/admin/partnerships/${item.id}/edit`}>Edit this draft</Link></div>}</>}</li>)}</ul>
                {pendingAction?.type === "delete_drafts" && <div className="space-y-2"><label htmlFor="delete-drafts-confirmation" className="text-sm font-semibold text-[#141827]">Type DELETE to confirm</label><Input id="delete-drafts-confirmation" autoComplete="off" value={confirmation} disabled={busy} onChange={(event) => setConfirmation(event.target.value)} /></div>}
                {actionError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{actionError}</p>}
                <DialogFooter className="gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setPendingAction(null)}>Cancel</Button><Button type="button" className={pendingAction?.type === "delete_drafts" ? "bg-red-600 hover:bg-red-700" : ""} disabled={busy || (pendingAction?.type === "delete_drafts" ? confirmation !== "DELETE" : !pendingAction?.pages.some((item) => item.content_valid && !item.publish_issues.length))} onClick={() => void performAction()}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{busy ? "Working…" : pendingAction?.type === "delete_drafts" ? "Delete permanently" : "Publish ready drafts"}</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    </section>;
}

function PartnershipCard({ page, selected, busy, canDelete, result, onSelect, onAction }: { page: PartnershipSummary; selected: boolean; busy: boolean; canDelete: boolean; result?: PartnershipActionResult; onSelect: () => void; onAction: (action: PendingAction["type"]) => void }) {
    const isDraft = page.status === "draft";
    const [imageFailed, setImageFailed] = useState(false);
    useEffect(() => { setImageFailed(false); }, [page.thumbnail_url]);
    return <article className={`overflow-hidden rounded-2xl border bg-white transition-shadow ${selected ? "border-primary/50 shadow-[0_0_0_1px_rgba(51,74,255,0.12)]" : "border-border/60 hover:shadow-sm"}`}>
        <div className="flex flex-col sm:flex-row">
            <div className="relative aspect-[2.4/1] shrink-0 overflow-hidden bg-zinc-100 sm:aspect-auto sm:w-44">{page.thumbnail_url && !imageFailed ? <Image src={page.thumbnail_url} alt="" fill unoptimized sizes="(max-width: 640px) 100vw, 176px" className="object-cover" onError={() => setImageFailed(true)} /> : <div className="flex h-full min-h-32 items-center justify-center bg-[#eef1ff] font-display text-4xl font-black text-primary/35">{page.brand_name.slice(0, 2).toUpperCase()}</div>}</div>
            <div className="min-w-0 flex-1 p-5 sm:p-6"><div className="flex items-start gap-3">{isDraft && <input aria-label={`Select ${page.title}`} type="checkbox" checked={selected} disabled={busy} onChange={onSelect} className="mt-1 h-4 w-4 shrink-0 accent-[#334aff]" />}<div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-wide text-zinc-500">{page.brand_name}</span><span className={`rounded-md px-2 py-0.5 text-xs font-bold ${isDraft ? "bg-amber-100 text-amber-900" : page.status === "published" ? "bg-emerald-100 text-emerald-900" : "bg-zinc-100 text-zinc-700"}`}>{isDraft ? "Draft" : page.status === "published" ? "Live" : "Archived"}</span></div><h3 className="break-words text-xl font-bold tracking-tight text-[#141827]">{page.title}</h3><p className="mt-1 break-all text-xs text-zinc-500">/partnerships/{page.slug}</p><p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-600"><Clock3 className="h-3.5 w-3.5" />Saved {savedAt(page.updated_at)}</p></div></div>
                {!page.content_valid && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">This saved page has content that needs review. It remains in this folder, but cannot be previewed or published yet.</p>}
                {isDraft && page.publish_issues.length > 0 && <details className="mt-4 text-sm text-amber-950"><summary className="cursor-pointer font-semibold">Needs attention before publishing</summary><ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5">{page.publish_issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></details>}
                {isDraft && page.content_valid && !page.publish_issues.length && <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Ready to publish</p>}
                {result && !["published", "deleted", "cleanup_pending"].includes(result.status) && <div role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{result.message || "This draft could not be changed."}{result.issues?.map((issue) => <p key={issue} className="mt-1 text-xs">{issue}</p>)}</div>}
                <div className="mt-5 flex flex-wrap gap-2"><Button asChild variant="outline" size="sm"><Link href={`/admin/partnerships/${page.id}/edit`}><Pencil className="mr-2 h-3.5 w-3.5" />Edit</Link></Button>{page.content_valid ? <Button asChild variant="ghost" size="sm"><Link href={`/admin/partnerships/${page.id}/preview`} target="_blank" rel="noopener noreferrer"><ArrowUpRight className="mr-2 h-3.5 w-3.5" />Preview</Link></Button> : <Button type="button" variant="ghost" size="sm" disabled>Preview unavailable</Button>}{page.status === "published" && <Button asChild variant="ghost" size="sm"><Link href={`/partnerships/${page.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-3.5 w-3.5" />View live</Link></Button>}{isDraft && <><Button type="button" size="sm" disabled={busy} onClick={() => onAction("publish")}><Send className="mr-2 h-3.5 w-3.5" />Publish</Button><Button type="button" variant="ghost" size="sm" className="text-red-700 hover:bg-red-50 hover:text-red-800" disabled={busy || !canDelete} onClick={() => onAction("delete_drafts")}><Trash2 className="mr-2 h-3.5 w-3.5" />Delete</Button></>}</div>
            </div>
        </div>
    </article>;
}
