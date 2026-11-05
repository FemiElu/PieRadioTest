import type { CreatePartnershipInput } from "@/lib/partnerships/schema";

export function createDefaultPartnership(): CreatePartnershipInput {
    return {
        slug: "new-partnership",
        title: "New partnership",
        brand_name: "Partner brand",
        description: "",
        social_image_url: "",
        status: "draft",
        content: {
            hero: {
                background: { src: "", alt: "" },
                stationLogo: { src: "/assets/logo.png", alt: "Pie Radio logo" },
                partnerLogo: { src: "", alt: "" },
                title: "A Pie Radio partnership",
                accentTitle: "Brand collaboration",
                intro: "Add the partnership introduction here.",
                showHeading: "Featured radio show",
                showDetails: "Add the show schedule, presenters and details here.",
                closing: "Add details about the final event or collaboration here.",
                capacity: "",
                waitlistCta: "Join the Waitlist",
                pressCta: "See Press Release",
                pressHref: "/press",
                audioCta: "Listen to the Show",
            },
            gallery: { eyebrow: "Sneak Peek", title: "Behind the Scenes", images: [] },
            event: {
                flyer: { src: "", alt: "" },
                badge: "Exclusive Event",
                title: "Partner",
                accentTitle: "Event",
                subtitle: "Pie Radio · Exclusive Live Event",
                tags: ["Live DJ sets", "Special guests"],
                facts: [
                    { label: "Venue", value: "Add venue details" },
                    { label: "Date & Time", value: "Add date and time" },
                    { label: "Entry", value: "Add ticket or entry details" },
                ],
                fullNameLabel: "Full name",
                fullNamePlaceholder: "Your name",
                emailLabel: "Email address",
                emailPlaceholder: "you@example.com",
                consent: "I agree to receive updates about this event.",
                submitLabel: "Join the Waitlist",
                successTitle: "You’re in!",
                successMessage: "We’ll send event updates to your email.",
            },
            socials: {
                eyebrow: "Follow the vibe",
                title: "Stay Connected",
                links: [
                    { platform: "instagram", label: "Instagram", href: "" },
                    { platform: "twitter", label: "X (Twitter)", href: "" },
                    { platform: "facebook", label: "Facebook", href: "" },
                ],
            },
            closing: {
                badge: "Coming Soon",
                title: "Something is on the way",
                body: "Add the closing message for this partnership.",
            },
            audio: {
                showName: "Partner Radio Show",
                brandName: "Partner brand",
                description: "Listen back to the latest episodes of our sponsored show.",
                eyebrow: "Partner Spotlight",
                footer: "Powered by Pie Radio",
            },
        },
    };
}

export function getPartnershipPublishIssues(input: CreatePartnershipInput): string[] {
    const c = input.content;
    const issues: string[] = [];
    const images = [c.hero.background, c.hero.stationLogo, c.hero.partnerLogo, c.event.flyer, ...c.gallery.images];
    if (images.some((image) => !image.src.trim() || !image.alt.trim())) {
        issues.push("Upload every required image and add descriptive alt text before publishing.");
    }
    if (c.gallery.images.length === 0) issues.push("Add at least one gallery image before publishing.");
    if ([c.hero.intro, c.hero.showDetails, c.event.subtitle, c.event.consent, c.closing.body].some((value) => !value.trim())) {
        issues.push("Complete the partnership, show, event, consent and closing copy before publishing.");
    }
    if (c.event.facts.some((fact) => !fact.label.trim() || !fact.value.trim())) {
        issues.push("Complete all three event details before publishing.");
    }
    if (c.socials.links.some((link) => !link.href.trim())) {
        issues.push("Add an approved social link for Instagram, X and Facebook before publishing.");
    }
    return issues;
}

export function isPartnershipReadyToPublish(input: CreatePartnershipInput): string | null {
    return getPartnershipPublishIssues(input)[0] ?? null;
}
