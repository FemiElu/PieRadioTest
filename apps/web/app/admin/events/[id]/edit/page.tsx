import { createClient } from "@/lib/supabase/server";
import { getEventById } from "@/lib/events/queries";
import { EventForm } from "@/components/admin/event-form";
import { notFound } from "next/navigation";

export const metadata = {
    title: "Edit Event | Admin",
};

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;
    const event = await getEventById(supabase, id);

    if (!event) {
        notFound();
    }

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
            <div>
                <h1 className="text-3xl font-black font-display tracking-tight text-[#141827]">
                    Edit Event
                </h1>
                <p className="text-zinc-500 mt-1">
                    Update the details for &quot;{event.title}&quot;.
                </p>
            </div>

            <EventForm initialData={event} />
        </div>
    );
}
