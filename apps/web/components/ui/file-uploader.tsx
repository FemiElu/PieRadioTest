"use client";

import { useState, useCallback } from "react";
import { Upload, X, FileAudio, FileImage, CheckCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploaderProps {
    bucket: "music" | "images";
    acceptedFileTypes?: string[]; // e.g. ['image/*', 'audio/mpeg']
    maxSizeMB?: number;
    onUploadComplete: (path: string) => void;
    onUploadError?: (error: string) => void;
    className?: string;
}

export function FileUploader({
    bucket,
    acceptedFileTypes = [],
    maxSizeMB = 50,
    onUploadComplete,
    onUploadError,
    className,
}: FileUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const supabase = createClient();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Validate Size
            if (selectedFile.size > maxSizeMB * 1024 * 1024) {
                setErrorMessage(`File size exceeds ${maxSizeMB}MB`);
                setStatus("error");
                return;
            }

            // Validate Type (Simple check)
            // Note: acceptedFileTypes prop is primarily for the input attribute

            setFile(selectedFile);
            setStatus("idle");
            setErrorMessage("");
            setProgress(0);
        }
    };

    const uploadFile = async () => {
        if (!file) return;

        setUploading(true);
        setStatus("uploading");

        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`; // Could organize by folders e.g. `userId/fileName` if we had userId here

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (error) {
                throw error;
            }

            setStatus("success");
            onUploadComplete(data.path);

        } catch (error: any) {
            console.error("Upload error:", error);
            setErrorMessage(error.message || "Upload failed");
            setStatus("error");
            if (onUploadError) onUploadError(error.message);
        } finally {
            setUploading(false);
        }
    };

    const removeFile = () => {
        setFile(null);
        setStatus("idle");
        setProgress(0);
        setErrorMessage("");
    };

    return (
        <div className={cn("w-full", className)}>
            {!file ? (
                <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
                    <input
                        type="file"
                        id={`file-upload-${bucket}`}
                        className="hidden"
                        accept={acceptedFileTypes.join(",")}
                        onChange={handleFileSelect}
                        disabled={uploading}
                    />
                    <label
                        htmlFor={`file-upload-${bucket}`}
                        className="cursor-pointer flex flex-col items-center justify-center"
                    >
                        <Upload className="w-10 h-10 text-zinc-400 mb-4" />
                        <span className="text-zinc-200 font-medium text-lg">Click to Upload</span>
                        <span className="text-zinc-500 text-sm mt-2">
                            (Max {maxSizeMB}MB)
                        </span>
                    </label>
                </div>
            ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3 overflow-hidden">
                            {bucket === 'music' ? (
                                <FileAudio className="w-8 h-8 text-primary shrink-0" />
                            ) : (
                                <FileImage className="w-8 h-8 text-blue-500 shrink-0" />
                            )}
                            <div className="truncate">
                                <p className="text-zinc-200 font-medium truncate">{file.name}</p>
                                <p className="text-zinc-500 text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                        </div>

                        {status !== 'success' && !uploading && (
                            <button onClick={removeFile} className="text-zinc-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        )}

                        {status === 'success' && (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        )}
                    </div>

                    {status === 'error' && (
                        <div className="flex items-center text-red-500 text-sm mb-4">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            {errorMessage}
                        </div>
                    )}

                    {status === 'idle' && (
                        <Button onClick={uploadFile} className="w-full" size="sm">
                            Start Upload
                        </Button>
                    )}

                    {status === 'uploading' && (
                        <div className="w-full bg-zinc-800 rounded-full h-2.5 dark:bg-zinc-800 overflow-hidden relative">
                            <div className="bg-primary h-2.5 rounded-full animate-pulse w-full"></div>
                            {/* Note: Supabase JS client generic upload doesn't give granular progress easily without using TUS directly or XHR. 
                      For MVP, we show an indeterminate pulse or "Uploading state". 
                      If resizing happens, it might take a while. */}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
