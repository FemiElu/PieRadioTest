import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Footer } from "@/components/layout/footer";
import { getPublishedPartnershipLinks, notifyPartnershipsUpdated } from "@/lib/partnerships/navigation";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));
vi.mock("@/lib/partnerships/navigation", async (importOriginal) => ({
    ...await importOriginal<typeof import("@/lib/partnerships/navigation")>(),
    getPublishedPartnershipLinks: vi.fn(),
}));

const load = vi.mocked(getPublishedPartnershipLinks);
const popeyes = { id: "one", title: "Pie Radio × Popeyes UK", slug: "popeyesuk" };
const newPartner = { id: "two", title: "Summer Sessions", slug: "summer-sessions" };
const section = () => screen.getByRole("navigation", { name: "Partnership" });

beforeEach(() => {
    route.pathname = "/";
    load.mockReset().mockResolvedValue([popeyes]);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
});
afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe("partnership footer", () => {
    it("keeps existing footer sections and labels campaign links by title", async () => {
        load.mockResolvedValue([popeyes, newPartner]);
        render(<Footer />);
        expect(await within(section()).findByRole("link", { name: popeyes.title })).toHaveAttribute("href", "/partnerships/popeyesuk");
        expect(within(section()).getByRole("link", { name: newPartner.title })).toHaveAttribute("href", "/partnerships/summer-sessions");
        for (const name of ["Explore", "Legal", "Connect"]) expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    });

    it("adds published pages, updates titles, and removes unpublished pages after confirmed saves", async () => {
        render(<Footer />);
        await within(section()).findByRole("link", { name: popeyes.title });
        load.mockResolvedValue([{ ...newPartner, title: "New campaign title" }]);
        act(() => notifyPartnershipsUpdated());
        expect(await within(section()).findByRole("link", { name: "New campaign title" })).toHaveAttribute("href", "/partnerships/summer-sessions");
        expect(within(section()).queryByRole("link", { name: popeyes.title })).not.toBeInTheDocument();
    });

    it("refreshes on navigation and on returning to the tab", async () => {
        const view = render(<Footer />);
        await within(section()).findByRole("link", { name: popeyes.title });
        load.mockResolvedValue([newPartner]);
        route.pathname = "/news";
        view.rerender(<Footer />);
        await within(section()).findByRole("link", { name: newPartner.title });
        load.mockResolvedValue([]);
        act(() => window.dispatchEvent(new Event("focus")));
        await waitFor(() => expect(within(section()).queryByRole("link")).not.toBeInTheDocument());
        expect(within(section()).getByText("No current partnerships.")).toBeInTheDocument();
    });

    it("reports errors while retaining the last successful links", async () => {
        render(<Footer />);
        await within(section()).findByRole("link", { name: popeyes.title });
        load.mockRejectedValue(new Error("Offline"));
        act(() => notifyPartnershipsUpdated());
        expect(await within(section()).findByRole("status")).toHaveTextContent("could not be refreshed");
        expect(within(section()).getByRole("link", { name: popeyes.title })).toBeInTheDocument();
    });

    it("does not present a failed initial request as an empty partnership list", async () => {
        load.mockRejectedValue(new Error("Offline"));
        render(<Footer />);
        await waitFor(() => expect(within(section()).getByRole("status")).toHaveTextContent("temporarily unavailable"));
        expect(within(section()).queryByText("No current partnerships.")).not.toBeInTheDocument();
    });

    it("ignores stale requests and aborts work when unmounted", async () => {
        let resolveFirst!: (value: typeof popeyes[]) => void;
        load.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }));
        const view = render(<Footer />);
        const firstSignal = load.mock.calls[0][1];
        load.mockResolvedValue([newPartner]);
        act(() => notifyPartnershipsUpdated());
        await within(section()).findByRole("link", { name: newPartner.title });
        await act(async () => resolveFirst([popeyes]));
        expect(firstSignal.aborted).toBe(true);
        expect(within(section()).queryByRole("link", { name: popeyes.title })).not.toBeInTheDocument();
        const latestSignal = load.mock.calls.at(-1)![1];
        view.unmount();
        expect(latestSignal.aborted).toBe(true);
    });

    it("polls while visible and stops polling when hidden or unmounted", async () => {
        vi.useFakeTimers();
        const view = render(<Footer />);
        await act(async () => {});
        expect(load).toHaveBeenCalledTimes(1);
        await act(async () => { vi.advanceTimersByTime(60_000); });
        expect(load).toHaveBeenCalledTimes(2);
        vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
        await act(async () => { vi.advanceTimersByTime(60_000); });
        expect(load).toHaveBeenCalledTimes(2);
        view.unmount();
        await act(async () => { vi.advanceTimersByTime(60_000); });
        expect(load).toHaveBeenCalledTimes(2);
    });
});
