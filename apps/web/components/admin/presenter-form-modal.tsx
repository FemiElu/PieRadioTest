"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, Upload, User, Plus, Trash2, Radio, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
    { value: "afrobeats", label: "Afrobeats" },
    { value: "amapiano", label: "Amapiano" },
    { value: "rap-hiphop", label: "Rap & Hiphop" },
    { value: "rnb", label: "R&B" },
    { value: "house", label: "House" },
    { value: "sports", label: "Sports" },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PresenterFormData {
    id?: string;
    full_name: string;
    username: string;
    email: string;
    bio: string;
    avatar_url: string;
    category: string;
    instagram_handle: string;
    twitter_handle: string;
    website_url: string;
    presenter_alias?: string;
}

interface PresenterShow {
    id: string;
    title: string;
    description: string | null;
    cover_image_url: string | null;
    schedule: string | null;
    display_order: number;
}

/** A blank show row used when the admin clicks "Add Show" */
const BLANK_SHOW: Omit<PresenterShow, "id" | "display_order"> = {
    title: "",
    description: "",
    cover_image_url: "",
    schedule: "",
};

interface PresenterFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    presenter?: PresenterFormData | null;
    onSuccess?: () => void;
}

const defaultFormData: PresenterFormData = {
    full_name: "",
    username: "",
    email: "",
    bio: "",
    avatar_url: "",
    category: "afrobeats",
    instagram_handle: "",
    twitter_handle: "",
    website_url: "",
    presenter_alias: "",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PresenterFormModal({
    open,
    onOpenChange,
    presenter,
    onSuccess,
}: PresenterFormModalProps) {
    // --- Profile state ---
    const [formData, setFormData] = useState<PresenterFormData>(presenter || defaultFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // --- Shows state ---
    const [shows, setShows] = useState<PresenterShow[]>([]);
    const [isLoadingShows, setIsLoadingShows] = useState(false);
    const [showsError, setShowsError] = useState<string | null>(null);
    /** ID of the show currently being saved/deleted (for inline loading state) */
    const [busyShowId, setBusyShowId] = useState<string | null>(null);
    /** Whether the Add-Show inline form is open */
    const [isAddingShow, setIsAddingShow] = useState(false);
    const [newShow, setNewShow] = useState({ ...BLANK_SHOW });
    const [isSavingNewShow, setIsSavingNewShow] = useState(false);
    /** Whether a cover image is currently being uploaded for the new-show form */
    const [isUploadingCover, setIsUploadingCover] = useState(false);

    // --- Tabs (only shown when editing) ---
    const [activeTab, setActiveTab] = useState<"profile" | "shows">("profile");

    const isEditing = Boolean(presenter?.id);

    // -------------------------------------------------------------------------
    // Reset on open
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (open) {
            setFormData(presenter || defaultFormData);
            setProfileError(null);
            setImageError(false);
            setShowsError(null);
            setIsAddingShow(false);
            setNewShow({ ...BLANK_SHOW });
            setActiveTab("profile");
        }
    }, [open, presenter]);

    // Fetch shows whenever the Shows tab is opened for an existing presenter
    const fetchShows = useCallback(async (presenterId: string) => {
        setIsLoadingShows(true);
        setShowsError(null);
        try {
            const supabase = createClient();
            const { data, error } = await (supabase.from("presenter_shows" as any) as any)
                .select("id, title, description, cover_image_url, schedule, display_order")
                .eq("presenter_id", presenterId)
                .order("display_order", { ascending: true });
            if (error) throw error;
            setShows((data ?? []) as PresenterShow[]);
        } catch (err: any) {
            console.error("Error fetching shows:", err);
            setShowsError(err.message || "Failed to load shows.");
        } finally {
            setIsLoadingShows(false);
        }
    }, []);

    useEffect(() => {
        if (open && activeTab === "shows" && presenter?.id) {
            fetchShows(presenter.id);
        }
    }, [open, activeTab, presenter?.id, fetchShows]);

    // -------------------------------------------------------------------------
    // Profile handlers
    // -------------------------------------------------------------------------

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (name === "avatar_url") setImageError(false);
    };

    const handleCategoryChange = (value: string) => {
        setFormData((prev) => ({ ...prev, category: value }));
    };

    const generateSlug = (name: string) =>
        name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setProfileError("Please upload an image file (JPG, PNG, WebP).");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setProfileError("Image size must be less than 5MB.");
            return;
        }
        try {
            setIsUploading(true);
            setProfileError(null);
            const supabase = createClient();
            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `avatars/${presenter?.id || "temp"}/${fileName}`;
            const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);
            if (uploadError) {
                if (uploadError.message.includes("Bucket not found"))
                    throw new Error("Storage bucket 'avatars' not found. Please contact admin.");
                throw uploadError;
            }
            const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
            setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));
            setImageError(false);
        } catch (err: any) {
            setProfileError(err.message || "Failed to upload image.");
        } finally {
            setIsUploading(false);
            e.target.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setProfileError(null);
        try {
            const supabase = createClient();
            const slug = generateSlug(formData.full_name || formData.username);
            if (isEditing && presenter?.id) {
                const { error: pErr } = await supabase
                    .from("profiles")
                    .update({
                        full_name: formData.full_name,
                        username: formData.username,
                        email: formData.email,
                        bio: formData.bio,
                        avatar_url: formData.avatar_url,
                        presenter_alias: formData.presenter_alias?.trim() || null,
                        slug,
                        updated_at: new Date().toISOString(),
                    } as any)
                    .eq("id", presenter.id);
                if (pErr) throw pErr;
                const { error: mErr } = await (supabase.from("presenter_meta" as any) as any).upsert({
                    user_id: presenter.id,
                    category: formData.category,
                    instagram_handle: formData.instagram_handle || null,
                    twitter_handle: formData.twitter_handle || null,
                    website_url: formData.website_url || null,
                });
                if (mErr) throw mErr;
            } else {
                setProfileError(
                    "To add a new presenter, first create a user account, then change their role to 'presenter' in User Management."
                );
                setIsSubmitting(false);
                return;
            }
            onSuccess?.();
            onOpenChange(false);
        } catch (err: any) {
            setProfileError(err.message || "Failed to save presenter. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // -------------------------------------------------------------------------
    // Shows handlers
    // -------------------------------------------------------------------------

    /**
     * Upload a file chosen by the admin for the new show's cover image.
     * Stores the file in Supabase Storage under show-covers/ and writes the
     * resulting public URL back into the newShow form state.
     */
    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setShowsError("Please upload an image file (JPG, PNG, WebP).");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setShowsError("Image must be less than 5 MB.");
            return;
        }
        try {
            setIsUploadingCover(true);
            setShowsError(null);
            const supabase = createClient();
            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            // Store under show-covers/{presenter_id}/ so it's scoped per presenter
            const filePath = `show-covers/${presenter?.id || "temp"}/${fileName}`;
            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file);
            if (uploadError) {
                if (uploadError.message.includes("Bucket not found"))
                    throw new Error("Storage bucket not found. Please contact admin.");
                throw uploadError;
            }
            const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
            setNewShow((p) => ({ ...p, cover_image_url: publicUrl }));
        } catch (err: any) {
            setShowsError(err.message || "Failed to upload cover image.");
        } finally {
            setIsUploadingCover(false);
            e.target.value = "";
        }
    };

    const handleSaveNewShow = async () => {
        if (!presenter?.id) return;
        if (!newShow.title.trim()) {
            setShowsError("Show title is required.");
            return;
        }
        setIsSavingNewShow(true);
        setShowsError(null);
        try {
            const supabase = createClient();
            const nextOrder = shows.length > 0
                ? Math.max(...shows.map((s) => s.display_order)) + 1
                : 0;
            const { error } = await (supabase.from("presenter_shows" as any) as any).insert({
                presenter_id: presenter.id,
                title: newShow.title.trim(),
                description: newShow.description?.trim() || null,
                cover_image_url: newShow.cover_image_url?.trim() || null,
                schedule: newShow.schedule?.trim() || null,
                display_order: nextOrder,
            });
            if (error) throw error;
            setNewShow({ ...BLANK_SHOW });
            setIsAddingShow(false);
            await fetchShows(presenter.id);
        } catch (err: any) {
            setShowsError(err.message || "Failed to add show.");
        } finally {
            setIsSavingNewShow(false);
        }
    };

    const handleDeleteShow = async (showId: string) => {
        if (!presenter?.id) return;
        setBusyShowId(showId);
        setShowsError(null);
        try {
            const supabase = createClient();
            const { error } = await (supabase.from("presenter_shows" as any) as any)
                .delete()
                .eq("id", showId);
            if (error) throw error;
            await fetchShows(presenter.id);
        } catch (err: any) {
            setShowsError(err.message || "Failed to delete show.");
        } finally {
            setBusyShowId(null);
        }
    };

    const handleMoveShow = async (showId: string, direction: "up" | "down") => {
        // Optimistic reorder in-memory, then persist
        const idx = shows.findIndex((s) => s.id === showId);
        if (idx === -1) return;
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= shows.length) return;

        const reordered = [...shows];
        [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
        // Reassign display_order sequentially
        const updated = reordered.map((s, i) => ({ ...s, display_order: i }));
        setShows(updated);

        // Persist both swapped rows
        setBusyShowId(showId);
        try {
            const supabase = createClient();
            const a = updated[idx];
            const b = updated[swapIdx];
            await Promise.all([
                (supabase.from("presenter_shows" as any) as any)
                    .update({ display_order: a.display_order })
                    .eq("id", a.id),
                (supabase.from("presenter_shows" as any) as any)
                    .update({ display_order: b.display_order })
                    .eq("id", b.id),
            ]);
        } catch (err: any) {
            setShowsError(err.message || "Failed to reorder shows.");
            // Re-fetch to restore correct state
            if (presenter?.id) await fetchShows(presenter.id);
        } finally {
            setBusyShowId(null);
        }
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold font-display">
                        {isEditing ? "Edit Presenter" : "Add New Presenter"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update profile information and manage this presenter's shows."
                            : "Fill in the details to create a new presenter profile."}
                    </DialogDescription>
                </DialogHeader>

                {/* Tab bar — only shown when editing an existing presenter */}
                {isEditing && (
                    <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl">
                        {(["profile", "shows"] as const).map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold capitalize transition-all duration-150 ${activeTab === tab
                                    ? "bg-white shadow text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {tab === "shows" ? `Shows${shows.length > 0 ? ` (${shows.length})` : ""}` : tab}
                            </button>
                        ))}
                    </div>
                )}

                {/* ============================================================ */}
                {/* PROFILE TAB                                                   */}
                {/* ============================================================ */}
                {activeTab === "profile" && (
                    <form onSubmit={handleSubmit} className="space-y-6 py-2">
                        {/* Avatar */}
                        <div className="flex items-start gap-4">
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 border border-border shrink-0">
                                {formData.avatar_url && !imageError ? (
                                    <Image
                                        src={formData.avatar_url}
                                        alt="Avatar preview"
                                        fill
                                        sizes="80px"
                                        className="object-cover"
                                        onError={() => setImageError(true)}
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                        <User className="w-8 h-8" />
                                    </div>
                                )}
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <Label htmlFor="avatar_url">Avatar</Label>
                                <div className="flex gap-2 mt-1.5">
                                    <Input
                                        id="avatar_url"
                                        name="avatar_url"
                                        value={formData.avatar_url}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com/avatar.jpg"
                                        className="flex-1 min-w-0"
                                        disabled={isUploading}
                                    />
                                    <div className="relative shrink-0">
                                        <Input
                                            type="file"
                                            id="avatar-upload"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                            accept="image/*"
                                            disabled={isUploading}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => document.getElementById("avatar-upload")?.click()}
                                            disabled={isUploading}
                                        >
                                            <Upload className="w-4 h-4 mr-1.5" />
                                            Upload
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">URL or upload (max 5 MB)</p>
                            </div>
                        </div>

                        {/* Name + Username */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="full_name">Full Name *</Label>
                                <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} placeholder="Sarah Wilson" required className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="username">Username *</Label>
                                <Input id="username" name="username" value={formData.username} onChange={handleInputChange} placeholder="sarah-wilson" required className="mt-1" />
                            </div>
                        </div>

                        {/* Schedule Alias */}
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <Label htmlFor="presenter_alias" className="text-primary font-bold">Schedule Alias (Google Sheet Name)</Label>
                            <Input
                                id="presenter_alias"
                                name="presenter_alias"
                                value={formData.presenter_alias}
                                onChange={handleInputChange}
                                placeholder="e.g. MARION or KANE WILLIAM"
                                className="mt-1.5 bg-white"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                <strong>Crucial:</strong> This must match the name in the Google Sheet schedule exactly (e.g. &apos;Hosted by [Alias]&apos;) for the &quot;On Air&quot; badge to work.
                            </p>
                        </div>

                        {/* Email */}
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="sarah@pieradio.co.uk" className="mt-1" />
                        </div>

                        {/* Bio */}
                        <div>
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} placeholder="Tell us about this presenter..." rows={4} className="mt-1 resize-none" />
                        </div>

                        {/* Category */}
                        <div>
                            <Label>Category / Station</Label>
                            <Select value={formData.category} onValueChange={handleCategoryChange}>
                                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a category" /></SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Social Links */}
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Social Links</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="instagram_handle">Instagram</Label>
                                    <div className="relative mt-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                                        <Input id="instagram_handle" name="instagram_handle" value={formData.instagram_handle} onChange={handleInputChange} placeholder="handle" className="pl-7" />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="twitter_handle">Twitter / X</Label>
                                    <div className="relative mt-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                                        <Input id="twitter_handle" name="twitter_handle" value={formData.twitter_handle} onChange={handleInputChange} placeholder="handle" className="pl-7" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="website_url">Website</Label>
                                <Input id="website_url" name="website_url" value={formData.website_url} onChange={handleInputChange} placeholder="https://sarahwilson.com" className="mt-1" />
                            </div>
                        </div>

                        {profileError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{profileError}</div>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />{isEditing ? "Update Presenter" : "Add Presenter"}</>}
                            </Button>
                        </DialogFooter>
                    </form>
                )}

                {/* ============================================================ */}
                {/* SHOWS TAB                                                     */}
                {/* ============================================================ */}
                {activeTab === "shows" && (
                    <div className="py-2 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Add shows that appear on this presenter&apos;s public profile page.
                            Each show has a title, cover image, schedule line, and description.
                        </p>

                        {showsError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{showsError}</div>
                        )}

                        {/* Existing shows list */}
                        {isLoadingShows ? (
                            <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Loading shows…</span>
                            </div>
                        ) : shows.length === 0 && !isAddingShow ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center gap-3 border-2 border-dashed border-border rounded-2xl">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Radio className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground text-sm">No shows yet</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Add the first show for this presenter below.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {shows.map((show, idx) => (
                                    <div
                                        key={show.id}
                                        className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-border group"
                                    >
                                        {/* Cover thumbnail */}
                                        <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-primary/10">
                                            {show.cover_image_url ? (
                                                <Image
                                                    src={show.cover_image_url}
                                                    alt={show.title}
                                                    fill
                                                    sizes="56px"
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Radio className="w-5 h-5 text-primary/40" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-foreground leading-tight truncate">{show.title}</p>
                                            {show.schedule && (
                                                <p className="text-xs text-primary font-medium mt-0.5">{show.schedule}</p>
                                            )}
                                            {show.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{show.description}</p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-1 shrink-0">
                                            <button
                                                type="button"
                                                title="Move up"
                                                disabled={idx === 0 || busyShowId === show.id}
                                                onClick={() => handleMoveShow(show.id, "up")}
                                                className="p-1 rounded hover:bg-zinc-200 disabled:opacity-30 text-muted-foreground transition-colors"
                                            >
                                                <ChevronUp className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                title="Move down"
                                                disabled={idx === shows.length - 1 || busyShowId === show.id}
                                                onClick={() => handleMoveShow(show.id, "down")}
                                                className="p-1 rounded hover:bg-zinc-200 disabled:opacity-30 text-muted-foreground transition-colors"
                                            >
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                title="Delete show"
                                                disabled={busyShowId === show.id}
                                                onClick={() => handleDeleteShow(show.id)}
                                                className="p-1 rounded hover:bg-red-100 text-red-500 disabled:opacity-30 transition-colors"
                                            >
                                                {busyShowId === show.id
                                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    : <Trash2 className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Add-show inline form ── */}
                        {isAddingShow ? (
                            <div className="border border-primary/30 bg-primary/5 rounded-2xl p-4 space-y-3">
                                <p className="text-sm font-bold text-foreground">New Show</p>

                                <div>
                                    <Label htmlFor="ns_title" className="text-xs">Show Title *</Label>
                                    <Input
                                        id="ns_title"
                                        value={newShow.title}
                                        onChange={(e) => setNewShow((p) => ({ ...p, title: e.target.value }))}
                                        placeholder="e.g. The Morning Vibe"
                                        className="mt-1"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="ns_schedule" className="text-xs">Schedule</Label>
                                    <Input
                                        id="ns_schedule"
                                        value={newShow.schedule ?? ""}
                                        onChange={(e) => setNewShow((p) => ({ ...p, schedule: e.target.value }))}
                                        placeholder="e.g. Mondays • 3:00PM – 5:00PM"
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Free text — write whatever is clearest: &quot;Weekdays • 10AM–2PM&quot;, &quot;Sundays • 8AM&quot;
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-xs">Cover Image</Label>
                                    {/* Preview thumbnail */}
                                    {newShow.cover_image_url && (
                                        <div className="relative w-full h-28 mt-1.5 rounded-lg overflow-hidden bg-zinc-100 border border-border">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={newShow.cover_image_url}
                                                alt="Cover preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex gap-2 mt-1.5">
                                        <Input
                                            id="ns_cover"
                                            value={newShow.cover_image_url ?? ""}
                                            onChange={(e) => setNewShow((p) => ({ ...p, cover_image_url: e.target.value }))}
                                            placeholder="Paste a direct image URL…"
                                            className="flex-1 min-w-0"
                                            disabled={isUploadingCover}
                                        />
                                        <div className="shrink-0">
                                            <input
                                                type="file"
                                                id="cover-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleCoverUpload}
                                                disabled={isUploadingCover}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="gap-1.5"
                                                onClick={() => document.getElementById("cover-upload")?.click()}
                                                disabled={isUploadingCover}
                                            >
                                                {isUploadingCover
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : <Upload className="w-4 h-4" />}
                                                {isUploadingCover ? "Uploading…" : "Upload"}
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Upload a file <span className="text-zinc-400">or</span> paste a direct image URL (not a Google Drive link).
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="ns_desc" className="text-xs">Description</Label>
                                    <Textarea
                                        id="ns_desc"
                                        value={newShow.description ?? ""}
                                        onChange={(e) => setNewShow((p) => ({ ...p, description: e.target.value }))}
                                        placeholder="Brief description of the show…"
                                        rows={2}
                                        className="mt-1 resize-none"
                                    />
                                </div>

                                <div className="flex gap-2 justify-end pt-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => { setIsAddingShow(false); setNewShow({ ...BLANK_SHOW }); setShowsError(null); }}
                                        disabled={isSavingNewShow}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="button" size="sm" onClick={handleSaveNewShow} disabled={isSavingNewShow}>
                                        {isSavingNewShow
                                            ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Saving…</>
                                            : <><Save className="w-4 h-4 mr-1.5" />Save Show</>}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full rounded-xl gap-2 border-dashed"
                                onClick={() => setIsAddingShow(true)}
                            >
                                <Plus className="w-4 h-4" />
                                Add Show
                            </Button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
