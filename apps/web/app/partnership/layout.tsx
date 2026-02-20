import type { Metadata } from "next";
import "./partnership.css";

export const metadata: Metadata = {
    title: "Pie Radio × Popeyes — Turning Up the Flavor",
    description:
        "Pie Radio is proud to partner with Popeyes Louisiana Kitchen. This exciting collaboration blends bold, Louisiana-inspired flavor with great sound. Join the waitlist for exclusive access.",
    openGraph: {
        title: "Pie Radio × Popeyes — Turning Up the Flavor",
        description:
            "Bold flavor meets bold sound. Join the waitlist for exclusive access to branded promos, curated playlists, giveaways, and live activations.",
        type: "website",
    },
};

export default function PartnershipLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <article className="partnership-page">
            {children}
        </article>
    );
}
