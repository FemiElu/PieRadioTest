"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, RefreshCw, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NewsImageUploaderProps {
    value: string | null;
    onChange: (url: string) => void;
    className?: string;
}

export function NewsImageUploader({
    value,
    onChange,
    className,
}: NewsImageUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file (JPEG, PNG, WebP).");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Image size must be less than 5MB.");
            return;
        }

        setError(null);
        setIsUploading(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/admin/news/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to upload image");
            }

            const { url } = await res.json();
            onChange(url);
        } catch (err: any) {
            setError(err.message || "An error occurred during upload.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className={cn("w-full", className)}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
            />

            {value ? (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden group bg-zinc-100 border border-border/50 shadow-sm">
                    <Image
                        src={value}
                        alt="Article Cover"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white rounded-xl font-bold"
                            disabled={isUploading}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Change
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onChange("")}
                            className="bg-red-500/10 text-red-100 border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl font-bold"
                            disabled={isUploading}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Remove
                        </Button>
                    </div>
                    {isUploading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    )}
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className={cn(
                        "w-full aspect-video rounded-2xl border-2 border-dashed border-border/70 bg-zinc-50 flex flex-col items-center justify-center gap-4 transition-all hover:bg-zinc-100 hover:border-primary/50 group",
                        isUploading && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {isUploading ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                            </div>
                            <p className="text-sm font-bold text-zinc-500">Uploading...</p>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-2xl bg-white border border-border/50 shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:shadow-md group-hover:border-primary/20 transition-all duration-300">
                                <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-primary transition-colors" />
                            </div>
                            <div className="text-center">
                                <p className="text-base font-bold text-[#141827]">
                                    Upload Cover Image
                                </p>
                                <p className="text-xs font-bold text-zinc-500 mt-1 uppercase tracking-wider">
                                    JPEG, PNG, or WebP up to 5MB
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">Recommended size: 1600x900px</p>
                            </div>
                        </>
                    )}
                </button>
            )}

            {error && <p className="text-red-500 text-sm mt-2 font-bold">{error}</p>}
        </div>
    );
}
