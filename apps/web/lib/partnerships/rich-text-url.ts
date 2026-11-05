/** Link rules shared by the visual editor and published partnership copy. */
export function isSafeRichTextLink(value: string): boolean {
    const href = value.trim();
    if (!href || /[\u0000-\u0020\u007f-\u009f\\]/.test(href) || href.startsWith("//")) return false;
    if (/^[/?#]/.test(href)) return true;
    const scheme = /^([a-z][a-z\d+.-]*):/i.exec(href);
    if (scheme) {
        const protocol = scheme[1].toLowerCase();
        if (protocol === "mailto") return href.length > "mailto:".length;
        if (protocol !== "http" && protocol !== "https") return false;
        try { return Boolean(new URL(href).hostname); }
        catch { return false; }
    }
    const colon = href.indexOf(":");
    const boundary = href.search(/[/?#]/);
    return colon < 0 || (boundary >= 0 && colon > boundary);
}

/** Accept site paths, fragments, email addresses and normal website addresses. */
export function normalizeRichTextLink(value: string): string | null {
    let href = value.trim();
    if (!href) return null;
    if (!/^(?:[a-z][a-z\d+.-]*:|[/?#])/i.test(href)) {
        if (/^[^\s/@:]+@[^\s/@:]+\.[^\s/@:]+$/.test(href)) href = `mailto:${href}`;
        else {
            if (!/^(?:www\.)?[^\s/:?#]+\.[^\s/:?#]+(?:[/?#]|$)/.test(href)) return null;
            href = `https://${href}`;
        }
    }
    return isSafeRichTextLink(href) ? href : null;
}

export function isSafeRichTextImage(value: string): boolean {
    if (!isSafeRichTextLink(value)) return false;
    const scheme = /^([a-z][a-z\d+.-]*):/i.exec(value.trim());
    return !scheme || ["http", "https"].includes(scheme[1].toLowerCase());
}
