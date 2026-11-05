import { type Editor, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Image from "@tiptap/extension-image";
import Paragraph from "@tiptap/extension-paragraph";
import { history } from "@tiptap/pm/history";
import { isSafeRichTextImage, isSafeRichTextLink } from "@/lib/partnerships/rich-text-url";

const SafeImage = Image.extend({
    parseHTML() {
        return [{ tag: "img[src]", getAttrs: (element) => isSafeRichTextImage(element.getAttribute("src") ?? "") ? null : false }];
    },
    parseMarkdown(token, helpers) {
        if (!isSafeRichTextImage(token.href ?? "")) return token.text ? helpers.createTextNode(token.text) : [];
        return helpers.createNode("image", { src: token.href, alt: token.text, title: token.title });
    },
    renderHTML({ HTMLAttributes }) {
        const { src, ...attributes } = HTMLAttributes;
        return ["img", mergeAttributes(this.options.HTMLAttributes, attributes, isSafeRichTextImage(src ?? "") ? { src } : {})];
    },
});

// Image tokens can appear within prose. Keep them inline, including a standalone
// image's paragraph, so importing Markdown never nests block nodes in textblocks.
const RichTextParagraph = Paragraph.extend({
    parseMarkdown(token, helpers) {
        if (token.tokens?.length === 1 && token.tokens[0].type === "image") {
            return helpers.createNode("paragraph", undefined, helpers.parseInline(token.tokens));
        }
        return this.parent?.(token, helpers) ?? helpers.createNode("paragraph");
    },
});

export function createRichTextExtensions() {
    return [
        StarterKit.configure({
            underline: false,
            paragraph: false,
            link: {
                openOnClick: false,
                defaultProtocol: "https",
                isAllowedUri: (url) => isSafeRichTextLink(url),
                HTMLAttributes: { rel: "noopener noreferrer", target: null },
            },
        }),
        RichTextParagraph,
        SafeImage.configure({ allowBase64: false, inline: true }),
        Markdown.configure({ markedOptions: { gfm: true } }),
    ];
}

/** External resets start a fresh history; controlled value echoes never call this. */
export function resetRichTextContent(editor: Editor, value: string) {
    editor.unregisterPlugin("history");
    editor.registerPlugin(history());
    editor.chain().setMeta("addToHistory", false).setContent(value, { contentType: "markdown", emitUpdate: false }).run();
}
