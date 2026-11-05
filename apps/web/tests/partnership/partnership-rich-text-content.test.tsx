import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PartnershipRichText } from "@/components/partnerships/rich-text-content";
import { isSafeRichTextImage, isSafeRichTextLink, normalizeRichTextLink } from "@/lib/partnerships/rich-text-url";

afterEach(cleanup);

describe("published partnership rich text", () => {
    it("renders saved emphasis, headings, lists, quotes and strike as semantic content", () => {
        const { container } = render(<PartnershipRichText value={[
            "## Event details", "", "A **bold welcome** and *warm words*, with ~~old information~~.", "",
            "- Music", "- Community", "", "1. Register", "2. Attend", "", "> Bring a friend",
        ].join("\n")} />);
        expect(screen.getByRole("heading", { name: "Event details", level: 2 })).toBeInTheDocument();
        expect(screen.getByText("bold welcome").tagName).toBe("STRONG");
        expect(screen.getByText("warm words").tagName).toBe("EM");
        expect(screen.getByText("old information").tagName).toBe("DEL");
        expect(Array.from(container.querySelectorAll("ul > li")).map(item => item.textContent)).toEqual(["Music", "Community"]);
        expect(Array.from(container.querySelectorAll("ol > li")).map(item => item.textContent)).toEqual(["Register", "Attend"]);
        expect(container.querySelector("blockquote")).toHaveTextContent("Bring a friend");
        expect(container.textContent).not.toContain("*");
        expect(container.textContent).not.toContain("~~");
    });

    it("keeps site links local and opens website links without opener access", () => {
        render(<PartnershipRichText value="[Press](/press) and [Partner](https://example.com) and [Email](mailto:hello@example.com)" />);
        expect(screen.getByRole("link", { name: "Press" })).toHaveAttribute("href", "/press");
        expect(screen.getByRole("link", { name: "Press" })).not.toHaveAttribute("target");
        expect(screen.getByRole("link", { name: "Partner" })).toHaveAttribute("target", "_blank");
        expect(screen.getByRole("link", { name: "Partner" })).toHaveAttribute("rel", "noopener noreferrer");
        expect(screen.getByRole("link", { name: "Email" })).toHaveAttribute("href", "mailto:hello@example.com");
    });

    it("does not render raw HTML or executable links from saved copy", () => {
        const { container } = render(<PartnershipRichText value={'[Unsafe](javascript:alert%281%29)\n\n<script>alert("bad")</script>\n\n<img src="x" onerror="alert(1)">'} />);
        expect(screen.getByText("Unsafe").closest("a")).toBeNull();
        expect(container.querySelector("script")).toBeNull();
        expect(container.querySelector("img")).toBeNull();
    });

    it("preserves safe embedded Markdown images and drops invalid image sources", () => {
        const { container } = render(<PartnershipRichText value="![Poster](https://example.com/poster.webp)\n\n![Unavailable](data:image/svg+xml;base64,PHN2Zz4=)" />);
        expect(screen.getByRole("img", { name: "Poster" })).toHaveAttribute("src", "https://example.com/poster.webp");
        expect(container.querySelectorAll("img")).toHaveLength(1);
        expect(screen.getByText("Unavailable")).toBeInTheDocument();
    });

    it("leaves deliberately literal asterisks unchanged", () => {
        render(<PartnershipRichText value={"Use \\* to mark a note."} />);
        expect(screen.getByText("Use * to mark a note.")).toBeInTheDocument();
    });
});

describe("partnership rich-text URLs", () => {
    it.each(["javascript:alert(1)", "JaVaScRiPt:alert(1)", "java\tscript:alert(1)", "data:text/html,bad", "//example.com", "\\\\example.com", "https://", "https://example.com/a\nb"])("rejects an unsafe or invalid URL: %s", url => {
        expect(isSafeRichTextLink(url)).toBe(false);
        expect(normalizeRichTextLink(url)).toBeNull();
    });

    it.each([
        ["example.com/events", "https://example.com/events"],
        [" https://example.com/contact@station.com ", "https://example.com/contact@station.com"],
        ["hello@example.com", "mailto:hello@example.com"],
        ["/press", "/press"], ["#waitlist", "#waitlist"],
    ])("normalizes a link without changing its purpose: %s", (value, expected) => {
        expect(normalizeRichTextLink(value)).toBe(expected);
    });

    it("preserves safe existing relative links and rejects non-image schemes for images", () => {
        expect(isSafeRichTextLink("events/opening")).toBe(true);
        expect(isSafeRichTextImage("/assets/poster.webp")).toBe(true);
        expect(isSafeRichTextImage("mailto:hello@example.com")).toBe(false);
        expect(normalizeRichTextLink("press")).toBeNull();
    });
});
