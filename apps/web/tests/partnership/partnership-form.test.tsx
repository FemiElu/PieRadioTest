import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PartnershipForm } from "@/components/admin/partnership-form";
import { createDefaultPartnership } from "@/components/partnerships/default-content";
import type { PartnershipPage } from "@/lib/partnerships/queries";

const navigation = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
const notifications = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("sonner", () => ({ toast: notifications }));
vi.mock("next/link", () => ({ default: ({ children, href, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/components/partnerships/image-field", () => ({ ImageField: () => null }));
vi.mock("@/context/audio-context", () => ({ useAudio: () => ({ playClip: vi.fn() }) }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ storage: { from: vi.fn() } }) }));
vi.mock("@/components/partnerships/markdown-editor", () => ({ MarkdownEditor: () => null }));

beforeEach(() => vi.clearAllMocks());
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("saving a partnership page", () => {
    it("requires a campaign URL instead of silently reusing a shared default", async () => {
        const fetch = vi.fn();
        vi.stubGlobal("fetch", fetch);
        render(<PartnershipForm />);
        expect(screen.getByLabelText("Page URL")).toHaveValue("");
        fireEvent.click(screen.getByRole("button", { name: /save draft/i }));
        await waitFor(() => expect(screen.getByLabelText("Page URL")).toHaveAttribute("aria-invalid", "true"));
        expect(fetch).not.toHaveBeenCalled();
    });

    it("prevents repeated creates while the request and subsequent navigation are pending", async () => {
        let finishSave!: (response: Response) => void;
        const fetch = vi.fn(() => new Promise<Response>(resolve => { finishSave = resolve; }));
        vi.stubGlobal("fetch", fetch);
        render(<PartnershipForm />);
        fireEvent.change(screen.getByLabelText("Page URL"), { target: { value: "summer-campaign" } });
        const form = screen.getByRole("form", { name: "Partnership page content" });
        fireEvent.submit(form);
        fireEvent.submit(form);
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();

        finishSave(new Response(JSON.stringify({ id: "saved-page", slug: "summer-campaign" }), { status: 201 }));
        await screen.findByRole("heading", { name: "Draft saved" });
        expect(screen.queryByRole("button", { name: /save draft/i })).not.toBeInTheDocument();
        expect(screen.getByRole("link", { name: /continue editing/i })).toHaveAttribute("href", "/admin/partnerships/saved-page/edit");
        expect(navigation.replace).toHaveBeenCalledWith("/admin/partnerships/saved-page/edit");
        expect(navigation.refresh).not.toHaveBeenCalled();
        expect(notifications.success).toHaveBeenCalledWith("Draft saved", expect.any(Object));
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("preserves the form and links to the existing page when a URL is taken", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
            error: "That page URL is already in use.", code: "SLUG_IN_USE", existingPage: { id: "existing-page" },
        }), { status: 409 })));
        render(<PartnershipForm />);
        fireEvent.change(screen.getByLabelText("Page URL"), { target: { value: "popeyesuk" } });
        fireEvent.click(screen.getByRole("button", { name: /save draft/i }));
        expect(await screen.findByRole("link", { name: /edit the existing partnership page/i })).toHaveAttribute("href", "/admin/partnerships/existing-page/edit");
        expect(screen.getByLabelText("Page URL")).toHaveValue("popeyesuk");
        expect(screen.getByLabelText("Page URL")).toHaveAttribute("aria-invalid", "true");
        expect(screen.getByRole("button", { name: /save draft/i })).toBeEnabled();
    });

    it("keeps the actual audio form separate and saves page content with empty audio fields", async () => {
        const initialData: PartnershipPage = {
            ...createDefaultPartnership(), id: "saved-page", created_by: "admin-id",
            created_at: "2026-11-04T10:00:00.000Z", updated_at: "2026-11-04T10:00:00.000Z", published_at: null,
        };
        const fetch = vi.fn(async (_url: string, options?: RequestInit) => new Response(JSON.stringify(
            options?.method === "PATCH"
                ? { id: initialData.id, slug: initialData.slug, updated_at: "2026-11-04T11:00:00.000Z" }
                : { episodes: [] },
        )));
        vi.stubGlobal("fetch", fetch);
        const { container } = render(<PartnershipForm initialData={initialData} />);
        await screen.findByText("No mixes uploaded yet.");

        const pageForm = screen.getByRole("form", { name: "Partnership page content" });
        const audioForm = screen.getByRole("form", { name: "Upload partnership audio" });
        expect(container.querySelector("form form")).toBeNull();
        expect(pageForm).not.toContainElement(audioForm);
        expect((screen.getByRole("button", { name: /save draft/i }) as HTMLButtonElement).form).toBe(pageForm);
        expect((screen.getByLabelText("Audio title") as HTMLInputElement).form).toBe(audioForm);
        expect((screen.getByLabelText("MP3 audio file") as HTMLInputElement).form).toBe(audioForm);

        fireEvent.click(screen.getByRole("button", { name: /save draft/i }));
        await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/admin/partnerships/saved-page", expect.objectContaining({ method: "PATCH" })));
        expect(fetch.mock.calls.filter(([, options]) => options?.method === "PATCH")).toHaveLength(1);

        fetch.mockClear();
        fireEvent.submit(audioForm);
        await screen.findByText("Choose an MP3 to upload.");
        expect(fetch).not.toHaveBeenCalled();
    });

    it("uses the exact returned database timestamp for the next draft save", async () => {
        const versions = ["2026-11-04T10:00:00.123456+00:00", "2026-11-04T10:30:00.654321+00:00", "2026-11-04T11:00:00.987654+00:00"];
        const initialData: PartnershipPage = {
            ...createDefaultPartnership(), id: "saved-page", created_by: "admin-id",
            created_at: versions[0], updated_at: versions[0], published_at: null,
        };
        let saveCount = 0;
        const fetch = vi.fn(async (_url: string, options?: RequestInit) => new Response(JSON.stringify(
            options?.method === "PATCH"
                ? { id: initialData.id, slug: initialData.slug, updated_at: versions[++saveCount] }
                : { episodes: [] },
        )));
        vi.stubGlobal("fetch", fetch);
        render(<PartnershipForm initialData={initialData} />);
        await screen.findByText("No mixes uploaded yet.");

        fireEvent.click(screen.getByRole("button", { name: /save draft/i }));
        await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Saved at"));
        expect(screen.getByRole("button", { name: /save draft/i })).toBeEnabled();
        fireEvent.click(screen.getByRole("button", { name: /save draft/i }));
        await waitFor(() => expect(notifications.success).toHaveBeenCalledTimes(2));
        expect(navigation.refresh).not.toHaveBeenCalled();

        const saves = fetch.mock.calls.filter(([, options]) => options?.method === "PATCH");
        expect(saves.map(([, options]) => JSON.parse(options!.body as string).updated_at)).toEqual(versions.slice(0, 2));
    });

    it("retains entered content and the previous saved time after a failed save", async () => {
        const initialData: PartnershipPage = {
            ...createDefaultPartnership(), id: "saved-page", created_by: "admin-id",
            created_at: "2026-11-04T10:00:00.000Z", updated_at: "2026-11-04T10:00:00.123456+00:00", published_at: null,
        };
        vi.stubGlobal("fetch", vi.fn(async (_url: string, options?: RequestInit) => new Response(JSON.stringify(
            options?.method === "PATCH" ? { error: "Saving is temporarily unavailable" } : { episodes: [] },
        ), { status: options?.method === "PATCH" ? 500 : 200 })));
        render(<PartnershipForm initialData={initialData} />);
        await screen.findByText("No mixes uploaded yet.");
        const savedText = screen.getByRole("status").textContent;
        fireEvent.change(screen.getByLabelText("Admin page title"), { target: { value: "My unsaved changes" } });
        expect(screen.getByRole("status")).toHaveTextContent("Unsaved changes");
        fireEvent.click(screen.getByRole("button", { name: /save draft/i }));
        await screen.findByText("Saving is temporarily unavailable");
        expect(screen.getByLabelText("Admin page title")).toHaveValue("My unsaved changes");
        expect(notifications.success).not.toHaveBeenCalled();
        expect(notifications.error).toHaveBeenCalledWith("Saving is temporarily unavailable");
        fireEvent.change(screen.getByLabelText("Admin page title"), { target: { value: initialData.title } });
        expect(screen.getByRole("status").textContent).toBe(savedText);
    });

    it("labels a pending publication without claiming the draft is already live", () => {
        render(<PartnershipForm />);
        fireEvent.change(screen.getByLabelText("Publishing status"), { target: { value: "published" } });
        expect(screen.getByRole("button", { name: "Publish page" })).toBeInTheDocument();
        expect(screen.getByText(/Saving will publish this page on the public website/)).toBeInTheDocument();
        expect(screen.queryByText(/This page is live/)).not.toBeInTheDocument();
        expect(screen.getByText("Draft", { exact: true, selector: "span" })).toBeInTheDocument();
    });
});
