"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_PARTNERSHIP_THEME } from "@/lib/partnerships/schema";
import type { PartnershipContent } from "@/lib/partnerships/schema";

type PartnershipTheme = PartnershipContent["theme"];
type ThemeKey = keyof PartnershipTheme;

const fields: { key: ThemeKey; label: string; description: string }[] = [
    { key: "pageBackground", label: "Page section background", description: "The event and waitlist section background." },
    { key: "galleryBackground", label: "Gallery background", description: "The photo gallery section background." },
    { key: "galleryHeadingColor", label: "Gallery heading color", description: "Gallery headings and its empty state." },
    { key: "galleryBodyColor", label: "Gallery body text color", description: "Gallery labels and supporting text." },
    { key: "surfaceBackground", label: "Card background", description: "The event fact cards and social section." },
    { key: "headingColor", label: "Heading color", description: "Headings on light sections." },
    { key: "bodyColor", label: "Body text color", description: "Main copy on light sections." },
    { key: "brandColor", label: "Brand color", description: "Highlights, links, and brand accents." },
    { key: "accentColor", label: "Secondary accent", description: "The closing banner gradient." },
    { key: "ctaBackground", label: "Button background", description: "Primary calls to action." },
    { key: "ctaText", label: "Button text", description: "Text shown on primary buttons." },
];

const palettes: { name: string; theme: PartnershipTheme }[] = [
    { name: "Popeyes", theme: DEFAULT_PARTNERSHIP_THEME },
    {
        name: "Neutral", theme: {
            pageBackground: "#F4F4F2", galleryBackground: "#292524", galleryHeadingColor: "#FFFFFF", galleryBodyColor: "#E7E5E4", surfaceBackground: "#FFFFFF", headingColor: "#202020", bodyColor: "#343434",
            brandColor: "#4B5563", accentColor: "#78716C", ctaBackground: "#292524", ctaText: "#FFFFFF",
        },
    },
    {
        name: "Ocean", theme: {
            pageBackground: "#EFF8FB", galleryBackground: "#102A43", galleryHeadingColor: "#FFFFFF", galleryBodyColor: "#E0F2FE", surfaceBackground: "#FFFFFF", headingColor: "#102A43", bodyColor: "#243B53",
            brandColor: "#087E8B", accentColor: "#145DA0", ctaBackground: "#145DA0", ctaText: "#FFFFFF",
        },
    },
];

function luminance(hex: string): number {
    const channels = hex.slice(1).match(/.{2}/g)?.map((channel) => parseInt(channel, 16) / 255) ?? [0, 0, 0];
    const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground: string, background: string): number {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
}

const isHexColor = (value: string): boolean => /^#[\da-fA-F]{6}$/.test(value);

export function PartnershipThemeEditor({ theme, onChange }: {
    theme: PartnershipTheme;
    onChange: (key: ThemeKey, value: string) => void;
}) {
    const safeTheme = Object.fromEntries(fields.map(({ key }) => [key, isHexColor(theme[key]) ? theme[key] : DEFAULT_PARTNERSHIP_THEME[key]])) as PartnershipTheme;
    const contrastChecks: [string, string, string][] = [
        ["Page heading on event background", safeTheme.headingColor, safeTheme.pageBackground],
        ["Body text on event background", safeTheme.bodyColor, safeTheme.pageBackground],
        ["Page heading on cards", safeTheme.headingColor, safeTheme.surfaceBackground],
        ["Body text on cards", safeTheme.bodyColor, safeTheme.surfaceBackground],
        ["Brand highlights on event background", safeTheme.brandColor, safeTheme.pageBackground],
        ["Brand highlights on cards", safeTheme.brandColor, safeTheme.surfaceBackground],
        ["Gallery heading on gallery background", safeTheme.galleryHeadingColor, safeTheme.galleryBackground],
        ["Gallery body text on gallery background", safeTheme.galleryBodyColor, safeTheme.galleryBackground],
        ["Brand highlights on gallery background", safeTheme.brandColor, safeTheme.galleryBackground],
        ["Brand highlight over hero dark overlay (approximate)", safeTheme.brandColor, "#222222"],
        ["Secondary accent on event background", safeTheme.accentColor, safeTheme.pageBackground],
        ["Secondary accent on cards", safeTheme.accentColor, safeTheme.surfaceBackground],
        ["Event tag text on accent background", safeTheme.ctaText, safeTheme.accentColor],
        ["Button text on button background", safeTheme.ctaText, safeTheme.ctaBackground],
        ["Social link hover text on brand background", safeTheme.ctaText, safeTheme.brandColor],
        ["Closing banner text on brand gradient stop", "#FFFFFF", safeTheme.brandColor],
        ["Closing banner text on accent gradient stop", "#FFFFFF", safeTheme.accentColor],
    ];
    const warnings = contrastChecks.filter(([, foreground, background]) => contrastRatio(foreground, background) < 4.5);

    const applyPalette = (name: string) => {
        const selected = palettes.find((palette) => palette.name === name);
        if (selected) fields.forEach(({ key }) => onChange(key, selected.theme[key]));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-48 flex-1 space-y-2">
                    <label htmlFor="partnership-theme-preset" className="text-sm font-bold text-[#141827]">Start with a palette</label>
                    <select id="partnership-theme-preset" defaultValue="" onChange={(event) => applyPalette(event.target.value)} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm">
                        <option value="" disabled>Choose a palette</option>
                        {palettes.map((palette) => <option key={palette.name} value={palette.name}>{palette.name}</option>)}
                    </select>
                </div>
                <Button type="button" variant="outline" onClick={() => fields.forEach(({ key }) => onChange(key, DEFAULT_PARTNERSHIP_THEME[key]))}>Reset to Popeyes colors</Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {fields.map(({ key, label, description }) => {
                    const id = `partnership-theme-${key}`;
                    const value = theme[key];
                    const valid = isHexColor(value);
                    return <div key={key} className="space-y-2 rounded-2xl border border-border/50 p-4">
                        <label htmlFor={id} className="block text-sm font-bold text-[#141827]">{label}</label>
                        <p id={`${id}-description`} className="text-xs text-zinc-500">{description}</p>
                        <div className="flex items-center gap-3">
                            <input aria-label={`${label} color picker`} type="color" value={valid ? value : DEFAULT_PARTNERSHIP_THEME[key]} onChange={(event) => onChange(key, event.target.value.toUpperCase())} className="h-10 w-12 cursor-pointer rounded border border-input bg-white p-1" />
                            <Input id={id} value={value} aria-describedby={`${id}-description${valid ? "" : ` ${id}-error`}`} aria-invalid={!valid} onChange={(event) => onChange(key, event.target.value)} placeholder="#FF6A00" autoCapitalize="characters" spellCheck={false} />
                        </div>
                        {!valid && <p id={`${id}-error`} role="alert" className="text-xs text-red-700">Enter a six-digit hex color, such as #FF6A00.</p>}
                    </div>;
                })}
            </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,.8fr)]">
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-[#141827]">Live preview</h3>
                    <div className="space-y-3 rounded-2xl border p-4 sm:p-5" style={{ backgroundColor: safeTheme.pageBackground, color: safeTheme.bodyColor }}>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: safeTheme.brandColor }}>Partner showcase</p>
                        <h4 className="mt-2 text-xl font-black" style={{ color: safeTheme.headingColor }}>Your brand, on the air</h4>
                        <p className="mt-1 text-sm">A quick look at headings, copy, and calls to action.</p>
                        <div className="mt-4 rounded-xl p-3" style={{ backgroundColor: safeTheme.surfaceBackground }}>
                            <p className="text-xs font-bold uppercase" style={{ color: safeTheme.accentColor }}>Event details</p>
                            <p className="mt-1 text-sm" style={{ color: safeTheme.headingColor }}>Live music · Great company</p>
                        </div>
                        <button type="button" tabIndex={-1} className="mt-4 rounded-lg px-4 py-2 text-sm font-bold" style={{ backgroundColor: safeTheme.ctaBackground, color: safeTheme.ctaText }}>Join the waitlist</button>
                    </div>
                    <div className="rounded-2xl border p-4 sm:p-5" style={{ backgroundColor: safeTheme.galleryBackground, color: safeTheme.galleryBodyColor }}>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: safeTheme.brandColor }}>Gallery section</p>
                        <h4 className="mt-2 text-lg font-black" style={{ color: safeTheme.galleryHeadingColor }}>A look behind the scenes</h4>
                        <p className="mt-1 text-sm">Supporting text over the gallery background.</p>
                    </div>
                </div>
                <div className="space-y-2" aria-live="polite">
                    <h3 className="text-sm font-bold text-[#141827]">Text contrast</h3>
                    {warnings.length === 0
                        ? <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">Checked text combinations meet the 4.5:1 contrast guideline.</p>
                        : <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950"><p className="font-semibold">Some text combinations may be difficult to read:</p><ul className="mt-1 list-inside list-disc">{warnings.map(([label]) => <li key={label}>{label} is below 4.5:1.</li>)}</ul></div>}
                    <p className="text-xs text-zinc-500">The hero uses a dark overlay, but contrast cannot be measured against a photo here. Check each selected hero image for readability.</p>
                </div>
            </div>
        </div>
    );
}
