/** @vitest-environment node */
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MarkdownEditor } from "@/components/partnerships/markdown-editor";

describe("partnership rich editor server rendering", () => {
    it("renders a stable loading shell without DOM access or saving normalized content", () => {
        const onChange = vi.fn();
        const html = renderToString(createElement(MarkdownEditor, {
            id: "server-intro", label: "Introduction", value: "An *existing* draft.", onChange,
        }));
        expect(html).toContain("Introduction");
        expect(html).toContain("Loading editor");
        expect(onChange).not.toHaveBeenCalled();
    });
});
