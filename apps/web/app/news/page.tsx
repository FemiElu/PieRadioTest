"use client";

import { Newspaper } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function NewsPage() {
    return (
        <ComingSoon
            title="The Latest from "
            subtitle="Pie Radio News"
            icon={Newspaper}
            description="Our brand new news portal will be coming soon. Check back soon for the latest in music, culture, and station updates from across the city."
            badge="Coming Soon"
        />
    );
}
