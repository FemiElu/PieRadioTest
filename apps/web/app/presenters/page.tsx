import { createClient } from "@/lib/supabase/server";
import { PresenterGrid } from "../../components/presenters/presenter-grid";
import { Mic2 } from "lucide-react";

export const revalidate = 3600; // Revalidate every hour

export default async function PresentersPage() {
    const supabase = await createClient();

    // Fetch users with 'presenter' role
    const { data: presenters, error } = await supabase
        .from("profiles")
        .select(`
            *,
            presenter_meta (*)
        `)
        .eq("role", "presenter")
        .order("full_name");

    if (error) {
        console.error("Error fetching presenters", error);
        return <div className="p-12 text-center">Error loading presenters.</div>;
    }

    return (
        <div className="flex flex-col w-full">
            {/* Page Header */}
            <section className="bg-[#141827] text-white pt-24 pb-16">
                <div className="container px-4 md:px-8 max-w-screen-2xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary-foreground text-xs font-bold uppercase tracking-wider">
                                <Mic2 className="w-3 h-3" />
                                On Air Talent
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold font-display tracking-tight leading-tight">
                                Meet Your <span className="text-primary italic">Presenters</span>
                            </h1>
                            <p className="text-lg text-zinc-400 font-medium">
                                The voices behind your favorite shows, spinning the freshest hits and bringing you the hottest talk.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Presenters Content */}
            <section className="container py-16 px-4 md:px-8 max-w-screen-2xl mx-auto">
                <PresenterGrid presenters={presenters || []} />
            </section>
        </div>
    );
}
