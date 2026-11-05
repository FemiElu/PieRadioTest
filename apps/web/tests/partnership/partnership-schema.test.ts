import { describe, expect, it } from "vitest";
import { CreatePartnershipSchema, UpdatePartnershipSchema } from "@/lib/partnerships/schema";
import { createDefaultPartnership, isPartnershipReadyToPublish } from "@/components/partnerships/default-content";

describe("partnership page content", () => {
    it("accepts a complete draft and allows empty draft assets and social links", () => {
        expect(CreatePartnershipSchema.safeParse(createDefaultPartnership()).success).toBe(true);
    });

    it.each([
        "2026-11-04T10:00:00.123456+00:00",
        "2026-11-04T10:00:00.123456Z",
        "2026-11-04T11:00:00.123456+01:00",
    ])("accepts the version timestamp %s without changing its precision", (updated_at) => {
        const parsed = UpdatePartnershipSchema.parse({ ...createDefaultPartnership(), updated_at });
        expect(parsed.updated_at).toBe(updated_at);
    });

    it.each([
        "not-a-date",
        "2026-11-04",
        "2026-11-04T10:00:00",
        "2026-11-35T10:00:00+00:00",
    ])("rejects an invalid version timestamp: %s", (updated_at) => {
        expect(UpdatePartnershipSchema.safeParse({ ...createDefaultPartnership(), updated_at }).success).toBe(false);
    });

    it("rejects unsafe press URLs", () => {
        const draft = createDefaultPartnership();
        draft.content.hero.pressHref = "javascript:alert(1)";
        expect(CreatePartnershipSchema.safeParse(draft).success).toBe(false);
    });

    it("rejects unsafe asset URLs", () => {
        const draft = createDefaultPartnership();
        draft.content.hero.partnerLogo = { src: "javascript:alert(1)", alt: "Partner" };
        expect(CreatePartnershipSchema.safeParse(draft).success).toBe(false);
    });

    it("requires the mapped assets, gallery, event facts, copy and social links to publish", () => {
        const draft = createDefaultPartnership();
        expect(isPartnershipReadyToPublish(draft)).toMatch(/image/);
        draft.content.hero.background = { src: "/hero.webp", alt: "A hero" };
        draft.content.hero.stationLogo = { src: "/logo.png", alt: "Pie Radio" };
        draft.content.hero.partnerLogo = { src: "/partner.png", alt: "Partner" };
        draft.content.event.flyer = { src: "/flyer.webp", alt: "Event flyer" };
        draft.content.gallery.images = [{ src: "/gallery.webp", alt: "Event" }];
        draft.content.socials.links.forEach((link) => { link.href = "https://example.com"; });
        expect(isPartnershipReadyToPublish(draft)).toBeNull();
    });
});
