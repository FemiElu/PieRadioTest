"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { Loader2, Save, Upload, User, Plus, Trash2, Radio, ChevronDown, ChevronUp, Pencil } from "lucide-react";
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
import { toast } from "sonner";
import { isShowArtworkUrl, sameShowFields, showEditPatch } from "@/lib/presenters/show-editing";

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
    { value: "alternative", label: "Alternative" },
    { value: "dancehall", label: "Dancehall" },
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
    category: "",
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
    const [editingShow, setEditingShow] = useState<PresenterShow | null>(null);
    const [discardIntent, setDiscardIntent] = useState<"close" | "profile" | null>(null);
    const editOriginalRef = useRef<PresenterShow | null>(null);
    const editButtonsRef = useRef<Record<string, HTMLButtonElement | null>>({});
    const editTitleRef = useRef<HTMLInputElement>(null);
    const sessionRef = useRef(0);
    const fetchRef = useRef(0);
    const showOperationRef = useRef<symbol | null>(null);
    const uploadOperationRef = useRef<symbol | null>(null);
    const currentRef = useRef({ open, presenterId: presenter?.id });
    currentRef.current = { open, presenterId: presenter?.id };
    const [isSavingNewShow, setIsSavingNewShow] = useState(false);
    /** Whether a cover image is currently being uploaded for the new-show form */
    const [isUploadingCover, setIsUploadingCover] = useState(false);

    // --- Tabs (only shown when editing) ---
    const [activeTab, setActiveTab] = useState<"profile" | "shows">("profile");

    const isEditing = Boolean(presenter?.id);

    // -------------------------------------------------------------------------
    // Reset on open
    // -------------------------------------------------------------------------
    // A response belongs to one modal session and presenter, even if props change
    // while a network request is pending. Ref locks also block same-tick repeats.
    useLayoutEffect(() => {
        sessionRef.current += 1;
        fetchRef.current += 1;
        showOperationRef.current = null;
        uploadOperationRef.current = null;
        setShows([]);
        setIsLoadingShows(false);
        setBusyShowId(null);
        setIsSavingNewShow(false);
        setIsUploadingCover(false);
        setEditingShow(null);
        setDiscardIntent(null);
        editOriginalRef.current = null;
        setIsAddingShow(false);
        setNewShow({ ...BLANK_SHOW });
        if (open) {
            setFormData(presenter || defaultFormData);
            setProfileError(null);
            setImageError(false);
            setShowsError(null);
            setActiveTab("profile");
        }
        return () => { sessionRef.current += 1; fetchRef.current += 1; };
        // Reset on identity/open changes, not a parent refresh of the same profile.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, presenter?.id]);

    const isCurrent = useCallback((session: number, presenterId: string) =>
        sessionRef.current === session && currentRef.current.open
        && currentRef.current.presenterId === presenterId, []);

    const fetchShows = useCallback(async (presenterId: string) => {
        const session = sessionRef.current;
        const request = ++fetchRef.current;
        const current = () => isCurrent(session, presenterId) && fetchRef.current === request;
        setIsLoadingShows(true);
        setShowsError(null);
        try {
            const supabase = createClient();
            const { data, error } = await (supabase.from("presenter_shows" as any) as any)
                .select("id, title, description, cover_image_url, schedule, display_order")
                .eq("presenter_id", presenterId)
                .order("display_order", { ascending: true });
            if (error) throw error;
            if (current()) setShows((data ?? []) as PresenterShow[]);
        } catch (err: any) {
            if (current()) setShowsError(err.message || "Failed to load shows.");
        } finally {
            if (current()) setIsLoadingShows(false);
        }
    }, [isCurrent]);

    useEffect(() => {
        if (open && activeTab === "shows" && presenter?.id) fetchShows(presenter.id);
    }, [open, activeTab, presenter?.id, fetchShows]);

    const showsBusy = busyShowId !== null || isSavingNewShow || isUploadingCover;
    const showEditDirty = Boolean(editingShow && editOriginalRef.current && !sameShowFields(editingShow, editOriginalRef.current));
    const showActionsLocked = showsBusy || Boolean(editingShow);
    const requestNavigation = (intent: "close" | "profile") => {
        if (showOperationRef.current || uploadOperationRef.current || discardIntent) return;
        if (editingShow && showEditDirty) { setDiscardIntent(intent); return; }
        setEditingShow(null);
        editOriginalRef.current = null;
        if (intent === "close") onOpenChange(false);
        else setActiveTab("profile");
    };
    const finishEdit = (showId: string) => {
        setEditingShow(null);
        editOriginalRef.current = null;
        setShowsError(null);
        const session = sessionRef.current;
        const presenterId = presenter?.id;
        setTimeout(() => {
            if (presenterId && isCurrent(session, presenterId)) editButtonsRef.current[showId]?.focus();
        }, 0);
    };
    const beginEdit = (show: PresenterShow) => {
        if (showOperationRef.current || uploadOperationRef.current || editingShow || isAddingShow) return;
        editOriginalRef.current = { ...show };
        setEditingShow({ ...show });
        setShowsError(null);
    };

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

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "new" | string = "new") => {
        const input = e.currentTarget;
        const file = input.files?.[0];
        input.value = "";
        const presenterId = presenter?.id;
        if (!file || !presenterId || uploadOperationRef.current || showOperationRef.current) return;
        if (target === "new" ? Boolean(editingShow) : editingShow?.id !== target) return;
        if (!file.type.startsWith("image/")) { setShowsError("Please upload an image file (JPG, PNG, WebP)."); return; }
        if (file.size > 5 * 1024 * 1024) { setShowsError("Image must be less than 5 MB."); return; }
        const operation = Symbol("show artwork");
        const session = sessionRef.current;
        uploadOperationRef.current = operation;
        const current = () => isCurrent(session, presenterId) && uploadOperationRef.current === operation;
        setIsUploadingCover(true);
        setShowsError(null);
        try {
            const supabase = createClient();
            const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").slice(0, 10) || "image";
            const filePath = `show-covers/${presenterId}/${crypto.randomUUID()}.${extension}`;
            const { error } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: false });
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
            if (!current()) return;
            if (target === "new") setNewShow(previous => ({ ...previous, cover_image_url: publicUrl }));
            else setEditingShow(previous => previous?.id === target ? { ...previous, cover_image_url: publicUrl } : previous);
        } catch (err: any) {
            if (current()) setShowsError(err.message?.includes("Bucket not found") ? "Storage bucket not found. Please contact admin." : err.message || "Failed to upload cover image.");
        } finally {
            if (current()) { uploadOperationRef.current = null; setIsUploadingCover(false); }
        }
    };

    const handleSaveNewShow = async () => {
        const presenterId = presenter?.id;
        if (!presenterId || showOperationRef.current || uploadOperationRef.current || editingShow) return;
        if (!newShow.title.trim()) { setShowsError("Show title is required."); return; }
        const operation = Symbol("new show");
        const session = sessionRef.current;
        showOperationRef.current = operation;
        const current = () => isCurrent(session, presenterId) && showOperationRef.current === operation;
        setIsSavingNewShow(true);
        setShowsError(null);
        try {
            const supabase = createClient();
            const nextOrder = shows.length > 0 ? Math.max(...shows.map(show => show.display_order)) + 1 : 0;
            const { error } = await (supabase.from("presenter_shows" as any) as any).insert({
                presenter_id: presenterId, title: newShow.title.trim(),
                description: newShow.description?.trim() || null, cover_image_url: newShow.cover_image_url?.trim() || null,
                schedule: newShow.schedule?.trim() || null, display_order: nextOrder,
            });
            if (error) throw error;
            if (!current()) return;
            setNewShow({ ...BLANK_SHOW });
            setIsAddingShow(false);
            await fetchShows(presenterId);
        } catch (err: any) {
            if (current()) setShowsError(err.message || "Failed to add show.");
        } finally {
            if (current()) { showOperationRef.current = null; setIsSavingNewShow(false); }
        }
    };

    const handleSaveShow = async () => {
        const presenterId = presenter?.id;
        const draft = editingShow;
        if (!presenterId || !draft || showOperationRef.current || uploadOperationRef.current) return;
        const patch = showEditPatch(draft);
        if (!patch.title) { setShowsError("Show title is required."); editTitleRef.current?.focus(); return; }
        if (!isShowArtworkUrl(patch.cover_image_url ?? "")) { setShowsError("Enter an HTTP(S) image URL or a site path starting with /."); return; }
        const session = sessionRef.current;
        const operation = Symbol("edit show");
        showOperationRef.current = operation;
        const current = () => isCurrent(session, presenterId) && showOperationRef.current === operation;
        setBusyShowId(draft.id);
        setShowsError(null);
        try {
            const supabase = createClient();
            const { data, error } = await (supabase.from("presenter_shows" as any) as any)
                .update(patch).eq("id", draft.id).eq("presenter_id", presenterId)
                .select("id, title, description, cover_image_url, schedule, display_order").single();
            if (error) throw error;
            if (!data || data.id !== draft.id) throw new Error("The show could not be updated. It may have been removed or your access changed.");
            if (!current()) return;
            setShows(previous => previous.map(show => show.id === draft.id ? data as PresenterShow : show));
            finishEdit(draft.id);
            toast.success("Show updated successfully.");
        } catch (err: any) {
            if (current()) setShowsError(err.code === "PGRST116" ? "The show could not be updated. It may have been removed or your access changed." : err.message || "Failed to update show. Please try again.");
        } finally {
            if (current()) { showOperationRef.current = null; setBusyShowId(null); }
        }
    };

    const handleDeleteShow = async (showId: string) => {
        const presenterId = presenter?.id;
        if (!presenterId || showOperationRef.current || uploadOperationRef.current || editingShow) return;
        const session = sessionRef.current;
        const operation = Symbol("delete show");
        showOperationRef.current = operation;
        const current = () => isCurrent(session, presenterId) && showOperationRef.current === operation;
        setBusyShowId(showId);
        setShowsError(null);
        try {
            const supabase = createClient();
            const { error } = await (supabase.from("presenter_shows" as any) as any).delete().eq("id", showId).eq("presenter_id", presenterId);
            if (error) throw error;
            if (current()) await fetchShows(presenterId);
        } catch (err: any) {
            if (current()) setShowsError(err.message || "Failed to delete show.");
        } finally {
            if (current()) { showOperationRef.current = null; setBusyShowId(null); }
        }
    };

    const handleMoveShow = async (showId: string, direction: "up" | "down") => {
        const presenterId = presenter?.id;
        if (!presenterId || showOperationRef.current || uploadOperationRef.current || editingShow) return;
        const idx = shows.findIndex(show => show.id === showId);
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (idx < 0 || swapIdx < 0 || swapIdx >= shows.length) return;
        const reordered = [...shows];
        [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
        const updated = reordered.map((show, index) => ({ ...show, display_order: index }));
        const session = sessionRef.current;
        const operation = Symbol("reorder shows");
        showOperationRef.current = operation;
        const current = () => isCurrent(session, presenterId) && showOperationRef.current === operation;
        setShows(updated);
        setBusyShowId(showId);
        setShowsError(null);
        try {
            const supabase = createClient();
            const results = await Promise.all([updated[idx], updated[swapIdx]].map(show =>
                (supabase.from("presenter_shows" as any) as any).update({ display_order: show.display_order }).eq("id", show.id).eq("presenter_id", presenterId)));
            const failed = results.find(result => result.error);
            if (failed?.error) throw failed.error;
        } catch (err: any) {
            if (current()) { setShowsError(err.message || "Failed to reorder shows."); await fetchShows(presenterId); }
        } finally {
            if (current()) { showOperationRef.current = null; setBusyShowId(null); }
        }
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    return (
        <>
        <Dialog open={open} onOpenChange={(next) => next ? onOpenChange(true) : requestNavigation("close")}>
            <DialogContent className="w-[calc(100%_-_1.5rem)] max-w-[640px] max-h-[90vh] overflow-y-auto rounded-xl sm:max-w-[640px]" onInteractOutside={(event) => { if (showsBusy || discardIntent) event.preventDefault(); }} onEscapeKeyDown={(event) => { if (showsBusy || discardIntent) event.preventDefault(); }}>
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
                                onClick={() => tab === "profile" ? requestNavigation("profile") : setActiveTab("shows")}
                                disabled={showsBusy}
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

                        {/* Genre */}
                        <div>
                            <Label>Genre</Label>
                            <Select value={formData.category} onValueChange={handleCategoryChange}>
                                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a genre" /></SelectTrigger>
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

                        {showsError && !editingShow && (
                            <div id="show-edit-error" role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{showsError}</div>
                        )}

                        {isLoadingShows ? (
                            <div role="status" className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin" /><span>Loading shows…</span>
                            </div>
                        ) : shows.length === 0 && !isAddingShow ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center gap-3 border-2 border-dashed border-border rounded-2xl">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Radio className="w-6 h-6 text-primary" /></div>
                                <div><p className="font-semibold text-foreground text-sm">No shows yet</p><p className="text-xs text-muted-foreground mt-0.5">Add the first show for this presenter below.</p></div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {shows.map((show, idx) => {
                                    const editing = editingShow?.id === show.id;
                                    const artwork = editing ? editingShow.cover_image_url?.trim() ?? "" : "";
                                    return <section key={show.id} aria-label={show.title} className={`min-w-0 overflow-hidden rounded-xl border ${editing ? "border-primary/35 bg-white shadow-sm" : "border-border bg-zinc-50"}`}>
                                        <div className="flex min-w-0 items-start gap-3 p-3">
                                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-primary/10">
                                                {show.cover_image_url ? <Image src={show.cover_image_url} alt={show.title} fill sizes="56px" className="object-cover" unoptimized /> : <div className="flex h-full w-full items-center justify-center"><Radio className="h-5 w-5 text-primary/40" /></div>}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="break-words text-sm font-semibold leading-tight text-foreground">{show.title}</p>
                                                {show.schedule && <p className="mt-1 break-words text-xs font-medium text-primary">{show.schedule}</p>}
                                                {!editing && show.description && <p className="mt-1 line-clamp-2 break-words text-xs text-muted-foreground">{show.description}</p>}
                                                {editing && <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">Editing show</p>}
                                            </div>
                                            {!editing && <div className="flex shrink-0 flex-col items-end gap-1">
                                                <Button ref={(element) => { editButtonsRef.current[show.id] = element; }} id={`show-edit-button-${show.id}`} type="button" variant="outline" size="sm" aria-label={`Edit ${show.title}`} disabled={showActionsLocked || isAddingShow} onClick={() => beginEdit(show)} className="h-8 gap-1.5 px-2 text-xs"><Pencil className="h-3.5 w-3.5" />Edit</Button>
                                                <div className="flex items-center gap-0.5">
                                                    <button type="button" title="Move up" aria-label={`Move ${show.title} up`} disabled={idx === 0 || showActionsLocked || isAddingShow} onClick={() => handleMoveShow(show.id, "up")} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-zinc-200 disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                                                    <button type="button" title="Move down" aria-label={`Move ${show.title} down`} disabled={idx === shows.length - 1 || showActionsLocked || isAddingShow} onClick={() => handleMoveShow(show.id, "down")} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-zinc-200 disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                                                    <button type="button" title="Delete show" aria-label={`Delete ${show.title}`} disabled={showActionsLocked || isAddingShow} onClick={() => handleDeleteShow(show.id)} className="rounded p-1.5 text-red-500 transition-colors hover:bg-red-100 disabled:opacity-30">{busyShowId === show.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}</button>
                                                </div>
                                            </div>}
                                        </div>
                                        {editing && <fieldset aria-label={`Edit ${show.title}`} disabled={showsBusy} className="min-w-0 space-y-4 border-t border-border/70 px-4 py-4">
                                            <div><Label htmlFor={`edit-show-title-${show.id}`}>Show title <span aria-hidden="true">*</span></Label><Input id={`edit-show-title-${show.id}`} ref={editTitleRef} autoFocus required value={editingShow.title} onChange={(event) => setEditingShow(previous => previous ? { ...previous, title: event.target.value } : previous)} aria-describedby={showsError ? "show-edit-error" : undefined} className="mt-1.5" /></div>
                                            <div><Label htmlFor={`edit-show-schedule-${show.id}`}>Schedule</Label><Input id={`edit-show-schedule-${show.id}`} value={editingShow.schedule ?? ""} onChange={(event) => setEditingShow(previous => previous ? { ...previous, schedule: event.target.value } : previous)} placeholder="e.g. Mondays · 3PM–5PM" className="mt-1.5" /><p className="mt-1 text-xs text-muted-foreground">A short schedule line for the public profile.</p></div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`edit-show-artwork-${show.id}`}>Artwork image URL</Label>
                                                {artwork && isShowArtworkUrl(artwork) && <div className="relative h-36 overflow-hidden rounded-lg border border-border bg-zinc-100">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={artwork} alt={`Artwork preview for ${show.title}`} className="h-full w-full object-cover" />
                                                </div>}
                                                <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                                                    <Input id={`edit-show-artwork-${show.id}`} value={editingShow.cover_image_url ?? ""} onChange={(event) => setEditingShow(previous => previous ? { ...previous, cover_image_url: event.target.value } : previous)} placeholder="https://… or /assets/show.webp" className="min-w-0 flex-1" />
                                                    <input type="file" id={`edit-show-upload-${show.id}`} aria-label="Choose show artwork" className="hidden" accept="image/*" disabled={showsBusy} onChange={(event) => handleCoverUpload(event, show.id)} />
                                                    <Button type="button" variant="outline" className="shrink-0 gap-2" disabled={showsBusy} onClick={() => document.getElementById(`edit-show-upload-${show.id}`)?.click()}>{isUploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{isUploadingCover ? "Uploading…" : "Upload artwork"}</Button>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Upload an image up to 5 MB, paste an image URL, or clear this field to remove the artwork.</p>
                                            </div>
                                            <div><Label htmlFor={`edit-show-description-${show.id}`}>Description</Label><Textarea id={`edit-show-description-${show.id}`} value={editingShow.description ?? ""} onChange={(event) => setEditingShow(previous => previous ? { ...previous, description: event.target.value } : previous)} rows={3} className="mt-1.5 resize-y" /></div>
                                            {showsError && <div id="show-edit-error" role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{showsError}</div>}
                                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                                                <p role="status" className="text-xs text-muted-foreground">{isUploadingCover ? "Uploading artwork…" : busyShowId === show.id ? "Saving show…" : showEditDirty ? "Unsaved changes" : "Edit the show details, then save."}</p>
                                                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto"><Button type="button" variant="outline" disabled={showsBusy} onClick={() => finishEdit(show.id)}>Cancel</Button><Button type="button" disabled={showsBusy} onClick={handleSaveShow}>{busyShowId === show.id ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}{busyShowId === show.id ? "Saving…" : "Save"}</Button></div>
                                            </div>
                                        </fieldset>}
                                    </section>;
                                })}
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
                                        value={newShow.title} disabled={showsBusy}
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
                                        value={newShow.schedule ?? ""} disabled={showsBusy}
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
                                            disabled={showsBusy}
                                        />
                                        <div className="shrink-0">
                                            <input
                                                type="file"
                                                id="cover-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(event) => handleCoverUpload(event, "new")}
                                                disabled={showsBusy}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="gap-1.5"
                                                onClick={() => document.getElementById("cover-upload")?.click()}
                                                disabled={showsBusy}
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
                                        value={newShow.description ?? ""} disabled={showsBusy}
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
                                        disabled={showsBusy}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="button" size="sm" onClick={handleSaveNewShow} disabled={showsBusy}>
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
                                disabled={showActionsLocked}
                                onClick={() => { if (!showActionsLocked) setIsAddingShow(true); }}
                            >
                                <Plus className="w-4 h-4" />
                                Add Show
                            </Button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
        <Dialog open={Boolean(discardIntent)} onOpenChange={(next) => { if (!next) setDiscardIntent(null); }}>
            <DialogContent className="w-[calc(100%_-_2rem)] rounded-xl" onCloseAutoFocus={(event) => { event.preventDefault(); if (editingShow) editTitleRef.current?.focus(); }}>
                <DialogHeader><DialogTitle>Discard show changes?</DialogTitle><DialogDescription>Your changes have not been saved. Keep editing or discard them to continue.</DialogDescription></DialogHeader>
                <DialogFooter className="gap-2"><Button type="button" variant="outline" autoFocus onClick={() => setDiscardIntent(null)}>Keep editing</Button><Button type="button" onClick={() => { const intent = discardIntent; setDiscardIntent(null); setEditingShow(null); editOriginalRef.current = null; setShowsError(null); if (intent === "close") onOpenChange(false); else setActiveTab("profile"); }}>Discard changes</Button></DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
