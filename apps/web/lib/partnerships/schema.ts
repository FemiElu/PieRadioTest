import { z } from "zod";

const contentHrefSchema = z.string().max(2_048).refine((value) => {
    if (value.trim() === "") return true;
    if (value.startsWith("/") && !value.startsWith("//")) return true;
    try {
        return ["https:", "http:"].includes(new URL(value).protocol);
    } catch {
        return false;
    }
}, "Use a local path or an HTTP(S) URL");

const assetSchema = z.object({
    src: contentHrefSchema,
    alt: z.string().max(300).default(""),
});

const textSchema = (max = 5_000) => z.string().max(max);

export const PartnershipContentSchema = z.object({
    hero: z.object({
        background: assetSchema,
        stationLogo: assetSchema,
        partnerLogo: assetSchema,
        title: z.string().min(1).max(120),
        accentTitle: z.string().min(1).max(120),
        intro: textSchema(),
        showHeading: textSchema(200),
        showDetails: textSchema(),
        closing: textSchema(),
        capacity: textSchema(500),
        waitlistCta: z.string().min(1).max(80),
        pressCta: z.string().min(1).max(80),
        pressHref: z.string().min(1).pipe(contentHrefSchema),
        audioCta: z.string().min(1).max(80),
    }),
    gallery: z.object({
        eyebrow: textSchema(120),
        title: z.string().min(1).max(120),
        images: z.array(assetSchema).max(12),
    }),
    event: z.object({
        flyer: assetSchema,
        badge: textSchema(120),
        title: z.string().min(1).max(120),
        accentTitle: textSchema(120),
        subtitle: textSchema(300),
        tags: z.array(textSchema(80)).max(8),
        facts: z.array(z.object({
            label: z.string().min(1).max(100),
            value: textSchema(500),
        })).length(3),
        fullNameLabel: z.string().min(1).max(100),
        fullNamePlaceholder: textSchema(120),
        emailLabel: z.string().min(1).max(100),
        emailPlaceholder: textSchema(120),
        consent: textSchema(500),
        submitLabel: z.string().min(1).max(80),
        successTitle: z.string().min(1).max(120),
        successMessage: textSchema(500),
    }),
    socials: z.object({
        eyebrow: textSchema(120),
        title: z.string().min(1).max(120),
        links: z.array(z.object({
            platform: z.enum(["instagram", "twitter", "facebook"]),
            label: z.string().min(1).max(100),
            href: contentHrefSchema,
        })).length(3),
    }),
    closing: z.object({
        badge: textSchema(120),
        title: z.string().min(1).max(160),
        body: textSchema(800),
    }),
    audio: z.object({
        showName: z.string().min(1).max(120),
        brandName: z.string().min(1).max(120),
        description: textSchema(500),
        eyebrow: textSchema(120),
        footer: textSchema(120),
    }),
});

export type PartnershipContent = z.infer<typeof PartnershipContentSchema>;

const PartnershipStatusSchema = z.enum(["draft", "published", "archived"]);

export const CreatePartnershipSchema = z.object({
    slug: z.string().min(3).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(3).max(200),
    brand_name: z.string().min(1).max(120),
    description: textSchema(500),
    social_image_url: contentHrefSchema,
    status: PartnershipStatusSchema.default("draft"),
    content: PartnershipContentSchema,
});

export const UpdatePartnershipSchema = CreatePartnershipSchema.extend({
    // PostgREST timestamps include offsets and can have microsecond precision.
    // Keep the original value intact: it is the optimistic concurrency token.
    updated_at: z.string().datetime({ offset: true }),
});

export type CreatePartnershipInput = z.infer<typeof CreatePartnershipSchema>;
export type UpdatePartnershipInput = z.infer<typeof UpdatePartnershipSchema>;
