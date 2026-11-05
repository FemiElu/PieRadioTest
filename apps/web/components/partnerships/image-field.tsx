"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ImageFieldProps = {
    pageId?: string;
    label: string;
    src: string;
    alt: string;
    onChange: (next: { src: string; alt: string }) => void;
};

export function ImageField({ pageId, label, src, alt, onChange }: ImageFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const upload = async (file?: File) => {
        if (!file || !pageId) return;
        setError("");
        const data = new FormData();
        data.set("file", file);
        setUploading(true);
        try {
            const response = await fetch(`/api/admin/partnerships/${pageId}/upload`, { method: "POST", body: data });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Image upload failed");
            onChange({ src: result.src, alt });
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : "Image upload failed");
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-3 rounded-2xl border border-border/60 bg-zinc-50 p-4">
            <p className="text-sm font-bold text-[#141827]">{label}</p>
            {src ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-white">
                    <Image src={src} alt={alt || label} fill sizes="(max-width: 768px) 100vw, 600px" className="object-contain" />
                </div>
            ) : (
                <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white text-sm text-zinc-500">
                    Upload an image or paste its URL
                </div>
            )}
            <Input value={src} aria-label={`${label} image URL`} placeholder="/assets/image.webp or https://…" onChange={(event) => onChange({ src: event.target.value, alt })} />
            <Input value={alt} aria-label={`${label} alt text`} placeholder="Describe this image" onChange={(event) => onChange({ src, alt: event.target.value })} />
            <div className="flex flex-wrap gap-2">
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    aria-label={`Choose ${label} image`}
                    disabled={!pageId || uploading}
                    onChange={(event) => void upload(event.target.files?.[0])}
                />
                <Button type="button" variant="outline" size="sm" disabled={!pageId || uploading} onClick={() => inputRef.current?.click()}>
                    {uploading ? "Uploading…" : "Upload image"}
                </Button>
                {src && <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ src: "", alt })}>Remove image</Button>}
                {!pageId && <span className="self-center text-xs text-zinc-500">Save this draft to enable uploads.</span>}
            </div>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        </div>
    );
}
