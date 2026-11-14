import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PopeyesUkPage, { generateMetadata } from "@/app/popeyesuk/page";
import { createDefaultPartnership } from "@/components/partnerships/default-content";
import type { PartnershipPage } from "@/lib/partnerships/queries";

const lookup = vi.hoisted(() => ({ client: {}, getPage: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => lookup.client }));
vi.mock("@/lib/partnerships/queries", () => ({ getPartnershipBySlug: lookup.getPage }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_NOT_FOUND"); } }));
vi.mock("@/components/shared/show-preview-dialog", () => ({ ShowPreviewDialog: () => null }));

function publishedPage(): PartnershipPage {
  const draft = createDefaultPartnership();
  return {
    ...draft, id: "b14a02ac-8727-4a8e-9ed1-29fd2571e329", slug: "popeyesuk",
    title: "Pie Radio × Popeyes UK", description: "A published partnership",
    status: "published", created_by: null, created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z", published_at: "2026-01-01T00:00:00Z",
    content: { ...draft.content, hero: { ...draft.content.hero, title: "Turning Up the Flavor.", accentTitle: "Turning Up the Volume." } },
  };
}

beforeEach(() => lookup.getPage.mockReset().mockResolvedValue(publishedPage()));

describe("PopeyesUkPage", () => {
  it("renders the published saved page at the existing Popeyes URL", async () => {
    render(await PopeyesUkPage());
    expect(lookup.getPage).toHaveBeenCalledWith(lookup.client, "popeyesuk");
    expect(screen.getByRole("heading", { name: /turning up the flavor\. turning up the volume\./i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Join the Waitlist" })).toBeInTheDocument();
    expect(screen.queryByText(/Draft preview/)).not.toBeInTheDocument();
  });

  it("does not fall back to hard-coded content when no published record exists", async () => {
    lookup.getPage.mockResolvedValue(null);
    await expect(PopeyesUkPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("uses the saved page metadata", async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toBe("Pie Radio × Popeyes UK");
    expect(metadata.description).toBe("A published partnership");
  });
});
