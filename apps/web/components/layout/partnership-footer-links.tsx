"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    getPublishedPartnershipLinks,
    PARTNERSHIPS_UPDATED_EVENT,
    type PartnershipNavigationLink,
} from "@/lib/partnerships/navigation";

export function PartnershipFooterLinks() {
    const pathname = usePathname();
    const [links, setLinks] = useState<PartnershipNavigationLink[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let disposed = false;
        let controller: AbortController | undefined;

        const refresh = () => {
            controller?.abort();
            const request = new AbortController();
            controller = request;
            void (async () => {
                try {
                    const nextLinks = await getPublishedPartnershipLinks(createClient(), request.signal);
                    if (!disposed && !request.signal.aborted) {
                        setLinks(nextLinks);
                        setFailed(false);
                        setLoaded(true);
                    }
                } catch {
                    if (!disposed && !request.signal.aborted) {
                        setFailed(true);
                        setLoaded(true);
                    }
                }
            })();
        };
        const refreshWhenVisible = () => {
            if (document.visibilityState === "visible") refresh();
        };

        refresh();
        const timer = window.setInterval(refreshWhenVisible, 60_000);
        window.addEventListener("focus", refreshWhenVisible);
        document.addEventListener("visibilitychange", refreshWhenVisible);
        window.addEventListener(PARTNERSHIPS_UPDATED_EVENT, refresh);
        return () => {
            disposed = true;
            controller?.abort();
            window.clearInterval(timer);
            window.removeEventListener("focus", refreshWhenVisible);
            document.removeEventListener("visibilitychange", refreshWhenVisible);
            window.removeEventListener(PARTNERSHIPS_UPDATED_EVENT, refresh);
        };
    }, [pathname]);

    return (
        <nav aria-labelledby="footer-partnership-heading" className="space-y-4">
            <h4 id="footer-partnership-heading" className="font-semibold text-sm tracking-wide uppercase text-foreground/80">Partnership</h4>
            {links.length > 0 && (
                <ul className="space-y-2 text-sm text-muted-foreground">
                    {links.map((link) => (
                        <li key={link.id}>
                            <Link href={`/partnerships/${encodeURIComponent(link.slug)}`} className="break-words hover:text-primary focus-visible:text-primary focus-visible:underline transition-colors">{link.title}</Link>
                        </li>
                    ))}
                </ul>
            )}
            {!loaded && <p role="status" className="text-sm text-muted-foreground">Loading partnerships…</p>}
            {loaded && !failed && links.length === 0 && <p className="text-sm text-muted-foreground">No current partnerships.</p>}
            {failed && <p role="status" className="text-sm text-muted-foreground">{links.length ? "Partnership links could not be refreshed." : "Partnerships are temporarily unavailable."}</p>}
        </nav>
    );
}
