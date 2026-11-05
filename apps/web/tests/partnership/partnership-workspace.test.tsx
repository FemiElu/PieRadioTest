import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PartnershipWorkspace } from "@/components/admin/partnership-workspace";
import type { PartnershipSummary, PartnershipWorkspaceResponse } from "@/lib/partnerships/admin-types";

const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const notifications = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("sonner", () => ({ toast: notifications }));
vi.mock("next/link", () => ({ default: ({ children, href, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a> }));
vi.mock("next/image", () => ({ default: ({ fill: _fill, unoptimized: _unoptimized, ...props }: React.ComponentProps<"img"> & { fill?: boolean; unoptimized?: boolean }) => <img {...props} /> }));

const summary = (id: string, title: string, issues: string[] = []): PartnershipSummary => ({
    id, title, slug: `campaign-${id}`, brand_name: `Brand ${id}`, status: "draft",
    updated_at: "2026-11-04T10:00:00.123456+00:00", thumbnail_url: null,
    publish_issues: issues, content_valid: true,
});
const ready = summary("one", "Summer launch");
const blocked = summary("two", "Winter launch", ["Add a partner logo before publishing."]);
const payload = (pages: PartnershipSummary[], overrides: Partial<PartnershipWorkspaceResponse> = {}): PartnershipWorkspaceResponse => ({
    pages, meta: { page: 1, pageSize: 3, total: pages.length, totalPages: 1, counts: { draft: pages.length, published: 0, archived: 0 } },
    cleanup: { pending: 0, available: true }, ...overrides,
});
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });

beforeEach(() => vi.clearAllMocks());
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("partnership draft folders", () => {
    it("shows three cards and clears selection on the next bookmarked page", async () => {
        const third = summary("three", "Autumn launch");
        const fourth = summary("four", "Spring launch");
        vi.stubGlobal("fetch", vi.fn(async (url: string) => json(payload(url.endsWith("page=2") ? [fourth] : [ready, blocked, third], {
            meta: { page: url.endsWith("page=2") ? 2 : 1, pageSize: 3, total: 4, totalPages: 2, counts: { draft: 4, published: 1, archived: 0 } },
        }))));
        const { rerender } = render(<PartnershipWorkspace status="draft" />);
        await screen.findByText("Summer launch");
        expect(screen.getAllByRole("article")).toHaveLength(3);
        fireEvent.click(screen.getByLabelText("Select Summer launch"));
        expect(screen.getByRole("button", { name: "Publish selected" })).toBeEnabled();
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(navigation.push).toHaveBeenCalledWith("/admin/partnerships/drafts?page=2");
        rerender(<PartnershipWorkspace status="draft" page={2} />);
        await screen.findByText("Spring launch");
        expect(screen.getByLabelText("Select Spring launch")).not.toBeChecked();
        expect(screen.getByRole("button", { name: "Publish selected" })).toBeDisabled();
        expect(screen.getByRole("link", { name: /Published/ })).toHaveAttribute("href", "/admin/partnerships/published");
    });

    it("publishes ready selections and keeps blocked drafts with their reasons", async () => {
        let acted = false;
        const fetch = vi.fn(async (_url: string, options?: RequestInit) => {
            if (options?.method === "POST") { acted = true; return json({ results: [{ id: ready.id, status: "published" }, { id: blocked.id, status: "blocked", message: "Complete this draft first.", issues: blocked.publish_issues }] }); }
            return json(payload(acted ? [blocked] : [ready, blocked]));
        });
        vi.stubGlobal("fetch", fetch);
        render(<PartnershipWorkspace status="draft" />);
        await screen.findByText("Summer launch");
        fireEvent.click(screen.getByLabelText("Select all drafts on this page"));
        fireEvent.click(screen.getByRole("button", { name: "Publish selected" }));
        const dialog = screen.getByRole("dialog");
        expect(within(dialog).getByText("Add a partner logo before publishing.")).toBeInTheDocument();
        fireEvent.click(within(dialog).getByRole("button", { name: "Publish ready drafts" }));
        await screen.findByText("1 draft published. 1 draft needs attention below.");
        await waitFor(() => expect(screen.queryByText("Summer launch")).not.toBeInTheDocument());
        expect(screen.getByText("Complete this draft first.")).toBeInTheDocument();
        const request = fetch.mock.calls.find(([, options]) => options?.method === "POST")![1]!;
        expect(JSON.parse(request.body as string).items).toEqual([{ id: ready.id, updated_at: ready.updated_at }, { id: blocked.id, updated_at: blocked.updated_at }]);
    });

    it("requires DELETE before permanent removal and reports pending media cleanup", async () => {
        let acted = false;
        const fetch = vi.fn(async (_url: string, options?: RequestInit) => {
            if (options?.method === "POST") { acted = true; return json({ results: [{ id: ready.id, status: "cleanup_pending" }] }); }
            return json(payload(acted ? [] : [ready], { cleanup: { available: true, pending: acted ? 1 : 0 } }));
        });
        vi.stubGlobal("fetch", fetch);
        render(<PartnershipWorkspace status="draft" />);
        await screen.findByText("Summer launch");
        fireEvent.click(screen.getByRole("button", { name: "Delete" }));
        const dialog = screen.getByRole("dialog");
        expect(within(dialog).getByText("Summer launch")).toBeInTheDocument();
        expect(within(dialog).getByRole("button", { name: "Delete permanently" })).toBeDisabled();
        expect(fetch.mock.calls.filter(([, options]) => options?.method === "POST")).toHaveLength(0);
        fireEvent.change(within(dialog).getByLabelText("Type DELETE to confirm"), { target: { value: "DELETE" } });
        fireEvent.click(within(dialog).getByRole("button", { name: "Delete permanently" }));
        await screen.findByRole("button", { name: "Retry cleanup" });
        const request = fetch.mock.calls.find(([, options]) => options?.method === "POST")![1]!;
        expect(JSON.parse(request.body as string)).toMatchObject({ action: "delete_drafts", confirmation: "DELETE", items: [{ id: ready.id, updated_at: ready.updated_at }] });
        expect(screen.getByText(/files have not all been removed yet/)).toBeInTheDocument();
    });

    it("shows a load error rather than an empty folder, and supports retry", async () => {
        let failed = true;
        vi.stubGlobal("fetch", vi.fn(async () => failed ? json({ error: "Database unavailable" }, 500) : json(payload([]))));
        render(<PartnershipWorkspace status="draft" />);
        await screen.findByText("Database unavailable");
        expect(screen.queryByText("Your next partnership starts here")).not.toBeInTheDocument();
        failed = false;
        fireEvent.click(screen.getByRole("button", { name: "Retry loading" }));
        await screen.findByText("Your next partnership starts here");
    });

    it("keeps invalid drafts visible and disables deletion until its migration is available", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => json(payload([{ ...blocked, content_valid: false }], { cleanup: { pending: 0, available: false } }))));
        render(<PartnershipWorkspace status="draft" />);
        await screen.findByText("Winter launch");
        expect(screen.getByRole("button", { name: "Preview unavailable" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
        expect(screen.getByText(/draft-deletion database setup/)).toBeInTheDocument();
    });

    it("replaces a page URL when the server clamps an emptied last page", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => json(payload([ready]))));
        render(<PartnershipWorkspace status="draft" page={2} />);
        await screen.findByText("Summer launch");
        expect(navigation.replace).toHaveBeenCalledWith("/admin/partnerships/drafts?page=1");
    });

    it("drops a deletion confirmation when navigating to a different page", async () => {
        const fetch = vi.fn(async (url: string, _options?: RequestInit) => json(payload(url.endsWith("page=2") ? [blocked] : [ready], {
            meta: { page: url.endsWith("page=2") ? 2 : 1, pageSize: 3, total: 4, totalPages: 2, counts: { draft: 4, published: 0, archived: 0 } },
        })));
        vi.stubGlobal("fetch", fetch);
        const { rerender } = render(<PartnershipWorkspace status="draft" />);
        await screen.findByText("Summer launch");
        fireEvent.click(screen.getByRole("button", { name: "Delete" }));
        fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), { target: { value: "DELETE" } });
        rerender(<PartnershipWorkspace status="draft" page={2} />);
        await screen.findByText("Winter launch");
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Delete" }));
        expect(screen.getByLabelText("Type DELETE to confirm")).toHaveValue("");
        expect(screen.getByRole("button", { name: "Delete permanently" })).toBeDisabled();
        expect(fetch.mock.calls.some(([, options]) => (options as RequestInit | undefined)?.method === "POST")).toBe(false);
    });

    it("replaces a failed thumbnail with the partner initials", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => json(payload([{ ...ready, thumbnail_url: "https://example.test/not-an-image" }]))));
        const { container } = render(<PartnershipWorkspace status="draft" />);
        await screen.findByText("Summer launch");
        const image = container.querySelector("img");
        expect(image).not.toBeNull();
        fireEvent.error(image!);
        expect(container.querySelector("img")).toBeNull();
        expect(screen.getByText("BR", { exact: true })).toBeInTheDocument();
    });

    it("returns keyboard focus to the opening button when a dialog is cancelled", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => json(payload([ready]))));
        render(<PartnershipWorkspace status="draft" />);
        await screen.findByText("Summer launch");
        const opener = screen.getByRole("button", { name: "Delete" });
        opener.focus();
        fireEvent.click(opener);
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
        await waitFor(() => expect(opener).toHaveFocus());
    });
});
