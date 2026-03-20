"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Loader2, Image as ImageIcon, Headphones, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NewsImageUploader } from "./news-image-uploader";
import {
    CreateArticleSchema,
    UpdateArticleSchema,
    type CreateArticleInput,
} from "@/lib/news/schema";
import { NEWS_CATEGORIES, type NewsArticle } from "@/lib/news/types";

interface NewsArticleFormProps {
    initialData?: NewsArticle;
}

export function NewsArticleForm({ initialData }: NewsArticleFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const isEditing = !!initialData;

    const defaultValues: CreateArticleInput = {
        title: initialData?.title || "",
        slug: initialData?.slug || "",
        summary: initialData?.summary || "",
        content: initialData?.content || "",
        category: (initialData?.category as any) || "General",
        tier: initialData?.tier || "update",
        status: initialData?.status || "draft",
        is_breaking: initialData?.is_breaking || false,
        cover_image_url: initialData?.cover_image_url || null,
        audio_preview_url: initialData?.audio_preview_url || null,
        audio_moments: initialData?.audio_moments || [],
    };

    const form = useForm<CreateArticleInput>({
        resolver: zodResolver(CreateArticleSchema) as Resolver<CreateArticleInput>,
        defaultValues,
    });

    const { control, handleSubmit, watch, register, formState: { errors } } = form;

    const { fields: audioMoments, append: appendMoment, remove: removeMoment } = useFieldArray({
        control,
        name: "audio_moments",
    });

    const watchTitle = watch("title");
    const watchHasAudio = watch("audio_preview_url");

    // Auto-generate slug if not editing
    const handleTitleBlur = () => {
        if (isEditing) return;
        const slug = watchTitle
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
        form.setValue("slug", slug, { shouldValidate: true });
    };

    const onSubmit = async (data: CreateArticleInput) => {
        setIsSubmitting(true);
        setServerError(null);

        const url = isEditing
            ? `/api/admin/news/${initialData.id}`
            : "/api/admin/news";
        const method = isEditing ? "PATCH" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const responseData = await res.json();

            if (!res.ok) {
                throw new Error(responseData.error || "Failed to save article");
            }

            router.push("/admin/news");
            router.refresh();
        } catch (err: any) {
            setServerError(err.message || "An error occurred");
            window.scrollTo({ top: 0, behavior: "smooth" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-10">
            {serverError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl font-bold flex gap-3 text-sm items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    {serverError}
                </div>
            )}

            {/* Main Details Section */}
            <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6 sm:p-8 flex flex-col gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 flex items-center justify-end">
                    <div className="flex bg-zinc-100 rounded-xl p-1 shadow-inner border border-zinc-200">
                        {(["draft", "published", "archived"] as const).map((s) => (
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
                                {s === "published" && watch("status") === s && (
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
                        The core details of your news article.
                    </p>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[#141827]">
                            Headline <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            {...register("title", { onBlur: handleTitleBlur })}
                            placeholder="e.g. Manchester Sounds Takes Over..."
                            className={cn(
                                "h-12 bg-zinc-50 border rounded-xl px-4 text-sm font-medium outline-none transition-all placeholder:text-zinc-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10",
                                errors.title ? "border-red-500" : "border-border/50 hover:border-zinc-300"
                            )}
                        />
                        {errors.title && (
                            <span className="text-red-500 text-xs font-bold mt-1">
                                {errors.title.message}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[#141827]">
                            URL Slug <span className="text-red-500">*</span>
                        </label>
                        <div className="flex">
                            <span className="h-12 flex items-center px-4 bg-zinc-100 border border-r-0 border-border/50 text-zinc-500 text-sm font-mono rounded-l-xl">
                                /news/
                            </span>
                            <input
                                type="text"
                                {...register("slug")}
                                placeholder="e.g. manchester-sounds-takes-over"
                                className={cn(
                                    "flex-1 h-12 bg-zinc-50 border rounded-r-xl px-4 text-sm font-mono outline-none transition-all placeholder:text-zinc-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10",
                                    errors.slug ? "border-red-500" : "border-border/50 hover:border-zinc-300"
                                )}
                            />
                        </div>
                        {errors.slug && (
                            <span className="text-red-500 text-xs font-bold mt-1">
                                {errors.slug.message}
                            </span>
                        )}
                        <p className="text-xs text-zinc-500">
                            This is the unique URL for the article. It must be unique across all articles.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#141827]">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register("category")}
                                className="h-12 bg-zinc-50 border border-border/50 rounded-xl px-4 text-sm font-medium outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 hover:border-zinc-300"
                            >
                                <option value="">Select a category...</option>
                                {NEWS_CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-[#141827]">Tier</label>
                            <div className="flex border border-border/50 rounded-xl overflow-hidden shadow-sm h-12">
                                {(["breaking", "trending", "update", "audio", "poll", "sponsor", "archive"] as const).map(
                                    (t) => (
                                        <label
                                            key={t}
                                            className={cn(
                                                "flex-1 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border-r border-border/50 last:border-0",
                                                watch("tier") === t
                                                    ? "bg-primary text-white"
                                                    : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                {...register("tier")}
                                                value={t}
                                                className="sr-only"
                                            />
                                            {t}
                                        </label>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={cn(
                                "w-12 h-6 rounded-full transition-colors relative flex items-center px-1 shadow-inner",
                                watch("is_breaking") ? "bg-red-500" : "bg-zinc-300"
                            )}>
                                <div className={cn(
                                    "w-4 h-4 rounded-full bg-white shadow-md transition-transform",
                                    watch("is_breaking") ? "translate-x-6" : "translate-x-0"
                                )} />
                            </div>
                            <input type="checkbox" {...register("is_breaking")} className="hidden" />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-[#141827]">Mark as Breaking News</span>
                                <span className="text-xs text-zinc-500">Will display prominently at the top of the news feed.</span>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6 sm:p-8 flex flex-col gap-8">
                <div>
                    <h2 className="text-xl font-bold font-display text-[#141827]">
                        Content
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">
                        Write your article content using Markdown formatting.
                    </p>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[#141827]">
                            Short Summary
                        </label>
                        <textarea
                            {...register("summary")}
                            placeholder="A brief 1-2 sentence overview of the article..."
                            rows={2}
                            className={cn(
                                "bg-zinc-50 border rounded-xl p-4 text-sm outline-none transition-all placeholder:text-zinc-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 resize-y",
                                errors.summary ? "border-red-500" : "border-border/50 hover:border-zinc-300"
                            )}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                            <label className="text-sm font-bold text-[#141827]">
                                Article Body (Markdown) <span className="text-red-500">*</span>
                            </label>
                            <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:underline">
                                Markdown Guide
                            </a>
                        </div>
                        <textarea
                            {...register("content")}
                            placeholder="# Introduction\n\nStart writing your article here..."
                            rows={15}
                            className={cn(
                                "bg-zinc-50 border rounded-xl p-4 text-sm font-mono outline-none transition-all placeholder:text-zinc-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 resize-y",
                                errors.content ? "border-red-500" : "border-border/50 hover:border-zinc-300"
                            )}
                        />
                        {errors.content && (
                            <span className="text-red-500 text-xs font-bold mt-1">
                                {errors.content.message}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[#141827] flex items-center gap-2 mb-2">
                            <ImageIcon className="w-4 h-4 text-zinc-400" />
                            Cover Image
                        </label>
                        <Controller
                            name="cover_image_url"
                            control={control}
                            render={({ field }: { field: any }) => (
                                <NewsImageUploader
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Audio Section (Optional) */}
            <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6 sm:p-8 flex flex-col gap-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold font-display text-[#141827] flex items-center gap-2">
                            <Headphones className="w-5 h-5 text-primary" />
                            Audio Supplement (Optional)
                        </h2>
                        <p className="text-zinc-500 text-sm mt-1">
                            Attach an audio clip and highlight key timestamp moments.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-[#141827]">
                            Audio Clip URL
                        </label>
                        <input
                            type="url"
                            {...register("audio_preview_url")}
                            placeholder="https://example.com/audio.mp3"
                            className="h-12 bg-zinc-50 border border-border/50 hover:border-zinc-300 rounded-xl px-4 text-sm font-mono outline-none transition-all placeholder:text-zinc-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                        />
                    </div>

                    {watchHasAudio && (
                        <div className="flex flex-col gap-4 p-6 bg-zinc-50 border border-border/50 rounded-2xl">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-[#141827]">Key Moments</label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => appendMoment({ time_seconds: 0, label: "" })}
                                    className="bg-white h-8 text-xs font-bold rounded-lg border-zinc-200"
                                >
                                    <Plus className="w-3 h-3 mr-1" /> Add Moment
                                </Button>
                            </div>

                            {audioMoments.length === 0 ? (
                                <p className="text-sm text-zinc-500 italic text-center py-4 bg-white/50 border border-dashed border-zinc-200 rounded-xl">No moments added yet.</p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {audioMoments.map((moment: any, index: number) => (
                                        <div key={moment.id} className="flex items-start gap-3 bg-white p-3 border border-zinc-200 rounded-xl shadow-sm">
                                            <div className="flex flex-col gap-1 w-24">
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Seconds</span>
                                                <input
                                                    type="number"
                                                    {...register(`audio_moments.${index}.time_seconds`, { valueAsNumber: true })}
                                                    className="w-full h-9 bg-zinc-50 border border-zinc-200 rounded-lg px-2 text-sm text-center outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                                    min="0"
                                                />
                                                {errors.audio_moments?.[index]?.time_seconds && (
                                                    <span className="text-red-500 text-[10px] leading-tight">{errors.audio_moments[index].time_seconds.message}</span>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1 flex-1">
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Label</span>
                                                <input
                                                    type="text"
                                                    {...register(`audio_moments.${index}.label`)}
                                                    placeholder="What happens at this moment?"
                                                    className="w-full h-9 bg-zinc-50 border border-zinc-200 rounded-lg px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                                />
                                                {errors.audio_moments?.[index]?.label && (
                                                    <span className="text-red-500 text-[10px] leading-tight">{errors.audio_moments[index].label.message}</span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeMoment(index)}
                                                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-5"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
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
                    {isEditing ? "Save Changes" : "Create Article"}
                </Button>
            </div>
        </form>
    );
}
