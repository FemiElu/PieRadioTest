import { EventForm } from "@/components/admin/event-form";

export const metadata = {
    title: "New Event | Admin",
};

export default function NewEventPage() {
    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
            <div>
                <h1 className="text-3xl font-black font-display tracking-tight text-[#141827]">
                    Create New Event
                </h1>
                <p className="text-zinc-500 mt-1">
                    Add a new event to the Pie Radio platform.
                </p>
            </div>

            <EventForm />
        </div>
    );
}
