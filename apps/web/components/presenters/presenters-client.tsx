"use client";

import { useState } from "react";
import { PresenterGrid, Presenter, PRESENTER_CATEGORIES } from "@/components/presenters/presenter-grid";

interface PresentersClientProps {
    initialPresenters: Presenter[];
}

export function PresentersClient({ initialPresenters }: PresentersClientProps) {
    const [selectedCategory, setSelectedCategory] = useState("all");

    return (
        <PresenterGrid
            presenters={initialPresenters}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
        />
    );
}
