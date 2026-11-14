"use client";

import Image from "next/image";
import { PartnershipRichText } from "@/components/partnerships/rich-text-content";
import { useActionState, useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { joinPartnershipWaitlist, type PartnershipWaitlistState } from "@/app/actions/partnership-waitlist";
import { ShowPreviewDialog } from "@/components/shared/show-preview-dialog";
import type { PartnershipPage } from "@/lib/partnerships/queries";

type Props = { page: PartnershipPage; preview?: boolean };
const initialState: PartnershipWaitlistState = { message: "" };

export function PartnershipPageView({ page, preview = false }: Props) {
    const { content: c } = page;
    const themeStyle = {
        "--partnership-page-background": c.theme.pageBackground,
        "--partnership-gallery-background": c.theme.galleryBackground,
        "--partnership-gallery-heading-color": c.theme.galleryHeadingColor,
        "--partnership-gallery-body-color": c.theme.galleryBodyColor,
        "--partnership-surface-background": c.theme.surfaceBackground,
        "--partnership-heading-color": c.theme.headingColor,
        "--partnership-body-color": c.theme.bodyColor,
        "--partnership-brand-color": c.theme.brandColor,
        "--partnership-accent-color": c.theme.accentColor,
        "--partnership-cta-background": c.theme.ctaBackground,
        "--partnership-cta-text": c.theme.ctaText,
        backgroundColor: "var(--partnership-page-background)",
        color: "var(--partnership-body-color)",
    } as CSSProperties;
    const [state, action, pending] = useActionState(joinPartnershipWaitlist.bind(null, page.slug), initialState);
    const [episodes, setEpisodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialog, setDialog] = useState(false);
    const galleryRef = useRef<HTMLDivElement>(null);
    useEffect(() => { if (!preview) (window as Window & { dataLayer?: Record<string, unknown>[] }).dataLayer?.push({ event: "partnership_page_view", partnership: page.slug }); }, [page.slug, preview]);
    const openShows = async () => {
        setDialog(true);
        if (episodes.length) return;
        setLoading(true);
        const supabase = createClient();
        const { data } = await supabase.from("episodes").select("id,title,description,file_key,cover_image_url,aired_at,duration_seconds").eq("partnership_page_id", page.id).order("aired_at", { ascending: false });
        const ready = await Promise.all((data ?? []).map(async (episode) => {
            if (!episode.file_key?.startsWith(`partnerships/${page.id}/`)) return episode;
            const { data: signed } = await supabase.storage.from("partnership-audio").createSignedUrl(episode.file_key, 3600);
            return { ...episode, audio_url: signed?.signedUrl ?? null };
        }));
        setEpisodes(ready); setLoading(false);
    };
    const image = (asset: { src: string; alt: string }, className = "") => asset.src ? <Image src={asset.src} alt={asset.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className={className} /> : <div className="absolute inset-0 grid place-items-center bg-zinc-100 text-sm text-zinc-400">Add image in the page editor</div>;
    const external = (href: string) => /^https?:\/\//i.test(href);

    return <div className="partnership-page" style={themeStyle}>
        {preview && <div className="sticky top-0 z-50 bg-amber-300 px-4 py-2 text-center text-sm font-bold">Draft preview · Form submissions are disabled</div>}
        <section className="relative min-h-[360px] overflow-hidden bg-deep-text text-white sm:min-h-[420px] lg:min-h-[540px] xl:min-h-[640px]">
            {c.hero.background.src && <div className="absolute inset-0">{image(c.hero.background, "object-cover object-center")}</div>}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30"/><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"/>
            <div className="container relative mx-auto flex min-h-[360px] max-w-screen-2xl flex-col justify-center px-4 py-16 sm:min-h-[420px] sm:py-20 md:px-8 lg:min-h-[540px] lg:py-24 xl:min-h-[640px]">
                <div className="mb-12 flex items-center gap-5">{c.hero.stationLogo.src && <div className="relative h-14 w-36">{image(c.hero.stationLogo, "object-contain")}</div>}<span className="text-2xl text-white/50">×</span>{c.hero.partnerLogo.src && <div className="relative h-14 w-36">{image(c.hero.partnerLogo, "object-contain")}</div>}</div>
                <p className="mb-3 text-sm font-bold uppercase tracking-[.25em]" style={{ color: "var(--partnership-brand-color)" }}>{page.brand_name} × Pie Radio</p>
                <h1 className="mb-4 max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">{c.hero.title} <span style={{ color: "var(--partnership-brand-color)" }}>{c.hero.accentTitle}</span></h1>
                <PartnershipRichText value={c.hero.intro} className="mb-6 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:mb-8 sm:text-base lg:text-lg" />
                {c.hero.showHeading && <h2 className="mt-9 text-2xl font-black uppercase">{c.hero.showHeading}</h2>}
                <PartnershipRichText value={c.hero.showDetails} className="mt-3 max-w-2xl text-white/75" />
                <PartnershipRichText value={c.hero.closing} className="mt-3 max-w-2xl text-white/75" />
                <div className="mt-10 flex flex-wrap gap-3"><a href="#waitlist" className="partnership-cta rounded-xl px-6 py-3 font-bold">{c.hero.waitlistCta}</a>{c.hero.pressHref && <a href={c.hero.pressHref} target={external(c.hero.pressHref) ? "_blank" : undefined} rel={external(c.hero.pressHref) ? "noreferrer" : undefined} className="rounded-xl border border-white/30 px-6 py-3 font-bold">{c.hero.pressCta}<ArrowUpRight className="ml-2 inline h-4 w-4"/></a>}<button onClick={openShows} className="rounded-xl border border-white/30 px-6 py-3 font-bold"><Play className="mr-2 inline h-4 w-4"/>{c.hero.audioCta}</button></div>
                {c.hero.capacity && <p className="mt-4 text-sm text-white/60">{c.hero.capacity}</p>}
                <a href="#gallery" className="mt-12 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/60">Discover the story <ArrowDown className="h-4 w-4"/></a>
            </div>
        </section>
        <section id="gallery" className="overflow-hidden py-16 sm:py-20 lg:py-24" style={{ backgroundColor: "var(--partnership-gallery-background)", color: "var(--partnership-gallery-body-color)" }}><div className="container mx-auto max-w-screen-2xl px-4 md:px-8"><div className="mb-8 flex items-end justify-between sm:mb-10"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.2em] sm:text-sm" style={{ color: "var(--partnership-brand-color)" }}>{c.gallery.eyebrow}</p><h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl" style={{ color: "var(--partnership-gallery-heading-color)" }}>{c.gallery.title}</h2></div><div className="hidden gap-2 sm:flex"><Button variant="outline" size="icon" aria-label="Previous images" onClick={() => galleryRef.current?.scrollBy({ left: -galleryRef.current.clientWidth * .75, behavior: "smooth" })}><ChevronLeft/></Button><Button variant="outline" size="icon" aria-label="Next images" onClick={() => galleryRef.current?.scrollBy({ left: galleryRef.current.clientWidth * .75, behavior: "smooth" })}><ChevronRight/></Button></div></div><div ref={galleryRef} className="carousel-snap flex gap-4 overflow-x-auto pb-4 sm:gap-6">{c.gallery.images.map((asset, i) => <div key={`${asset.src}-${i}`} className="group relative aspect-[4/3] w-[280px] shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:w-[320px] lg:w-[360px]">{image(asset, "object-cover transition-transform duration-500 group-hover:scale-105")}</div>)}</div>{c.gallery.images.length === 0 && <p className="rounded-2xl border border-dashed border-white/20 p-12 text-center" style={{ color: "var(--partnership-gallery-body-color)" }}>Add gallery images in the editor.</p>}</div></section>
        <section id="waitlist" className="py-16 sm:py-20 lg:py-24" style={{ backgroundColor: "var(--partnership-page-background)", color: "var(--partnership-body-color)" }}><div className="container mx-auto grid max-w-screen-2xl grid-cols-1 items-center gap-10 px-4 md:px-8 lg:grid-cols-12 lg:gap-16"><div className="flex justify-center lg:col-span-5"><div className="relative aspect-[2/3] w-full max-w-[450px] overflow-hidden rounded-2xl shadow-2xl" style={{ backgroundColor: "var(--partnership-surface-background)" }}>{image(c.event.flyer, "object-cover object-center")}</div></div><div className="mx-auto w-full max-w-xl lg:col-span-7 lg:mx-0"><div className="mb-4 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest" style={{ backgroundColor: "color-mix(in srgb, var(--partnership-brand-color) 10%, transparent)", color: "var(--partnership-brand-color)" }}>{c.event.badge}</div><h2 className="font-display text-5xl font-black uppercase italic leading-[.9] tracking-tight sm:text-6xl lg:text-7xl" style={{ color: "var(--partnership-heading-color)" }}>{c.event.title} <span style={{ color: "var(--partnership-brand-color)" }}>{c.event.accentTitle}</span></h2><p className="mb-6 mt-3 text-base font-bold sm:text-xl" style={{ color: "var(--partnership-brand-color)" }}>{c.event.subtitle}</p><div className="mb-8 flex flex-wrap gap-2">{c.event.tags.map(tag => <span key={tag} className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ backgroundColor: "var(--partnership-accent-color)", color: "var(--partnership-cta-text)" }}>{tag}</span>)}</div><div className="mb-8 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">{c.event.facts.map((fact, i) => <div key={i} className="rounded-2xl border border-border/50 p-4 shadow-sm" style={{ backgroundColor: "var(--partnership-surface-background)" }}><p className="mb-1 text-[10px] font-bold uppercase" style={{ color: "var(--partnership-body-color)" }}>{fact.label}</p><p className="text-xs font-bold leading-tight sm:text-sm" style={{ color: "var(--partnership-heading-color)" }}>{fact.value}</p></div>)}</div>
            {preview ? <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Waitlist form is disabled in preview.</p> : state.success ? <div role="status" className="rounded-2xl bg-emerald-50 p-7"><h3 className="text-2xl font-black">{c.event.successTitle}</h3><p className="mt-2">{c.event.successMessage}</p></div> : <form action={action} className="space-y-4 rounded-3xl border p-6 sm:p-8" style={{ backgroundColor: "var(--partnership-surface-background)", color: "var(--partnership-body-color)" }}><label className="block text-sm font-bold">{c.event.fullNameLabel}<Input name="fullName" required minLength={2} placeholder={c.event.fullNamePlaceholder} className="mt-2"/></label><label className="block text-sm font-bold">{c.event.emailLabel}<Input name="email" type="email" required placeholder={c.event.emailPlaceholder} className="mt-2"/></label>{c.event.consent && <label className="flex items-start gap-3 text-sm" style={{ color: "var(--partnership-body-color)" }}><input name="marketingConsent" value="true" type="checkbox" className="mt-1"/><span>{c.event.consent}</span></label>}<Button type="submit" disabled={pending} className="partnership-cta h-12 w-full font-bold">{pending ? "Joining…" : c.event.submitLabel}</Button>{state.message && <p role="alert" className="text-sm text-red-600">{state.message}</p>}</form>}
        </div></div></section>
        <section className="border-t border-border/50 py-12 sm:py-16" style={{ backgroundColor: "var(--partnership-surface-background)", color: "var(--partnership-body-color)" }}><div className="container mx-auto max-w-screen-2xl px-4 text-center md:px-8"><p className="mb-4 text-xs font-bold uppercase tracking-[.2em] sm:text-sm" style={{ color: "var(--partnership-body-color)" }}>{c.socials.eyebrow}</p><h2 className="mb-6 font-display text-xl font-bold sm:text-2xl" style={{ color: "var(--partnership-heading-color)" }}>{c.socials.title}</h2><div className="flex justify-center gap-4">{c.socials.links.filter(link => link.href).map(link => <a key={link.platform} href={link.href} target={external(link.href) ? "_blank" : undefined} rel={external(link.href) ? "noreferrer" : undefined} aria-label={link.label} className="partnership-social-link flex h-12 w-12 items-center justify-center rounded-full border-2 border-border/50 font-bold transition sm:h-14 sm:w-14">{link.label.slice(0, 1)}</a>)}</div></div></section>
        <section className="partnership-closing-banner relative overflow-hidden py-10 text-center text-white sm:py-14"><div className="container relative mx-auto max-w-screen-2xl px-4 md:px-8"><div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider sm:text-sm"><span className="h-2 w-2 rounded-full bg-white"/>{c.closing.badge}</div><h2 className="mb-3 font-display text-2xl font-bold sm:text-3xl lg:text-4xl">{c.closing.title}</h2><p className="mx-auto max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">{c.closing.body}</p></div></section>
        <ShowPreviewDialog open={dialog} onOpenChange={setDialog} episodes={episodes} loading={loading} showName={c.audio.showName} brandName={c.audio.brandName} description={c.audio.description} eyebrow={c.audio.eyebrow} footer={c.audio.footer}/>
    </div>;
}
