"use client";

import { useState, useTransition } from "react";
import { PresenterGrid, Presenter } from "@/components/presenters/presenter-grid";

interface PresentersClientProps {
    initialPresenters: Presenter[];
    executives?: Presenter[];
    seniorLeadership?: Presenter[];
}

export function PresentersClient({ initialPresenters, executives = [], seniorLeadership = [] }: PresentersClientProps) {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [, startTransition] = useTransition();

    const handleCategoryChange = (category: string) => {
        startTransition(() => {
            setSelectedCategory(category);
        });
    };

    return (
        <div className="space-y-20">
            {/* Main Presenters */}
            <section>
                <h2 className="text-3xl font-bold font-display tracking-tight text-foreground mb-8 text-center md:text-left">
                    Meet our Presenters
                </h2>
                <PresenterGrid
                    presenters={initialPresenters}
                    selectedCategory={selectedCategory}
                    onCategoryChange={handleCategoryChange}
                />
            </section>

            {/* Senior Leadership Team */}
            {seniorLeadership && seniorLeadership.length > 0 && (
                <section>
                    <h2 className="text-3xl font-bold font-display tracking-tight text-foreground mb-8 text-center md:text-left">
                        Meet our Senior Leadership Team
                    </h2>
                    <PresenterGrid
                        presenters={seniorLeadership}
                        clickable={false}
                    />
                </section>
            )}

            {/* Executive Leadership Team */}
            {executives && executives.length > 0 && (
                <section>
                    <h2 className="text-3xl font-bold font-display tracking-tight text-foreground mb-8 text-center md:text-left">
                        Meet our Executive Leadership Team
                    </h2>
                    <PresenterGrid
                        presenters={executives}
                        clickable={false}
                    />
                </section>
            )}
        </div>
    );
}
