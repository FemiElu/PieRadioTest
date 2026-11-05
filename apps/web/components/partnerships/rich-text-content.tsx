import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { isSafeRichTextImage, isSafeRichTextLink } from "@/lib/partnerships/rich-text-url";

type Props = { value: string; className?: string };

/** Shared presentation for the stored copy, including the editor's preview. */
export function PartnershipRichText({ value, className = "" }: Props) {
    return <div className={`partnership-rich-text ${className}`}>
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            skipHtml
            urlTransform={(url, key) => (key === "src" ? isSafeRichTextImage(url) : isSafeRichTextLink(url)) ? url : ""}
            components={{
                img: ({ src, alt, title }) => {
                    if (typeof src !== "string" || !src || !isSafeRichTextImage(src)) return alt ? <span>{alt}</span> : null;
                    // Markdown images can use author-provided hosts and dimensions.
                    // eslint-disable-next-line @next/next/no-img-element
                    return <img src={src} alt={alt ?? ""} title={title} loading="lazy" decoding="async" />;
                },
                a: ({ href, title, children }) => {
                    if (!href || !isSafeRichTextLink(href)) return <span>{children}</span>;
                    const external = /^https?:/i.test(href);
                    return <a href={href} title={title} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{children}</a>;
                },
            }}
        >{value}</ReactMarkdown>
    </div>;
}
