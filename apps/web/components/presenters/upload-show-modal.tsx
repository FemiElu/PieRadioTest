"use client";

import { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUploader } from "@/components/ui/file-uploader";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { Loader2, Music, Calendar, Type, FileText, Image as ImageIcon } from "lucide-react";

interface UploadShowModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    category?: string;
}

export function UploadShowModal({ open, onOpenChange, onSuccess, category }: UploadShowModalProps) {
    const { user } = useAuth();
    const supabase = createClient();
    
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        airedAt: new Date().toISOString().split('T')[0],
    });
    
    const [audioPath, setAudioPath] = useState<string | null>(null);
    const [imagePath, setImagePath] = useState<string | null>(null);
    const [duration, setDuration] = useState<number | null>(null);

    const handleAudioUploadComplete = (path: string) => {
        setAudioPath(path);
        
        // Try to get duration if possible
        // Note: data.path is just the relative path. We might need the full URL to get duration
        // but Supabase storage paths are predictable.
        // For now, we'll try to get it from the file itself if we had access, 
        // but FileUploader already uploaded it.
        // We could also get it in FileUploader before upload.
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!audioPath) {
            toast.error("Please upload the show audio file.");
            return;
        }

        if (!formData.title) {
            toast.error("Please provide a title for the show.");
            return;
        }

        setLoading(true);
        
        try {
            const { error } = await supabase
                .from("episodes")
                .insert({
                    presenter_id: category ? null : user?.id,
                    title: formData.title,
                    description: formData.description,
                    aired_at: new Date(formData.airedAt).toISOString(),
                    file_key: audioPath,
                    cover_image_url: imagePath,
                    duration_seconds: duration,
                    published_at: new Date().toISOString(),
                    category: category || null,
                });

            if (error) throw error;

            toast.success("Show uploaded successfully!");
            onOpenChange(false);
            resetForm();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error.message || "Failed to save show details.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            airedAt: new Date().toISOString().split('T')[0],
        });
        setAudioPath(null);
        setImagePath(null);
        setDuration(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Music className="w-6 h-6 text-primary" />
                        Upload Recent Show
                    </DialogTitle>
                    <DialogDescription>
                        Share your recently aired show with your listeners. 
                        Max audio file size is 150MB.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-4">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="flex items-center gap-2">
                                <Type className="w-4 h-4" />
                                Show Title
                            </Label>
                            <Input 
                                id="title" 
                                placeholder="e.g. Monday Morning Mix - Week 18" 
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        {/* Date Aired */}
                        <div className="space-y-2">
                            <Label htmlFor="airedAt" className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Date Aired
                            </Label>
                            <Input 
                                id="airedAt" 
                                type="date"
                                value={formData.airedAt}
                                onChange={(e) => setFormData({ ...formData, airedAt: e.target.value })}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Description (Optional)
                            </Label>
                            <Textarea 
                                id="description" 
                                placeholder="What happened in this show? Tracklist, guests, etc." 
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="min-h-[100px]"
                            />
                        </div>

                        {/* Audio Upload */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Music className="w-4 h-4" />
                                Audio File (MP3)
                            </Label>
                            <FileUploader 
                                bucket="pie-episodes"
                                acceptedFileTypes={["audio/mpeg", "audio/mp3"]}
                                maxSizeMB={150}
                                onUploadComplete={handleAudioUploadComplete}
                            />
                        </div>

                        {/* Cover Art Upload */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                Cover Art (Optional)
                            </Label>
                            <FileUploader 
                                bucket="images"
                                acceptedFileTypes={["image/jpeg", "image/png", "image/webp"]}
                                maxSizeMB={10}
                                onUploadComplete={(path) => setImagePath(path)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading || !audioPath}
                            className="min-w-[120px]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Upload Show"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
