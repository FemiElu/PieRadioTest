"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, X, Upload, User } from "lucide-react";
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

// Category options
const CATEGORIES = [
    { value: "Main Station", label: "Main Station" },
    { value: "80s Hits", label: "80s Hits" },
    { value: "Afrobeats", label: "Afrobeats" },
    { value: "Chill Vibes", label: "Chill Vibes" },
    { value: "Rock Classics", label: "Rock Classics" },
];

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
}

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
    category: "Main Station",
    instagram_handle: "",
    twitter_handle: "",
    website_url: "",
};

export function PresenterFormModal({
    open,
    onOpenChange,
    presenter,
    onSuccess,
}: PresenterFormModalProps) {
    const [formData, setFormData] = useState<PresenterFormData>(
        presenter || defaultFormData
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const isEditing = Boolean(presenter?.id);

    // Update form data when modal opens or presenter changes
    useEffect(() => {
        if (open) {
            setFormData(presenter || defaultFormData);
            setError(null);
            setImageError(false);
        }
    }, [open, presenter]);

    // Reset form when modal opens/closes or presenter changes
    const handleOpenChange = (newOpen: boolean) => {
        onOpenChange(newOpen);
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (name === "avatar_url") {
            setImageError(false);
        }
    };

    const handleCategoryChange = (value: string) => {
        setFormData((prev) => ({ ...prev, category: value }));
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file (JPG, PNG, WebP).");
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setError("Image size must be less than 5MB.");
            return;
        }

        try {
            setIsUploading(true);
            setError(null);
            const supabase = createClient();

            // Create a unique file path: avatars/{user_id}/{timestamp}-{filename}
            // If creating new user (no ID yet), use 'temp/{timestamp}-{filename}'
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `avatars/${presenter?.id || 'temp'}/${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from("avatars")
                .upload(filePath, file);

            if (uploadError) {
                // Check if bucket exists error or permissions
                if (uploadError.message.includes("Bucket not found")) {
                    throw new Error("Storage bucket 'avatars' not found. Please contact admin.");
                }
                throw uploadError;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
            setImageError(false);

        } catch (err: any) {
            console.error("Upload error:", err);
            setError(err.message || "Failed to upload image.");
        } finally {
            setIsUploading(false);
            // Reset input value so same file can be selected again if needed
            e.target.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const supabase = createClient();
            const slug = generateSlug(formData.full_name || formData.username);

            if (isEditing && presenter?.id) {
                // Update existing presenter profile
                const { error: profileError } = await supabase
                    .from("profiles")
                    .update({
                        full_name: formData.full_name,
                        username: formData.username,
                        email: formData.email,
                        bio: formData.bio,
                        avatar_url: formData.avatar_url,
                        slug: slug,
                        updated_at: new Date().toISOString(),
                    } as any)
                    .eq("id", presenter.id);

                if (profileError) throw profileError;

                // Update or insert presenter_meta - Use 'as any' as the types are out of sync with the DB
                const { error: metaError } = await (supabase.from("presenter_meta" as any) as any)
                    .upsert({
                        user_id: presenter.id,
                        category: formData.category,
                        instagram_handle: formData.instagram_handle || null,
                        twitter_handle: formData.twitter_handle || null,
                        website_url: formData.website_url || null,
                    });

                if (metaError) throw metaError;
            } else {
                // Creating a new presenter requires an existing user account
                // For now, we'll show a message about how to add presenters
                setError(
                    "To add a new presenter, first create a user account, then change their role to 'presenter' in User Management."
                );
                setIsSubmitting(false);
                return;
            }

            onSuccess?.();
            onOpenChange(false);
        } catch (err: any) {
            console.error("Error saving presenter:", err);
            setError(err.message || "Failed to save presenter. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold font-display">
                        {isEditing ? "Edit Presenter" : "Add New Presenter"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the presenter's profile information."
                            : "Fill in the details to create a new presenter profile."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Avatar Preview & Upload */}
                    <div className="flex items-start gap-4">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 border border-border flex-shrink-0">
                            {formData.avatar_url && !imageError ? (
                                <Image
                                    src={formData.avatar_url}
                                    alt="Avatar preview"
                                    fill
                                    className="object-cover"
                                    onError={() => setImageError(true)}
                                    unoptimized // Optional: sometimes helps with unpredictable external URLs
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
                        <div className="flex-1 space-y-3">
                            <div>
                                <Label htmlFor="avatar_url">Avatar Source</Label>
                                <div className="flex gap-2 mt-1.5">
                                    <Input
                                        id="avatar_url"
                                        name="avatar_url"
                                        value={formData.avatar_url}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com/avatar.jpg"
                                        className="flex-1"
                                        disabled={isUploading}
                                    />
                                    <div className="relative">
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
                                            onClick={() => document.getElementById('avatar-upload')?.click()}
                                            disabled={isUploading}
                                            className="whitespace-nowrap"
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            Upload
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1.5">
                                    Enter a URL or upload an image (max 5MB).
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="full_name">Full Name *</Label>
                            <Input
                                id="full_name"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleInputChange}
                                placeholder="Sarah Wilson"
                                required
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="username">Username *</Label>
                            <Input
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                placeholder="sarah-wilson"
                                required
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="sarah@pieradio.co.uk"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            placeholder="Tell us about this presenter..."
                            rows={4}
                            className="mt-1 resize-none"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <Label htmlFor="category">Category / Station</Label>
                        <Select
                            value={formData.category}
                            onValueChange={handleCategoryChange}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                            Social Links
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="instagram_handle">Instagram Handle</Label>
                                <div className="relative mt-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                        @
                                    </span>
                                    <Input
                                        id="instagram_handle"
                                        name="instagram_handle"
                                        value={formData.instagram_handle}
                                        onChange={handleInputChange}
                                        placeholder="sarahwilson"
                                        className="pl-7"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="twitter_handle">Twitter Handle</Label>
                                <div className="relative mt-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                        @
                                    </span>
                                    <Input
                                        id="twitter_handle"
                                        name="twitter_handle"
                                        value={formData.twitter_handle}
                                        onChange={handleInputChange}
                                        placeholder="sarahwilson"
                                        className="pl-7"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="website_url">Website URL</Label>
                            <Input
                                id="website_url"
                                name="website_url"
                                value={formData.website_url}
                                onChange={handleInputChange}
                                placeholder="https://sarahwilson.com"
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Footer */}
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {isEditing ? "Update Presenter" : "Add Presenter"}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
