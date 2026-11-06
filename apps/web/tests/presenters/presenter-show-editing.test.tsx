import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PresenterFormModal, type PresenterFormData } from "@/components/admin/presenter-form-modal";

type Row = { id: string; presenter_id: string; title: string; description: string | null; schedule: string | null; cover_image_url: string | null; display_order: number };
type Result = { data?: any; error: any };
const db = vi.hoisted(() => ({
    rows: [] as Row[], calls: [] as { kind: string; payload: any; filters: Record<string, string> }[],
    updateResult: null as null | ((payload: any, filters: Record<string, string>) => Promise<Result>),
    fetchResult: null as null | ((filters: Record<string, string>) => Promise<Result>),
    upload: vi.fn(), toast: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: db.toast } }));
vi.mock("next/image", () => ({ default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({
    from: () => {
        let kind = "select", payload: any = null, single = false;
        const filters: Record<string, string> = {};
        let promise: Promise<Result> | null = null;
        const execute = () => promise ??= (async () => {
            if (kind === "select") return db.fetchResult ? db.fetchResult(filters) : { data: db.rows.filter(row => Object.entries(filters).every(([key, value]) => (row as any)[key] === value)).sort((a, b) => a.display_order - b.display_order), error: null };
            db.calls.push({ kind, payload, filters: { ...filters } });
            if (kind === "update" && db.updateResult) return db.updateResult(payload, filters);
            if (kind === "insert") { db.rows.push({ ...payload, id: "created-show" }); return { data: null, error: null }; }
            const matching = db.rows.filter(row => Object.entries(filters).every(([key, value]) => (row as any)[key] === value));
            if (kind === "delete") db.rows = db.rows.filter(row => !matching.includes(row));
            if (kind === "update") matching.forEach(row => Object.assign(row, payload));
            return { data: single ? matching[0] ? { ...matching[0] } : null : null, error: single && !matching[0] ? { code: "PGRST116", message: "No row returned" } : null };
        })();
        const query: any = {
            select: () => query, eq: (key: string, value: string) => { filters[key] = value; return query; }, order: () => query,
            update: (value: any) => { kind = "update"; payload = value; return query; },
            insert: (value: any) => { kind = "insert"; payload = value; return query; }, delete: () => { kind = "delete"; return query; },
            single: () => { single = true; return execute(); }, then: (resolve: any, reject: any) => execute().then(resolve, reject),
        };
        return query;
    },
    storage: { from: (bucket: string) => ({ upload: (path: string, file: File, options: unknown) => db.upload(bucket, path, file, options), getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.example.test/avatars/${path}` } }) }) },
}) }));
const presenter: PresenterFormData = { id: "presenter-one", full_name: "Sarah Wilson", username: "sarah", email: "sarah@example.test", bio: "", avatar_url: "", category: "", instagram_handle: "", twitter_handle: "", website_url: "" };
const secondPresenter = { ...presenter, id: "presenter-two", full_name: "Jordan Reid", username: "jordan" };
const first = (): Row => ({ id: "show-one", presenter_id: "presenter-one", title: "The Morning Vibe", description: "Music and conversation", schedule: "Mondays · 8AM", cover_image_url: "/assets/original.webp", display_order: 4 });
const second = (): Row => ({ ...first(), id: "show-two", title: "After Hours", display_order: 8 });
const other = (): Row => ({ ...first(), id: "show-other", presenter_id: "presenter-two", title: "The Weekend Mix", display_order: 0 });
function Harness({ value = presenter }: { value?: PresenterFormData }) { const [open, setOpen] = useState(true); return <><button onClick={() => setOpen(true)}>Open presenter</button><PresenterFormModal open={open} onOpenChange={setOpen} presenter={value} /></>; }
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
async function openShows() { await userEvent.click(screen.getByRole("button", { name: /^Shows/ })); }
async function edit(title = "The Morning Vibe") { await userEvent.click(await screen.findByRole("button", { name: `Edit ${title}` })); return screen.getByRole("group", { name: `Edit ${title}` }); }
function titleInput() { return screen.getByRole("textbox", { name: /Show title/ }); }
function uploadInput() { return screen.getByLabelText("Choose show artwork"); }
beforeEach(() => { db.rows = [first(), second(), other()]; db.calls = []; db.updateResult = null; db.fetchResult = null; db.upload.mockReset().mockResolvedValue({ data: {}, error: null }); db.toast.mockReset(); });
afterEach(cleanup);

describe("presenter show editing", () => {
    it("prefills all show fields and focuses the title without changing stored content", async () => {
        render(<Harness />); await openShows(); await edit();
        expect(titleInput()).toHaveValue("The Morning Vibe"); expect(titleInput()).toHaveFocus();
        expect(screen.getByLabelText("Schedule")).toHaveValue("Mondays · 8AM");
        expect(screen.getByLabelText("Description")).toHaveValue("Music and conversation");
        expect(screen.getByLabelText("Artwork image URL")).toHaveValue("/assets/original.webp");
        expect(db.calls).toHaveLength(0);
    });
    it("updates exactly four columns scoped to the show and presenter, preserves identity/order, then reopens saved values", async () => {
        render(<Harness />); await openShows(); await edit();
        fireEvent.change(titleInput(), { target: { value: "  New Morning Show  " } });
        fireEvent.change(screen.getByLabelText("Schedule"), { target: { value: "  Tuesdays · 9AM  " } });
        fireEvent.change(screen.getByLabelText("Description"), { target: { value: "  New description  " } });
        fireEvent.change(screen.getByLabelText("Artwork image URL"), { target: { value: " https://cdn.example.test/show.png " } });
        await userEvent.click(screen.getByRole("button", { name: "Save" }));
        await waitFor(() => expect(db.toast).toHaveBeenCalledWith("Show updated successfully."));
        expect(db.calls).toEqual([{ kind: "update", filters: { id: "show-one", presenter_id: "presenter-one" }, payload: { title: "New Morning Show", description: "New description", schedule: "Tuesdays · 9AM", cover_image_url: "https://cdn.example.test/show.png" } }]);
        expect(db.rows[0]).toMatchObject({ id: "show-one", presenter_id: "presenter-one", display_order: 4 }); expect(db.rows).toHaveLength(3);
        await waitFor(() => expect(screen.getByRole("button", { name: "Edit New Morning Show" })).toHaveFocus());
        await edit("New Morning Show"); expect(titleInput()).toHaveValue("New Morning Show");
    });
    it("normalizes cleared optional fields to null", async () => {
        render(<Harness />); await openShows(); await edit();
        for (const label of ["Schedule", "Description", "Artwork image URL"]) fireEvent.change(screen.getByLabelText(label), { target: { value: " " } });
        await userEvent.click(screen.getByRole("button", { name: "Save" }));
        await waitFor(() => expect(db.toast).toHaveBeenCalled());
        expect(db.calls[0].payload).toEqual({ title: "The Morning Vibe", description: null, schedule: null, cover_image_url: null });
    });
    it("cancels without writing and restores original values on reopening", async () => {
        render(<Harness />); await openShows(); await edit(); fireEvent.change(titleInput(), { target: { value: "Discard me" } });
        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(db.calls).toHaveLength(0); expect(db.toast).not.toHaveBeenCalled();
        await waitFor(() => expect(screen.getByRole("button", { name: "Edit The Morning Vibe" })).toHaveFocus());
        await edit(); expect(titleInput()).toHaveValue("The Morning Vibe");
    });
    it("rejects whitespace titles without making a request", async () => {
        render(<Harness />); await openShows(); await edit(); fireEvent.change(titleInput(), { target: { value: "   " } });
        await userEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.getByRole("alert")).toHaveTextContent("Show title is required"); expect(db.calls).toHaveLength(0); expect(titleInput()).toHaveFocus();
    });
    it.each(["javascript:alert(1)", "data:image/png;base64,abc", "blob:https://example.test/id", "//example.test/a.png", "https://", "https://site.test/a image.png"])("rejects unsafe or malformed artwork URL %s", async value => {
        render(<Harness />); await openShows(); await edit(); fireEvent.change(screen.getByLabelText("Artwork image URL"), { target: { value } });
        await userEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.getByRole("alert")).toHaveTextContent("HTTP(S)"); expect(db.calls).toHaveLength(0);
    });
    it("uploads artwork under a unique presenter path, updates only the draft and saves its URL", async () => {
        render(<Harness />); await openShows(); await edit(); const file = new File(["image"], "cover.png", { type: "image/png" });
        fireEvent.change(uploadInput(), { target: { files: [file] } });
        await waitFor(() => expect((screen.getByLabelText("Artwork image URL") as HTMLInputElement).value).toContain("https://storage.example.test/avatars/show-covers/presenter-one/"));
        expect(db.upload).toHaveBeenCalledWith("avatars", expect.stringMatching(/^show-covers\/presenter-one\/[\da-f-]+\.png$/), file, { upsert: false });
        expect(db.calls).toHaveLength(0); expect(db.rows[0].cover_image_url).toBe("/assets/original.webp");
        await userEvent.click(screen.getByRole("button", { name: "Save" })); await waitFor(() => expect(db.toast).toHaveBeenCalled());
        expect(db.calls[0].payload.cover_image_url).toContain("show-covers/presenter-one/");
    });
    it("rejects non-images and oversized files without uploading", async () => {
        render(<Harness />); await openShows(); await edit();
        fireEvent.change(uploadInput(), { target: { files: [new File(["doc"], "file.txt", { type: "text/plain" })] } });
        expect(screen.getByRole("alert")).toHaveTextContent("image file");
        const huge = new File(["image"], "big.png", { type: "image/png" }); Object.defineProperty(huge, "size", { value: 5 * 1024 * 1024 + 1 });
        fireEvent.change(uploadInput(), { target: { files: [huge] } }); expect(screen.getByRole("alert")).toHaveTextContent("5 MB"); expect(db.upload).not.toHaveBeenCalled();
    });
    it("retains existing artwork after upload failure and allows retrying the same file", async () => {
        db.upload.mockResolvedValueOnce({ error: { message: "Upload unavailable" } }); render(<Harness />); await openShows(); await edit();
        const file = new File(["image"], "retry.webp", { type: "image/webp" }); const input = uploadInput();
        fireEvent.change(input, { target: { files: [file] } }); await screen.findByText("Upload unavailable");
        expect(screen.getByLabelText("Artwork image URL")).toHaveValue("/assets/original.webp");
        fireEvent.change(input, { target: { files: [file] } }); await waitFor(() => expect(db.upload).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(screen.queryByText("Upload unavailable")).not.toBeInTheDocument());
    });
    it.each([{ message: "Permission denied" }, { code: "PGRST116", message: "No row returned" }])("retains input and never signals success for denied or missing updates %o", async error => {
        db.updateResult = async () => ({ data: null, error }); render(<Harness />); await openShows(); await edit(); fireEvent.change(titleInput(), { target: { value: "Keep this draft" } });
        await userEvent.click(screen.getByRole("button", { name: "Save" })); await screen.findByRole("alert");
        expect(titleInput()).toHaveValue("Keep this draft"); expect(screen.getByRole("button", { name: "Save" })).toBeEnabled(); expect(db.toast).not.toHaveBeenCalled();
    });
    it("requires an actual returned row even when the server does not return an error", async () => {
        db.updateResult = async () => ({ data: null, error: null }); render(<Harness />); await openShows(); await edit();
        await userEvent.click(screen.getByRole("button", { name: "Save" })); await screen.findByRole("alert"); expect(db.toast).not.toHaveBeenCalled(); expect(titleInput()).toBeInTheDocument();
    });
    it("blocks repeated saves and conflicting controls while a save is pending", async () => {
        const result = deferred<Result>(); db.updateResult = () => result.promise; render(<Harness />); await openShows(); await edit();
        const save = screen.getByRole("button", { name: "Save" }); act(() => { fireEvent.click(save); fireEvent.click(save); });
        await waitFor(() => expect(db.calls).toHaveLength(1));
        expect(titleInput()).toBeDisabled(); expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled(); expect(screen.getByRole("button", { name: /^profile$/i })).toBeDisabled(); expect(screen.getByRole("button", { name: "Edit After Hours" })).toBeDisabled(); expect(screen.getByRole("button", { name: "Add Show" })).toBeDisabled();
        await act(async () => { result.resolve({ data: first(), error: null }); }); await waitFor(() => expect(db.toast).toHaveBeenCalledTimes(1));
    });
    it("asks before dirty close or tab navigation and preserves changes when keeping editing", async () => {
        render(<Harness />); await openShows(); await edit(); fireEvent.change(titleInput(), { target: { value: "Unsaved title" } });
        await userEvent.click(screen.getByRole("button", { name: "Close" }));
        const confirm = screen.getByRole("dialog", { name: "Discard show changes?" }); await userEvent.click(within(confirm).getByRole("button", { name: "Keep editing" }));
        expect(titleInput()).toHaveValue("Unsaved title"); await userEvent.click(screen.getByRole("button", { name: /^profile$/i }));
        await userEvent.click(within(screen.getByRole("dialog", { name: "Discard show changes?" })).getByRole("button", { name: "Discard changes" }));
        expect(screen.getByRole("textbox", { name: /Full Name/ })).toBeInTheDocument(); expect(db.calls).toHaveLength(0);
    });
    it("ignores an old save result after changing presenters", async () => {
        const result = deferred<Result>(); db.updateResult = () => result.promise; const view = render(<Harness />); await openShows(); await edit(); await userEvent.click(screen.getByRole("button", { name: "Save" }));
        view.rerender(<Harness value={secondPresenter} />); await openShows(); await edit("The Weekend Mix"); fireEvent.change(titleInput(), { target: { value: "Jordan's draft" } });
        await act(async () => { result.resolve({ data: { ...first(), title: "Late old result" }, error: null }); });
        expect(titleInput()).toHaveValue("Jordan's draft"); expect(screen.queryByText("Late old result")).not.toBeInTheDocument(); expect(db.toast).not.toHaveBeenCalled();
    });
    it("ignores an old artwork result after changing presenters", async () => {
        const result = deferred<Result>(); db.upload.mockReturnValueOnce(result.promise); const view = render(<Harness />); await openShows(); await edit(); fireEvent.change(uploadInput(), { target: { files: [new File(["x"], "a.png", { type: "image/png" })] } });
        view.rerender(<Harness value={secondPresenter} />); await openShows(); await edit("The Weekend Mix");
        await act(async () => { result.resolve({ data: {}, error: null }); }); expect(screen.getByLabelText("Artwork image URL")).toHaveValue("/assets/original.webp"); expect(titleInput()).toBeEnabled();
    });
    it("ignores an old fetch when the presenter changes", async () => {
        const result = deferred<Result>(); db.fetchResult = filters => filters.presenter_id === "presenter-one" ? result.promise : Promise.resolve({ data: [other()], error: null });
        const view = render(<Harness />); await openShows(); view.rerender(<Harness value={secondPresenter} />); await openShows(); await screen.findByRole("button", { name: "Edit The Weekend Mix" });
        await act(async () => { result.resolve({ data: [first()], error: null }); }); expect(screen.getByRole("button", { name: "Edit The Weekend Mix" })).toBeInTheDocument(); expect(screen.queryByRole("button", { name: "Edit The Morning Vibe" })).not.toBeInTheDocument();
    });
    it("preserves create, reorder and delete workflows", async () => {
        render(<Harness />); await openShows(); await screen.findByRole("button", { name: "Edit The Morning Vibe" });
        await userEvent.click(screen.getByRole("button", { name: "Move The Morning Vibe down" })); await waitFor(() => expect(db.calls).toHaveLength(2));
        await userEvent.click(screen.getByRole("button", { name: "Delete After Hours" })); await waitFor(() => expect(screen.queryByRole("button", { name: "Edit After Hours" })).not.toBeInTheDocument());
        await userEvent.click(screen.getByRole("button", { name: "Add Show" })); fireEvent.change(screen.getByLabelText("Show Title *"), { target: { value: "New show" } }); await userEvent.click(screen.getByRole("button", { name: "Save Show" })); await screen.findByRole("button", { name: "Edit New show" });
        const inserted = db.calls.find(call => call.kind === "insert"); expect(inserted?.payload).toMatchObject({ presenter_id: "presenter-one", title: "New show" });
    });
});
