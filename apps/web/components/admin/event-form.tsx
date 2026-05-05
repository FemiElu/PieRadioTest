"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Loader2, Image as ImageIcon, MapPin, Calendar, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NewsImageUploader } from "./news-image-uploader";
import { CreateEventSchema, type CreateEventInput } from "@/lib/events/schema";
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS, type Event } from "@/lib/events/types";

interface EventFormProps {
    initialData?: Event;
}

export function EventForm({ initialData }: EventFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const isEditing = !!initialData;

    const defaultValues: CreateEventInput = {
        title: initialData?.title || "",
        artist_name: initialData?.artist_name || "",
        description: initialData?.description || "",
        category: initialData?.category || "general",
        status: initialData?.status || "upcoming",
        start_time: initialData?.start_time ? new Date(initialData.start_time).toISOString().slice(0, 16) : "",
        end_time: initialData?.end_time ? new Date(initialData.end_time).toISOString().slice(0, 16) : null,
        venue_name: initialData?.venue_name || "",
        venue_address: initialData?.venue_address || "",
        venue_city: initialData?.venue_city || "",
        price_min: initialData?.price_min || 0,
        price_max: initialData?.price_max || null,
        ticket_url: initialData?.ticket_url || "",
        cover_image_url: initialData?.cover_image_url || "",
        external_url: initialData?.external_url || "",
        is_featured: initialData?.is_featured || false,
    };

    const form = useForm<CreateEventInput>({
        resolver: zodResolver(CreateEventSchema) as Resolver<CreateEventInput>,
        defaultValues,
    });

    const { control, handleSubmit, register, watch, formState: { errors } } = form;

    const onSubmit = async (data: CreateEventInput) => {
        setIsSubmitting(true);
        setServerError(null);

        // Convert the datetime-local values back to true ISO strings
        const submissionData = {
            ...data,
            start_time: new Date(data.start_time).toISOString(),
            end_time: data.end_time ? new Date(data.end_time).toISOString() : null,
        };

        const url = isEditing
            ? `/api/admin/events/${initialData.id}`
            : "/api/admin/events";
        const method = isEditing ? "PATCH" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submissionData),
            });

            const responseData = await res.json();

            if (!res.ok) {
                throw new Error(responseData.error || "Failed to save event");
            }

            router.push("/admin/events");
            router.refresh();
        } catch (err: any) {
            setServerError(err.message || "An error occurred");
            window.scrollTo({ top: 0, behavior: "smooth" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-10 pb-20">
            {serverError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl font-bold flex gap-3 text-sm items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    {serverError}
                </div>
            )}

            {/* Section 1: General Info */}
            <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6 sm:p-8 flex flex-col gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 flex items-center justify-end">
                    <div className="flex bg-zinc-100 rounded-xl p-1 shadow-inner border border-zinc-200">
                        {(["upcoming", "cancelled"] as const).map((s) => (
                            <label
                                key={s}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2",
                                    watch("status") === s
                                        ? "bg-white text-primary shadow-sm border border-border/50"
                                        : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
                                )}
                            >
                                <input
                                    type="radio"
                                    {...register("status")}
                                    value={s}
                                    className="sr-only"
                                />
                                {s === "upcoming" && watch("status") === s && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                )}
                                {s}
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold font-display text-[#141827]">
                        General Information
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">
                        Core details about the event.
                    </p>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#141827]">
                                Event Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                {...register("title")}
                                placeholder="e.g. Summer Jam 2026"
                                className={cn(
                                    "h-12 bg-zinc-50 border rounded-xl px-4 text-sm font-medium outline-none transition-all placeholder:text-zinc-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10",
                                    errors.title ? "border-red-500" : "border-border/50 hover:border-zinc-300"
                                )}
                            />
                            {errors.title && (
                                <span className="text-red-500 text-xs font-bold mt-1">{errors.title.message}</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#141827]">
                                Performing Artist
                            </label>
                            <input
                                type="text"
                                {...register("artist_name")}
                                placeholder="e.g. Various Artists"
                                className="h-12 bg-zinc-50 border border-border/50 hover:border-zinc-300 rounded-xl px-4 text-sm font-medium outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#141827]">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register("category")}
                                className={cn(
                                    "h-12 bg-zinc-50 border rounded-xl px-4 text-sm font-medium outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10",
                                    errors.category ? "border-red-500" : "border-border/50 hover:border-zinc-300"
                                )}
                            >
                                {EVENT_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {EVENT_CATEGORY_LABELS[cat]}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-3 mt-6">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={cn(
                                    "w-12 h-6 rounded-full transition-colors relative flex items-center px-1 shadow-inner",
                                    watch("is_featured") ? "bg-primary" : "bg-zinc-300"
                                )}>
                                    <div className={cn(
                                        "w-4 h-4 rounded-full bg-white shadow-md transition-transform",
                                        watch("is_featured") ? "translate-x-6" : "translate-x-0"
                                    )} />
                                </div>
                                <input type="checkbox" {...register("is_featured")} className="hidden" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-[#141827]">Featured Event</span>
                                    <span className="text-xs text-zinc-500">Will appear in the homepage carousel.</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[#141827]">
                            Description
                        </label>
                        <textarea
                            {...register("description")}
                            rows={5}
                            placeholder="Tell users about the event..."
                            className="bg-zinc-50 border border-border/50 hover:border-zinc-300 rounded-xl p-4 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Section 2: Date & Venue */}
            <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6 sm:p-8 flex flex-col gap-8">
                <div>
                    <h2 className="text-xl font-bold font-display text-[#141827] flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Date & Venue
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">
                        When and where is the event happening?
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#141827]">
                                Start Date & Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                {...register("start_time")}
                                className={cn(
                                    "h-12 bg-zinc-50 border rounded-xl px-4 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10",
                                    errors.start_time ? "border-red-500" : "border-border/50 hover:border-zinc-300"
                                )}
                            />
                            {errors.start_time && (
                                <span className="text-red-500 text-xs font-bold mt-1">{errors.start_time.message}</span>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#141827]">
                                End Date & Time (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                {...register("end_time")}
                                className={cn(
                                    "h-12 bg-zinc-50 border rounded-xl px-4 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10",
                                    errors.end_time ? "border-red-500" : "border-border/50 hover:border-zinc-300"
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#141827]">
                                Venue Name
                            </label>
                            <input
                                type="text"
                                {...register("venue_name")}
                                placeholder="e.g. O2 Ritz Manchester"
                                className="h-12 bg-zinc-50 border border-border/50 hover:border-zinc-300 rounded-xl px-4 text-sm font-medium outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-[#141827]">City</label>
                                <input
                                    type="text"
                                    {...register("venue_city")}
                                    placeholder="Manchester"
                                    className="h-12 bg-zinc-50 border border-border/50 hover:border-zinc-300 rounded-xl px-4 text-sm font-medium outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-[#141827]">Address</label>
                                <input
                                    type="text"
                                    {...register("venue_address")}
                                    placeholder="Whitworth St West"
                                    className="h-12 bg-zinc-50 border border-border/50 hover:border-zinc-300 rounded-xl px-4 text-sm font-medium outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Tickets & Media */}
            <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6 sm:p-8 flex flex-col gap-8">
                <div>
                    <h2 className="text-xl font-bold font-display text-[#141827] flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-primary" />
                        Tickets & Media
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">
                        How do people join and what does it look like?
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-[#141827]">Min Price (£)</label>
                                <input
                                    type="number"
                                    {...register("price_min")}
                                    className="h-12 bg-zinc-50 border border-border/50 hover:border-zinc-300 rounded-xl px-4 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-[#141827]">Max Price (£)</label>
                                <input
                                    type="number"
                                    {...register("price_max")}
                                    className="h-12 bg-zinc-50 border border-border/50 hover:border-zinc-300 rounded-xl px-4 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#141827]">
                                External Ticket URL
                            </label>
                            <input
                                type="url"
                                {...register("ticket_url")}
                                placeholder="https://www.skiddle.com/events/..."
                                className={cn(
                                    "h-12 bg-zinc-50 border rounded-xl px-4 text-sm font-mono outline-none transition-all placeholder:text-zinc-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10",
                                    errors.ticket_url ? "border-red-500" : "border-border/50 hover:border-zinc-300"
                                )}
                            />
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Users will be redirected here when they click &quot;Get Tickets&quot;.</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#141827]">
                                More Details URL (Optional)
                            </label>
                            <input
                                type="url"
                                {...register("external_url")}
                                placeholder="https://example.com/more-info"
                                className={cn(
                                    "h-12 bg-zinc-50 border rounded-xl px-4 text-sm font-mono outline-none transition-all placeholder:text-zinc-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10",
                                    errors.external_url ? "border-red-500" : "border-border/50 hover:border-zinc-300"
                                )}
                            />
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">A link for users to find more information about the event.</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[#141827] flex items-center gap-2 mb-2">
                            <ImageIcon className="w-4 h-4 text-zinc-400" />
                            Cover Image
                        </label>
                        <Controller
                            name="cover_image_url"
                            control={control}
                            render={({ field }) => (
                                <NewsImageUploader
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 border-t border-border/50 pt-8 mt-2 sticky bottom-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.05)] border z-10">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                    className="h-12 px-6 rounded-xl font-bold bg-white"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 px-8 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
                >
                    {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    {isEditing ? "Save Changes" : "Create Event"}
                </Button>
            </div>
        </form>
    );
}
