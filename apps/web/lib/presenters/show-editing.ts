/** The only presenter-show columns this editor may change. */
export type ShowEditFields = {
    title: string;
    description: string | null;
    schedule: string | null;
    cover_image_url: string | null;
};

export function isShowArtworkUrl(value: string): boolean {
    const url = value.trim();
    if (!url) return true;
    if (/[\u0000-\u0020\u007f-\u009f\\]/.test(url) || url.startsWith("//")) return false;
    if (url.startsWith("/")) return true;
    if (!/^https?:\/\//i.test(url)) return false;
    try { return Boolean(new URL(url).hostname); }
    catch { return false; }
}

export function showEditPatch(value: ShowEditFields): ShowEditFields {
    return {
        title: value.title.trim(),
        description: value.description?.trim() || null,
        schedule: value.schedule?.trim() || null,
        cover_image_url: value.cover_image_url?.trim() || null,
    };
}

export function sameShowFields(a: ShowEditFields, b: ShowEditFields): boolean {
    return a.title === b.title && (a.description ?? "") === (b.description ?? "")
        && (a.schedule ?? "") === (b.schedule ?? "") && (a.cover_image_url ?? "") === (b.cover_image_url ?? "");
}
