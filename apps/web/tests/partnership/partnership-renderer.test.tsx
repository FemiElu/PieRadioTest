import { render, screen } from "@testing-library/react";
import React from "react";
import { PartnershipPageView } from "@/components/partnerships/partnership-page";
import { createDefaultPartnership } from "@/components/partnerships/default-content";
import type { PartnershipPage } from "@/lib/partnerships/queries";

vi.mock("@/components/shared/show-preview-dialog", () => ({ ShowPreviewDialog: () => null }));

const page = {
    id: "b14a02ac-8727-4a8e-9ed1-29fd2571e329",
    slug: "sample-partner",
    title: "Pie Radio × Sample",
    brand_name: "Sample",
    description: "A sample partnership page",
    social_image_url: "",
    content: createDefaultPartnership().content,
    status: "draft" as const,
    created_by: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    published_at: null,
} satisfies PartnershipPage;

describe("PartnershipPageView", () => {
    it("renders the fixed section order and partner supplied content", () => {
        render(React.createElement(PartnershipPageView, { page, preview: true }));
        expect(screen.getByText("A Pie Radio partnership")).toBeInTheDocument();
        expect(screen.getByText("Sneak Peek")).toBeInTheDocument();
        expect(screen.getByText("Exclusive Event")).toBeInTheDocument();
        expect(screen.getByText("Stay Connected")).toBeInTheDocument();
        expect(screen.getByText("Something is on the way")).toBeInTheDocument();
        expect(screen.getByText("Waitlist form is disabled in preview.")).toBeInTheDocument();
    });
});
