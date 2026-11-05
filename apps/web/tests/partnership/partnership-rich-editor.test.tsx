import { useState } from "react";
import { renderToString } from "react-dom/server";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { Editor } from "@tiptap/core";
import { MarkdownEditor } from "@/components/partnerships/markdown-editor";
import { PartnershipRichText } from "@/components/partnerships/rich-text-content";

beforeAll(() => {
    Range.prototype.getBoundingClientRect = () => new DOMRect(0, 0, 0, 0);
    Range.prototype.getClientRects = () => Object.assign([], { item: () => null });
    HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

function Harness({ initial = "Welcome friends ", disabled = false, changed = vi.fn() }: { initial?: string; disabled?: boolean; changed?: (value: string) => void }) {
    const [value, setValue] = useState(initial);
    return <>
        <MarkdownEditor id="intro" label="Introduction" value={value} disabled={disabled} onChange={(next) => { changed(next); setValue(next); }} />
        <output data-testid="stored">{value}</output>
        <section data-testid="published"><PartnershipRichText value={value} /></section>
        <button type="button" onClick={() => setValue("A different saved paragraph.")}>Load another value</button>
    </>;
}

async function instance() {
    const field = await screen.findByRole("textbox", { name: "Introduction" });
    await waitFor(() => expect((field as HTMLElement & { editor?: Editor }).editor).toBeTruthy());
    return (field as HTMLElement & { editor: Editor }).editor;
}
function select(editor: Editor, from: number, to = from) { act(() => { editor.commands.setTextSelection({ from, to }); }); }
function click(name: string) {
    const button = screen.getByRole("button", { name: `${name} in Introduction` });
    fireEvent.mouseDown(button);
    fireEvent.click(button);
    return button;
}
function published() { return screen.getByTestId("published"); }

describe("partnership visual editor", () => {
    it("formats a trailing-space selection visually and renders stored emphasis without literal asterisks", async () => {
        const changed = vi.fn();
        render(<Harness changed={changed} />);
        const editor = await instance();
        expect(changed).not.toHaveBeenCalled();
        select(editor, 1, 17);
        const italic = click("Italic");
        await waitFor(() => expect(italic).toHaveAttribute("aria-pressed", "true"));
        expect(editor.view.dom.querySelector("em")).toHaveTextContent("Welcome friends");
        expect(published().querySelector("em")).toHaveTextContent("Welcome friends");
        expect(published()).not.toHaveTextContent("*");
        expect(screen.getByTestId("stored").textContent).toBe("*Welcome friends* ");
        click("Italic");
        await waitFor(() => expect(italic).toHaveAttribute("aria-pressed", "false"));
        expect(published().querySelector("em")).toBeNull();
        expect(editor.state.selection.from).toBe(1);
        expect(editor.state.selection.to).toBe(17);
    });

    it("preserves nested marks and can undo/redo a formatting change after controlled value echoes", async () => {
        render(<Harness initial="Bold and italic" />);
        const editor = await instance();
        select(editor, 1, 16);
        click("Bold"); click("Italic");
        expect(published().querySelector("strong em, em strong")).toHaveTextContent("Bold and italic");
        expect(published()).not.toHaveTextContent("*");
        click("Undo");
        await waitFor(() => expect(published().querySelector("em")).toBeNull());
        click("Redo");
        await waitFor(() => expect(published().querySelector("strong em, em strong")).toHaveTextContent("Bold and italic"));
    });

    it("uses semantic headings, list blocks, and quotes in the saved renderer", async () => {
        render(<Harness initial="Programme details" />);
        const editor = await instance();
        select(editor, 1, 18);
        fireEvent.change(screen.getByRole("combobox", { name: "Text style in Introduction" }), { target: { value: "2" } });
        expect(within(published()).getByRole("heading", { level: 2 })).toHaveTextContent("Programme details");
        click("Bullet list");
        expect(published().querySelector("ul li")).toHaveTextContent("Programme details");
        click("Numbered list");
        expect(published().querySelector("ol li")).toHaveTextContent("Programme details");
        click("Numbered list");
        click("Quote");
        expect(published().querySelector("blockquote")).toHaveTextContent("Programme details");
    });

    it("rejects unsafe links, applies a valid URL to the preserved selection, and removes a link at the cursor", async () => {
        render(<Harness initial="Read more now" />);
        const editor = await instance();
        select(editor, 1, 10);
        click("Link");
        const url = await screen.findByRole("textbox", { name: "Link URL" });
        fireEvent.change(url, { target: { value: "javascript:alert(1)" } });
        fireEvent.keyDown(url, { key: "Enter" });
        expect(await screen.findByRole("alert")).toHaveTextContent("Enter a valid");
        expect(published().querySelector("a")).toBeNull();
        fireEvent.change(url, { target: { value: "example.com/story" } });
        fireEvent.click(screen.getByRole("button", { name: "Apply link" }));
        await waitFor(() => expect(published().querySelector("a")).toHaveAttribute("href", "https://example.com/story"));
        expect(published().querySelector("a")).toHaveTextContent("Read more");
        select(editor, 3);
        click("Link");
        expect(await screen.findByRole("textbox", { name: "Link URL" })).toHaveValue("https://example.com/story");
        fireEvent.click(screen.getByRole("button", { name: "Remove link" }));
        await waitFor(() => expect(published().querySelector("a")).toBeNull());
        expect(published()).toHaveTextContent("Read more now");
    });

    it("inserts a link at an empty selection without inserting placeholder words", async () => {
        render(<Harness initial="" />);
        await instance();
        click("Link");
        fireEvent.change(await screen.findByRole("textbox", { name: "Link URL" }), { target: { value: "/news" } });
        fireEvent.click(screen.getByRole("button", { name: "Apply link" }));
        await waitFor(() => expect(published().querySelector("a")).toHaveAttribute("href", "/news"));
        expect(published().querySelector("a")).toHaveTextContent("/news");
    });

    it("keeps legacy content clean on mount, then resets content and undo history only for external replacements", async () => {
        const changed = vi.fn();
        render(<Harness initial="## Existing **copy**" changed={changed} />);
        const editor = await instance();
        expect(changed).not.toHaveBeenCalled();
        expect(screen.getByTestId("stored")).toHaveTextContent("## Existing **copy**");
        select(editor, 1, 9); click("Italic");
        expect(changed).toHaveBeenCalled();
        const before = changed.mock.calls.length;
        fireEvent.click(screen.getByRole("button", { name: "Load another value" }));
        await waitFor(() => expect(editor.view.dom).toHaveTextContent("A different saved paragraph."));
        expect(changed).toHaveBeenCalledTimes(before);
        expect(screen.getByRole("button", { name: "Undo in Introduction" })).toBeDisabled();
    });

    it("preserves malformed legacy markers until an author edits instead of silently rewriting saved copy", async () => {
        const changed = vi.fn();
        render(<Harness initial="Welcome *new friends * today" changed={changed} />);
        const editor = await instance();
        expect(editor.view.dom).toHaveTextContent("Welcome *new friends * today");
        expect(changed).not.toHaveBeenCalled();
    });

    it("locks both contenteditable and toolbar during saves and retains text exceeding the limit", async () => {
        render(<Harness initial={"x".repeat(5001)} disabled />);
        const editor = await instance();
        expect(editor.view.dom).toHaveAttribute("contenteditable", "false");
        expect(editor.view.dom).toHaveAttribute("aria-disabled", "true");
        expect(screen.getByRole("button", { name: "Italic in Introduction" })).toBeDisabled();
        expect(editor.getText()).toHaveLength(5001);
        expect(screen.getByRole("alert")).toHaveTextContent("Shorten this field");
    });

    it.each([
        ["![Flyer](https://cdn.example.com/flyer.png)", 1],
        ["Before ![Flyer](https://cdn.example.com/flyer.png) after", 1],
        ["![Private image](data:image/png;base64,aGVsbG8=)", 0],
    ])("imports standalone and inline images into valid document content: %s", async (original, imageCount) => {
        const changed = vi.fn();
        render(<Harness initial={original} changed={changed} />);
        const editor = await instance();
        expect(() => editor.state.doc.check()).not.toThrow();
        // ProseMirror inserts browser caret separator images around a final inline image.
        // Assert the authored source rather than counting its internal cursor widgets.
        expect(editor.view.dom.querySelectorAll('img[src="https://cdn.example.com/flyer.png"]')).toHaveLength(imageCount);
        let documentImages = 0;
        editor.state.doc.descendants(node => { if (node.type.name === "image") documentImages += 1; });
        expect(documentImages).toBe(imageCount);
        expect(screen.getByTestId("stored")).toHaveTextContent(original);
        expect(changed).not.toHaveBeenCalled();
    });

    it("blocks unsafe embedded image imports and HTML paste without malformed document nodes", async () => {
        const changed = vi.fn();
        const original = "Before ![private image](data:image/png;base64,aGVsbG8=) after";
        render(<Harness initial={original} changed={changed} />);
        const editor = await instance();
        expect(() => editor.state.doc.check()).not.toThrow();
        expect(editor.view.dom.querySelector("img")).toBeNull();
        expect(screen.getByTestId("stored")).toHaveTextContent(original);
        expect(changed).not.toHaveBeenCalled();
        act(() => { editor.commands.insertContent('<img src="javascript:alert(1)" alt="Unsafe">'); });
        expect(editor.view.dom.querySelector("img")).toBeNull();
        expect(() => editor.state.doc.check()).not.toThrow();
    });

    it("defers editor creation during SSR", () => {
        expect(() => renderToString(<MarkdownEditor id="ssr" label="SSR copy" value="**Saved**" onChange={vi.fn()} />)).not.toThrow();
    });
});
