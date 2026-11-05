"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type FieldPath, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, CheckCircle2, ChevronLeft, Clock3, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageField } from "@/components/partnerships/image-field";
import { MarkdownEditor } from "@/components/partnerships/markdown-editor";
import { PartnershipEpisodeManager } from "@/components/partnerships/episode-manager";
import { isPartnershipReadyToPublish } from "@/components/partnerships/default-content";
import { CreatePartnershipSchema, type CreatePartnershipInput } from "@/lib/partnerships/schema";
import type { PartnershipPage } from "@/lib/partnerships/queries";

type PartnershipFormProps = { initialData?: PartnershipPage };

function TextField({
    id,
    label,
    placeholder,
    register,
    name,
    type = "text",
    disabled = false,
}: {
    id: string;
    label: string;
    placeholder?: string;
    register: UseFormRegister<CreatePartnershipInput>;
    name: FieldPath<CreatePartnershipInput>;
    type?: string;
    disabled?: boolean;
}) {
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="text-sm font-bold text-[#141827]">{label}</label>
            <Input id={id} type={type} placeholder={placeholder} disabled={disabled} {...register(name)} />
        </div>
    );
}

function Section({ title, description, children, open = false }: { title: string; description: string; children: React.ReactNode; open?: boolean }) {
    return (
        <details open={open} className="group rounded-3xl border border-border/50 bg-white">
            <summary className="cursor-pointer list-none p-6 [&::-webkit-details-marker]:hidden sm:p-8">
                <span className="text-lg font-bold text-[#141827]">{title}</span>
                <span className="mt-1 block text-sm text-zinc-500">{description}</span>
            </summary>
            <div className="space-y-6 border-t border-border/50 px-6 py-6 sm:px-8">{children}</div>
        </details>
    );
}

export function PartnershipForm({ initialData }: PartnershipFormProps) {
    const router = useRouter();
    const pageFormId = useId();
    const [serverError, setServerError] = useState("");
    const [existingPageId, setExistingPageId] = useState<string | null>(null);
    const [createdPage, setCreatedPage] = useState<{ id: string; status: CreatePartnershipInput["status"] } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState(initialData?.updated_at ?? "");
    const [savedStatus, setSavedStatus] = useState(initialData?.status ?? "draft");
    const [mounted, setMounted] = useState(false);
    const requestPending = useRef(false);
    const createdPageId = useRef<string | null>(null);
    const latestUpdatedAt = useRef(initialData?.updated_at ?? "");
    const initialForm: CreatePartnershipInput = initialData
        ? {
            slug: initialData.slug,
            title: initialData.title,
            brand_name: initialData.brand_name,
            description: initialData.description,
            social_image_url: initialData.social_image_url,
            status: initialData.status,
            content: initialData.content,
        }
        : {
            slug: "",
            title: "New partnership",
            brand_name: "Partner brand",
            description: "",
            social_image_url: "",
            status: "draft",
            content: {
                hero: { background: { src: "", alt: "" }, stationLogo: { src: "/assets/logo.png", alt: "Pie Radio logo" }, partnerLogo: { src: "", alt: "" }, title: "A Pie Radio partnership", accentTitle: "Brand collaboration", intro: "Add the partnership introduction here.", showHeading: "Featured radio show", showDetails: "Add the show schedule, presenters and details here.", closing: "Add details about the final event or collaboration here.", capacity: "", waitlistCta: "Join the Waitlist", pressCta: "See Press Release", pressHref: "/press", audioCta: "Listen to the Show" },
                gallery: { eyebrow: "Sneak Peek", title: "Behind the Scenes", images: [] },
                event: { flyer: { src: "", alt: "" }, badge: "Exclusive Event", title: "Partner", accentTitle: "Event", subtitle: "Pie Radio · Exclusive Live Event", tags: ["Live DJ sets", "Special guests"], facts: [{ label: "Venue", value: "Add venue details" }, { label: "Date & Time", value: "Add date and time" }, { label: "Entry", value: "Add ticket or entry details" }], fullNameLabel: "Full name", fullNamePlaceholder: "Your name", emailLabel: "Email address", emailPlaceholder: "you@example.com", consent: "I agree to receive updates about this event.", submitLabel: "Join the Waitlist", successTitle: "You’re in!", successMessage: "We’ll send event updates to your email." },
                socials: { eyebrow: "Follow the vibe", title: "Stay Connected", links: [{ platform: "instagram", label: "Instagram", href: "" }, { platform: "twitter", label: "X (Twitter)", href: "" }, { platform: "facebook", label: "Facebook", href: "" }] },
                closing: { badge: "Coming Soon", title: "Something is on the way", body: "Add the closing message for this partnership." },
                audio: { showName: "Partner Radio Show", brandName: "Partner brand", description: "Listen back to the latest episodes of our sponsored show.", eyebrow: "Partner Spotlight", footer: "Powered by Pie Radio" },
            },
        };

    const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialForm));
    useEffect(() => { setMounted(true); }, []);

    const form = useForm<CreatePartnershipInput>({
        resolver: zodResolver(CreatePartnershipSchema) as never,
        defaultValues: initialForm,
    });
    const { register, watch, setValue, handleSubmit, formState: { errors } } = form;
    const data = watch();
    const content = data.content;
    const isPublished = data.status === "published";
    const saveLabel = isPublished ? savedStatus === "published" ? "Save live changes" : "Publish page" : data.status === "archived" ? "Save archived page" : "Save draft";
    const isDirty = JSON.stringify(data) !== savedSnapshot;
    const savedLabel = isSaving ? "Saving…" : isDirty ? "Unsaved changes" : lastSavedAt
        ? mounted ? `Saved at ${new Date(lastSavedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}` : "Saved"
        : "Not saved yet";

    const setImage = (path: FieldPath<CreatePartnershipInput>, next: { src: string; alt: string }) => {
        setValue(`${path}.src` as FieldPath<CreatePartnershipInput>, next.src, { shouldDirty: true, shouldValidate: true });
        setValue(`${path}.alt` as FieldPath<CreatePartnershipInput>, next.alt, { shouldDirty: true, shouldValidate: true });
    };

    const save = async (values: CreatePartnershipInput) => {
        if (requestPending.current || (!initialData && createdPageId.current)) return;
        setServerError("");
        setExistingPageId(null);
        if (values.status === "published") {
            const readinessError = isPartnershipReadyToPublish(values);
            if (readinessError) {
                setServerError(readinessError);
                return;
            }
        }

        requestPending.current = true;
        setIsSaving(true);
        const submittedValues = structuredClone(values);
        try {
            const isEditing = Boolean(initialData);
            const response = await fetch(isEditing ? `/api/admin/partnerships/${initialData!.id}` : "/api/admin/partnerships", {
                method: isEditing ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(isEditing ? { ...submittedValues, updated_at: latestUpdatedAt.current } : submittedValues),
            });
            const result = await response.json();
            if (!response.ok) {
                if (result.code === "SLUG_IN_USE") {
                    setExistingPageId(result.existingPage?.id ?? null);
                    form.setError("slug", { type: "server", message: "Choose a different URL or edit the existing page." }, { shouldFocus: true });
                }
                const detail = result.issues?.formErrors?.[0] ?? Object.values(result.issues?.fieldErrors ?? {}).flat()[0];
                throw new Error(detail ? `${result.error}: ${detail}` : result.error || "Failed to save partnership page");
            }

            setSavedSnapshot(JSON.stringify(submittedValues));
            setSavedStatus(submittedValues.status);
            if (result.updated_at) setLastSavedAt(result.updated_at);
            toast.success(submittedValues.status === "draft" ? "Draft saved" : submittedValues.status === "published" ? savedStatus === "published" ? "Live changes saved" : "Partnership page published" : "Archived page saved", {
                description: submittedValues.status === "draft" ? "Find it anytime in Partnerships → Drafts." : "Your changes have been saved.",
            });

            if (!isEditing) {
                createdPageId.current = result.id;
                setCreatedPage({ id: result.id, status: values.status });
                router.replace(`/admin/partnerships/${result.id}/edit`);
            } else {
                latestUpdatedAt.current = result.updated_at;
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to save partnership page";
            setServerError(message);
            toast.error(message);
        } finally {
            requestPending.current = false;
            setIsSaving(false);
        }
    };

    const text = (path: FieldPath<CreatePartnershipInput>, label: string, placeholder?: string) => (
        <TextField id={path.replaceAll(".", "-")} label={label} placeholder={placeholder} name={path} register={register} />
    );
    const rich = (path: "content.hero.intro" | "content.hero.showDetails" | "content.hero.closing", label: string, value: string, rows = 5) => (
        <MarkdownEditor id={path.replaceAll(".", "-")} label={label} value={value} rows={rows} disabled={isSaving} error={form.getFieldState(path, form.formState).error?.message} onChange={(next) => setValue(path, next, { shouldDirty: true, shouldValidate: true })} />
    );

    if (!initialData && createdPage) {
        return <div className="mx-auto max-w-5xl space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-8">
            <div role="status">
                <h2 className="text-xl font-bold text-emerald-950">{createdPage.status === "draft" ? "Draft saved" : "Partnership page saved"}</h2>
                <p className="mt-2 text-sm text-emerald-900">Your page has been saved. Opening the editor so you can continue adding content and uploads.</p>
            </div>
            <Button asChild variant="outline"><Link href={`/admin/partnerships/${createdPage.id}/edit`}>Continue editing saved page</Link></Button>
            <Link href="/admin/partnerships/drafts" className="ml-4 inline-block text-sm font-semibold text-primary underline">View all drafts</Link>
        </div>;
    }

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-10">
            <Link href="/admin/partnerships/drafts" className="flex w-fit items-center gap-1 text-sm font-semibold text-zinc-600 hover:text-primary"><ChevronLeft className="h-4 w-4" />Back to drafts</Link>
            <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-white p-6 sm:p-8">
                <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Partnership editor</p><h1 className="mt-2 font-display text-2xl font-black tracking-tight text-[#141827] sm:text-3xl">{initialData ? "Edit partnership" : "New partnership page"}</h1><p className="mt-2 text-sm text-zinc-600">Save your progress, then return to Drafts to review and publish.</p></div>
                <div className="space-y-2 sm:text-right"><span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${savedStatus === "published" ? "bg-emerald-100 text-emerald-900" : savedStatus === "archived" ? "bg-zinc-100 text-zinc-700" : "bg-amber-100 text-amber-900"}`}>{savedStatus === "published" ? "Live" : savedStatus === "archived" ? "Archived" : "Draft"}</span><p role="status" aria-live="polite" className={`flex items-center gap-1.5 text-xs font-semibold sm:justify-end ${isDirty ? "text-amber-800" : "text-zinc-600"}`}>{isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : lastSavedAt && !isDirty ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" /> : <Clock3 className="h-3.5 w-3.5" />}{savedLabel}</p></div>
            </header>
            <form id={pageFormId} aria-label="Partnership page content" onSubmit={handleSubmit(save, () => { setServerError("Check the page settings and required content before saving."); toast.error("Check the highlighted fields before saving."); })} className="contents">
            <fieldset disabled={isSaving} className="contents">
            <section className="rounded-3xl border border-border/50 bg-white p-6 sm:p-8">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-[#141827]">Page settings</h2>
                        <p className="mt-1 text-sm text-zinc-500">Content changes the fixed partnership layout.</p>
                    </div>
                    {initialData && (
                        <Button type="button" variant="outline" disabled={isSaving} onClick={() => window.open(`/admin/partnerships/${initialData.id}/preview`, "_blank", "noopener,noreferrer")}>
                            <ArrowUpRight className="mr-2 h-4 w-4" /> Preview page
                        </Button>
                    )}
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                    <TextField id="partnership-title" label="Admin page title" name="title" register={register} placeholder="Pie Radio × Partner" />
                    <TextField id="partnership-brand" label="Partner name" name="brand_name" register={register} placeholder="Partner brand" />
                    <div className="space-y-2">
                        <label htmlFor="partnership-slug" className="text-sm font-bold text-[#141827]">Page URL</label>
                        <div className="flex items-center overflow-hidden rounded-md border border-input bg-white">
                            <span className="shrink-0 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">/partnerships/</span>
                            <Input id="partnership-slug" {...register("slug")} placeholder="partner-campaign" aria-invalid={Boolean(errors.slug)} aria-describedby="partnership-slug-help" disabled={isPublished} className="border-0 shadow-none focus-visible:ring-0" />
                        </div>
                        <p id="partnership-slug-help" className="text-xs text-zinc-500">Choose a unique URL for each campaign. To update a saved page, open it from Partnerships.</p>
                        {errors.slug && <p className="text-xs text-red-600">{errors.slug.message}</p>}
                        {errors.slug && existingPageId && <Link className="inline-block text-sm font-semibold underline" href={`/admin/partnerships/${existingPageId}/edit`}>Edit the existing partnership page</Link>}
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="partnership-status" className="text-sm font-bold text-[#141827]">Publishing status</label>
                        <select id="partnership-status" {...register("status")} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm">
                            <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
                        </select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <label htmlFor="partnership-description" className="text-sm font-bold text-[#141827]">Search and social description</label>
                        <Textarea id="partnership-description" rows={2} {...register("description")} placeholder="A short introduction for search results and social sharing" />
                    </div>
                    <TextField id="partnership-social-image" label="Search and social image URL" name="social_image_url" register={register} placeholder="Upload an image below, then paste its URL" />
                </div>
                {savedStatus === "published" && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{isPublished ? "This page is live. Saving publishes the changes immediately. Its URL is locked after publishing." : `This page is currently live. Saving will take it offline and move it to ${data.status === "draft" ? "Drafts" : "Archived"}.`}</p>}
                {savedStatus !== "published" && isPublished && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-950">Saving will publish this page on the public website. Its URL will be locked after publishing.</p>}
            </section>

            <Section title="1. Hero" description="Logos, headline, partnership copy, show details and calls to action." open>
                <div className="grid gap-4 md:grid-cols-3">
                    <ImageField pageId={initialData?.id} label="Hero background" {...content.hero.background} onChange={(next) => setImage("content.hero.background", next)} />
                    <ImageField pageId={initialData?.id} label="Pie Radio logo" {...content.hero.stationLogo} onChange={(next) => setImage("content.hero.stationLogo", next)} />
                    <ImageField pageId={initialData?.id} label="Partner logo" {...content.hero.partnerLogo} onChange={(next) => setImage("content.hero.partnerLogo", next)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    {text("content.hero.title", "Headline", "Turning Up the Flavor.")}
                    {text("content.hero.accentTitle", "Highlighted headline", "Turning Up the Volume.")}
                </div>
                {rich("content.hero.intro", "Partnership introduction", content.hero.intro, 6)}
                {text("content.hero.showHeading", "Radio show heading")}
                {rich("content.hero.showDetails", "Radio show details", content.hero.showDetails, 6)}
                {rich("content.hero.closing", "Closing event copy", content.hero.closing, 3)}
                {text("content.hero.capacity", "Capacity or signup note")}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {text("content.hero.waitlistCta", "Waitlist button label")}
                    {text("content.hero.pressCta", "Press button label")}
                    {text("content.hero.pressHref", "Press link", "/press")}
                    {text("content.hero.audioCta", "Audio button label")}
                </div>
            </Section>

            <Section title="2. Behind the scenes" description="Gallery introduction and image order.">
                <div className="grid gap-4 sm:grid-cols-2">
                    {text("content.gallery.eyebrow", "Gallery eyebrow")}
                    {text("content.gallery.title", "Gallery heading")}
                </div>
                <div className="space-y-4">
                    {content.gallery.images.map((image, index) => (
                        <div key={index} className="grid gap-4 md:grid-cols-[1fr_auto]">
                            <ImageField pageId={initialData?.id} label={`Gallery image ${index + 1}`} {...image} onChange={(next) => setImage(`content.gallery.images.${index}` as FieldPath<CreatePartnershipInput>, next)} />
                            <Button type="button" variant="ghost" aria-label={`Remove gallery image ${index + 1}`} className="self-start" onClick={() => setValue("content.gallery.images", content.gallery.images.filter((_, itemIndex) => itemIndex !== index), { shouldDirty: true })}><Trash2 className="mr-2 h-4 w-4" />Remove</Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => setValue("content.gallery.images", [...content.gallery.images, { src: "", alt: "" }], { shouldDirty: true })}><Plus className="mr-2 h-4 w-4" />Add gallery image</Button>
                </div>
            </Section>

            <Section title="3. Event and waitlist" description="Flyer, event facts, form labels and consent wording.">
                <ImageField pageId={initialData?.id} label="Event flyer" {...content.event.flyer} onChange={(next) => setImage("content.event.flyer", next)} />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {text("content.event.badge", "Event badge")}
                    {text("content.event.title", "Event title")}
                    {text("content.event.accentTitle", "Highlighted event title")}
                    {text("content.event.subtitle", "Event subtitle")}
                    {text("content.event.fullNameLabel", "Name field label")}
                    {text("content.event.fullNamePlaceholder", "Name placeholder")}
                    {text("content.event.emailLabel", "Email field label")}
                    {text("content.event.emailPlaceholder", "Email placeholder")}
                    {text("content.event.submitLabel", "Submit button label")}
                    {text("content.event.successTitle", "Success title")}
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                    {content.event.facts.map((fact, index) => (
                        <div key={index} className="space-y-3 rounded-2xl border border-border/50 p-4">
                            <TextField id={`event-fact-${index}-label`} label={`Fact ${index + 1} label`} name={`content.event.facts.${index}.label` as FieldPath<CreatePartnershipInput>} register={register} />
                            <div className="space-y-2">
                                <label htmlFor={`event-fact-${index}-value`} className="text-sm font-bold text-[#141827]">Fact {index + 1} details</label>
                                <Textarea id={`event-fact-${index}-value`} rows={3} {...register(`content.event.facts.${index}.value` as FieldPath<CreatePartnershipInput>)} />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="space-y-2">
                    <label htmlFor="event-tags" className="text-sm font-bold text-[#141827]">Event tags</label>
                    <Textarea id="event-tags" rows={2} value={content.event.tags.join("\n")} onChange={(event) => setValue("content.event.tags", event.target.value.split("\n").slice(0, 8), { shouldDirty: true })} placeholder="One tag per line" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="event-consent" className="text-sm font-bold text-[#141827]">Optional marketing consent copy</label>
                    <Textarea id="event-consent" rows={3} {...register("content.event.consent")} />
                    <p className="text-xs text-zinc-500">The checkbox stays optional. This wording does not replace a legal consent review.</p>
                </div>
                <div className="space-y-2">
                    <label htmlFor="event-success-message" className="text-sm font-bold text-[#141827]">Waitlist confirmation message</label>
                    <Textarea id="event-success-message" rows={2} {...register("content.event.successMessage")} />
                </div>
            </Section>

            <Section title="4. Social links" description="The Instagram, X and Facebook destinations.">
                <div className="grid gap-4 sm:grid-cols-2">
                    {text("content.socials.eyebrow", "Social eyebrow")}
                    {text("content.socials.title", "Social heading")}
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {content.socials.links.map((link, index) => (
                        <div key={link.platform} className="space-y-3 rounded-2xl border border-border/50 p-4">
                            <p className="text-sm font-bold capitalize text-[#141827]">{link.platform === "twitter" ? "X (Twitter)" : link.platform}</p>
                            <TextField id={`social-${index}-label`} label="Accessible link label" name={`content.socials.links.${index}.label` as FieldPath<CreatePartnershipInput>} register={register} />
                            <TextField id={`social-${index}-href`} label="Profile URL" name={`content.socials.links.${index}.href` as FieldPath<CreatePartnershipInput>} register={register} placeholder="https://…" />
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="5. Closing banner" description="The fixed final banner.">
                <div className="grid gap-4 sm:grid-cols-2">
                    {text("content.closing.badge", "Banner badge")}
                    {text("content.closing.title", "Banner heading")}
                </div>
                <div className="space-y-2">
                    <label htmlFor="closing-body" className="text-sm font-bold text-[#141827]">Banner copy</label>
                    <Textarea id="closing-body" rows={3} {...register("content.closing.body")} />
                </div>
            </Section>

            <Section title="Audio player" description="The label and copy above the linked partnership mixes.">
                <div className="grid gap-4 sm:grid-cols-2">
                    {text("content.audio.showName", "Show name")}
                    {text("content.audio.brandName", "Audio brand name")}
                    {text("content.audio.eyebrow", "Dialog eyebrow")}
                    {text("content.audio.footer", "Dialog footer")}
                </div>
                <div className="space-y-2">
                    <label htmlFor="audio-description" className="text-sm font-bold text-[#141827]">Dialog description</label>
                    <Textarea id="audio-description" rows={2} {...register("content.audio.description")} />
                </div>
            </Section>

            {serverError && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{serverError}</p>}
            </fieldset>
            </form>
            {initialData && <PartnershipEpisodeManager pageId={initialData.id} />}
            <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/50 bg-white/95 p-3 backdrop-blur">
                <div><p className="text-xs font-semibold text-zinc-700">{savedLabel}</p><p className="mt-1 text-xs text-zinc-500">{savedStatus === "published" ? isPublished ? "Live changes take effect as soon as they are saved." : "Saving will take this page offline." : isPublished ? "Publishing makes this page available on the public website." : initialData ? "Saving keeps this page in its selected publishing status." : "Save a draft before uploading images or DJ mixes."}</p></div>
                <Button type="submit" form={pageFormId} disabled={isSaving} className="min-w-40"><Save className="mr-2 h-4 w-4" />{isSaving ? "Saving…" : saveLabel}</Button>
            </div>
        </div>
    );
}
