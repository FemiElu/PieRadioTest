"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Link2, Undo2, Redo2, RemoveFormatting } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { normalizeRichTextLink } from "@/lib/partnerships/rich-text-url";
import { createRichTextExtensions, resetRichTextContent } from "./rich-text-editor-extensions";

type MarkdownEditorProps = {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    rows?: number;
    disabled?: boolean;
    error?: string;
    maxLength?: number;
};

export function MarkdownEditor({ id, label, value, onChange, rows = 5, disabled = false, error, maxLength = 5_000 }: MarkdownEditorProps) {
    const changeRef = useRef(onChange);
    changeRef.current = onChange;
    const lastValue = useRef(value);
    const openLinkRef = useRef<() => void>(() => {});
    const [linkOpen, setLinkOpen] = useState(false);
    const [linkValue, setLinkValue] = useState("");
    const [linkError, setLinkError] = useState("");
    const linkSelection = useRef({ from: 1, to: 1, linked: false });
    const overLimit = value.length > maxLength;
    const message = error || (overLimit ? `Shorten this field to ${maxLength.toLocaleString()} characters before saving.` : "");

    const editorMinHeight = `${Math.max(rows, 3) * 1.75 + 1.5}rem`;
    const extensions = useMemo(createRichTextExtensions, []);
    const editor = useEditor({
        extensions,
        content: value,
        contentType: "markdown",
        immediatelyRender: false,
        shouldRerenderOnTransaction: false,
        editable: !disabled,
        editorProps: {
            attributes: {
                id,
                role: "textbox",
                "aria-labelledby": `${id}-label`,
                "aria-multiline": "true",
                style: `min-height: ${editorMinHeight};`,
                "aria-describedby": `${id}-help ${id}-error`,
                class: "partnership-rich-text min-w-0 px-4 py-3 text-sm leading-7 text-[#141827] outline-none",
            },
            handleKeyDown: (_view, event) => {
                if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                    event.preventDefault();
                    openLinkRef.current();
                    return true;
                }
                return false;
            },
        },
        onUpdate: ({ editor: current }) => {
            const next = current.getMarkdown();
            lastValue.current = next;
            changeRef.current(next);
        },
    });

    const state = useEditorState({
        editor,
        selector: ({ editor: current }) => current ? {
            bold: current.isActive("bold"), italic: current.isActive("italic"), strike: current.isActive("strike"),
            bullet: current.isActive("bulletList"), ordered: current.isActive("orderedList"), quote: current.isActive("blockquote"), link: current.isActive("link"),
            heading: current.getAttributes("heading").level as number | undefined,
            undo: current.can().undo(), redo: current.can().redo(), canQuote: current.can().toggleBlockquote(),
        } : null,
    });

    useEffect(() => {
        if (!editor || editor.isDestroyed || value === lastValue.current) return;
        resetRichTextContent(editor, value);
        lastValue.current = value;
        setLinkOpen(false);
    }, [editor, value]);

    useEffect(() => {
        if (!editor || editor.isDestroyed) return;
        editor.setEditable(!disabled, false);
        editor.view.dom.setAttribute("aria-disabled", String(disabled));
        editor.view.dom.setAttribute("aria-invalid", String(Boolean(message)));
        if (disabled) setLinkOpen(false);
    }, [disabled, editor, message]);

    const unavailable = disabled || !editor;
    const openLink = () => {
        if (!editor || disabled) return;
        const { from, to } = editor.state.selection;
        linkSelection.current = { from, to, linked: editor.isActive("link") };
        setLinkValue(editor.getAttributes("link").href ?? "");
        setLinkError("");
        setLinkOpen(true);
    };
    openLinkRef.current = openLink;

    const applyLink = () => {
        if (!editor || disabled) return;
        const href = normalizeRichTextLink(linkValue);
        if (!href) { setLinkError("Enter a valid website URL, email link, or page path."); return; }
        const selected = linkSelection.current;
        const chain = editor.chain().focus().setTextSelection({ from: selected.from, to: selected.to });
        if (selected.linked) chain.extendMarkRange("link").setLink({ href }).run();
        else if (selected.from === selected.to) chain.insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }).run();
        else chain.setLink({ href }).run();
        setLinkOpen(false);
    };

    const removeLink = () => {
        if (!editor || disabled) return;
        const { from, to } = linkSelection.current;
        editor.chain().focus().setTextSelection({ from, to }).extendMarkRange("link").unsetLink().run();
        setLinkOpen(false);
    };

    const tool = (name: string, icon: ReactNode, command: () => void, active?: boolean, blocked = false, shortcut?: string) => <Button
        key={name} type="button" variant="ghost" size="sm" aria-label={`${name} in ${label}`}
        aria-pressed={active} title={shortcut ? `${name} (${shortcut})` : name}
        disabled={unavailable || blocked} onMouseDown={(event) => event.preventDefault()} onClick={command}
        className={`h-9 w-9 shrink-0 rounded-md p-0 ${active ? "bg-primary/10 text-primary hover:bg-primary/15" : "text-zinc-600"}`}
    >{icon}</Button>;

    const moveToolbarFocus = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.target instanceof HTMLSelectElement || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement | HTMLSelectElement>("button:not(:disabled), select:not(:disabled)"));
        const current = controls.indexOf(document.activeElement as HTMLButtonElement);
        if (current < 0 || !controls.length) return;
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? controls.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + controls.length) % controls.length;
        controls[next].focus();
    };

    return <div className="min-w-0 space-y-2">
        <label id={`${id}-label`} htmlFor={id} className="text-sm font-bold text-[#141827]" onClick={() => editor?.commands.focus()}>{label}</label>
        <div className={`overflow-hidden rounded-xl border bg-white transition focus-within:ring-2 focus-within:ring-primary/20 ${message ? "border-red-400" : "border-border/70"} ${disabled ? "bg-zinc-50 opacity-65" : ""}`}>
            <div role="toolbar" aria-label={`Formatting for ${label}`} onKeyDown={moveToolbarFocus} className="flex flex-wrap items-center gap-1 border-b border-border/60 bg-zinc-50/80 p-2">
                <select aria-label={`Text style in ${label}`} title="Text style" disabled={unavailable} value={state?.heading ? String(state.heading) : "paragraph"}
                    onChange={(event) => { if (!editor) return; const level = Number(event.target.value); if (level) editor.chain().focus().setHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run(); else editor.chain().focus().setParagraph().run(); }}
                    className="mr-1 h-9 w-32 rounded-md border border-border/70 bg-white px-2 text-xs font-semibold text-zinc-700 outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50">
                    <option value="paragraph">Paragraph</option>{[1, 2, 3, 4, 5, 6].map(level => <option key={level} value={level}>Heading {level}</option>)}
                </select>
                <div className="flex items-center gap-0.5 border-r border-border/70 pr-1">
                    {tool("Bold", <Bold className="h-4 w-4" />, () => { editor?.chain().focus().toggleBold().run(); }, state?.bold, false, "⌘/Ctrl B")}
                    {tool("Italic", <Italic className="h-4 w-4" />, () => { editor?.chain().focus().toggleItalic().run(); }, state?.italic, false, "⌘/Ctrl I")}
                    {tool("Strikethrough", <Strikethrough className="h-4 w-4" />, () => { editor?.chain().focus().toggleStrike().run(); }, state?.strike)}
                </div>
                <div className="flex items-center gap-0.5 border-r border-border/70 pr-1">
                    {tool("Bullet list", <List className="h-4 w-4" />, () => { editor?.chain().focus().toggleBulletList().run(); }, state?.bullet)}
                    {tool("Numbered list", <ListOrdered className="h-4 w-4" />, () => { editor?.chain().focus().toggleOrderedList().run(); }, state?.ordered)}
                    {tool("Quote", <Quote className="h-4 w-4" />, () => { editor?.chain().focus().toggleBlockquote().run(); }, state?.quote, !state?.canQuote)}
                </div>
                <div className="flex items-center gap-0.5 border-r border-border/70 pr-1">
                    {tool("Link", <Link2 className="h-4 w-4" />, openLink, state?.link, false, "⌘/Ctrl K")}
                    {tool("Clear formatting", <RemoveFormatting className="h-4 w-4" />, () => { editor?.chain().focus().clearNodes().unsetAllMarks().run(); })}
                </div>
                <div className="flex items-center gap-0.5">
                    {tool("Undo", <Undo2 className="h-4 w-4" />, () => { editor?.chain().focus().undo().run(); }, undefined, !state?.undo, "⌘/Ctrl Z")}
                    {tool("Redo", <Redo2 className="h-4 w-4" />, () => { editor?.chain().focus().redo().run(); }, undefined, !state?.redo, "⌘/Ctrl Shift Z")}
                </div>
            </div>
            <div style={{ minHeight: editorMinHeight }}>
                <EditorContent editor={editor} style={{ minHeight: "inherit" }} />
                {!editor && <p role="status" className="px-4 py-3 text-sm text-zinc-500">Loading editor…</p>}
            </div>
            <div id={`${id}-help`} className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 px-4 py-2 text-[11px] text-zinc-500"><span>Select text to format it · ⌘/Ctrl B or I</span><span className={overLimit ? "font-semibold text-red-700" : ""}>{value.length.toLocaleString()} / {maxLength.toLocaleString()} characters, including formatting</span></div>
        </div>
        <p id={`${id}-error`} role={message ? "alert" : undefined} className={message ? "text-xs text-red-700" : "sr-only"}>{message}</p>
        <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
            <DialogContent onCloseAutoFocus={(event) => { event.preventDefault(); if (!disabled) editor?.commands.focus(undefined, { scrollIntoView: false }); }}>
                <DialogHeader><DialogTitle>{linkSelection.current.linked ? "Edit link" : "Add a link"}</DialogTitle><DialogDescription>Link the selected text, or insert a URL at the cursor.</DialogDescription></DialogHeader>
                <div className="space-y-2"><label htmlFor={`${id}-link-url`} className="text-sm font-semibold">Link URL</label><Input id={`${id}-link-url`} autoFocus value={linkValue} disabled={disabled} placeholder="https://example.com or /news" aria-invalid={Boolean(linkError)} aria-describedby={linkError ? `${id}-link-error` : undefined} onChange={(event) => { setLinkValue(event.target.value); setLinkError(""); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); event.stopPropagation(); applyLink(); } }} />{linkError && <p id={`${id}-link-error`} role="alert" className="text-sm text-red-700">{linkError}</p>}</div>
                <DialogFooter className="gap-2">{linkSelection.current.linked && <Button type="button" variant="ghost" onClick={removeLink} disabled={disabled} className="mr-auto text-red-700">Remove link</Button>}<Button type="button" variant="outline" onClick={() => setLinkOpen(false)}>Cancel</Button><Button type="button" disabled={disabled} onClick={applyLink}>Apply link</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    </div>;
}
