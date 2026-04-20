'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Music2, UploadCloud, Image as ImageIcon, CheckCircle2, Loader2, ArrowLeft, Radio, X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { submitTrackMetadata } from '@/app/actions/tracks';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

const GENRES = ['AfroBeats', 'R&B', 'Hip Hop', 'Amapiano', 'Dancehall', 'UK Drill', 'Grime', 'House', 'Pop', 'Alternative'];

interface ScheduleShow {
    title: string;
    image_url: string | null;
    presenterName: string | null;
}

export default function TrackUploadPage() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const supabase = createClient();

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [pitchNotes, setPitchNotes] = useState('');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [selectedShows, setSelectedShows] = useState<string[]>([]);
    const [shows, setShows] = useState<ScheduleShow[]>([]);
    const [showsLoading, setShowsLoading] = useState(true);

    const audioInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // Fetch distinct shows from the schedules view (real show data)
    useEffect(() => {
        const fetchShows = async () => {
            setShowsLoading(true);
            const { data, error } = await (supabase.from('schedules' as any) as any)
                .select('title, image_url, presenter:presenter_id(full_name)')
                .order('title', { ascending: true });

            if (error) {
                console.error('Failed to fetch shows from schedules:', error);
            } else {
                // Deduplicate by title — same show runs weekly
                const seen = new Set<string>();
                const uniqueShows: ScheduleShow[] = [];
                for (const entry of (data || [])) {
                    const showTitle = entry.title as string;
                    if (showTitle && !seen.has(showTitle)) {
                        seen.add(showTitle);
                        uniqueShows.push({
                            title: showTitle,
                            image_url: entry.image_url as string | null,
                            presenterName: entry.presenter?.full_name || null,
                        });
                    }
                }
                setShows(uniqueShows);
            }
            setShowsLoading(false);
        };

        fetchShows();
    }, [supabase]);

    const toggleShowSelection = (showTitle: string) => {
        setSelectedShows(prev => {
            if (prev.includes(showTitle)) {
                return prev.filter(t => t !== showTitle);
            }
            if (prev.length >= 2) {
                toast.error('You can select up to 2 shows.');
                return prev;
            }
            return [...prev, showTitle];
        });
    };

    const handleAudioDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && (file.type === 'audio/mpeg' || file.type === 'audio/wav')) {
            setAudioFile(file);
        } else {
            toast.error('Please upload a valid MP3 or WAV file.');
        }
    };

    const handleCoverDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setCoverFile(file);
        } else {
            toast.error('Please upload a valid image file.');
        }
    };

    const handleUpload = async () => {
        if (!title.trim() || !genre || !audioFile || !user) {
            toast.error('Please fill in all required fields and select an audio file.');
            return;
        }

        setIsUploading(true);
        setUploadProgress(10);

        try {
            // 1. Upload Audio
            const audioExt = audioFile.name.split('.').pop();
            const audioPath = `${user.id}/${Date.now()}_audio.${audioExt}`;

            const { error: audioUploadError } = await supabase.storage
                .from('track-submissions')
                .upload(audioPath, audioFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (audioUploadError) throw audioUploadError;
            setUploadProgress(50);

            // 2. Upload Cover Art (if exists)
            let coverPath = undefined;
            if (coverFile) {
                const coverExt = coverFile.name.split('.').pop();
                coverPath = `${user.id}/${Date.now()}_cover.${coverExt}`;
                const { error: coverUploadError } = await supabase.storage
                    .from('track-submissions')
                    .upload(coverPath, coverFile, {
                        cacheControl: '3600',
                        upsert: false
                    });
                if (coverUploadError) throw coverUploadError;
                setUploadProgress(80);
            }

            // 3. Submit Metadata
            const result = await submitTrackMetadata({
                title,
                genre,
                audio_url: audioPath,
                cover_art_url: coverPath,
                pitch_notes: pitchNotes,
                preferred_show_ids: selectedShows,
            });

            if (result.success) {
                setUploadProgress(100);
                toast.success('Track submitted successfully!');
                router.push('/profile');
            } else {
                throw new Error(result.error);
            }

        } catch (error: any) {
            console.error('Upload Error:', error);
            toast.error(error.message || 'Failed to upload track.');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="container max-w-3xl mx-auto py-10 px-4">
            <div className="mb-8">
                <Link href="/profile" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Profile
                </Link>
                <h1 className="text-4xl font-black font-display tracking-tight text-foreground uppercase italic mt-4">
                    Track <span className="text-primary">Submission</span>
                </h1>
                <p className="text-muted-foreground mt-2">
                    Submit your latest track for a chance to be featured on Pie Radio. Our A&R team reviews all submissions.
                </p>
            </div>

            <Card className="bg-card/50 backdrop-blur border-border/40 shadow-xl">
                <CardHeader>
                    <CardTitle>Track Details</CardTitle>
                    <CardDescription>Provide all the essential information about your release.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Audio File Upload */}
                    <div className="space-y-3">
                        <Label>Audio File (Required) <span className="text-red-500">*</span></Label>
                        <div
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${audioFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleAudioDrop}
                            onClick={() => audioInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                accept="audio/mpeg, audio/wav"
                                className="hidden"
                                ref={audioInputRef}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setAudioFile(file);
                                }}
                            />
                            {audioFile ? (
                                <div className="flex flex-col items-center gap-2">
                                    <CheckCircle2 className="w-10 h-10 text-primary" />
                                    <p className="font-semibold">{audioFile.name}</p>
                                    <p className="text-xs text-muted-foreground">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 cursor-pointer">
                                    <UploadCloud className="w-10 h-10 text-muted-foreground mb-2" />
                                    <p className="font-semibold text-sm">Click or drag MP3/WAV here</p>
                                    <p className="text-xs text-muted-foreground">High quality audio only (Max 50MB)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label htmlFor="title">Track Title <span className="text-red-500">*</span></Label>
                            <Input
                                id="title"
                                placeholder="e.g. Summer Vibes"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-3">
                            <Label>Primary Genre <span className="text-red-500">*</span></Label>
                            <Select value={genre} onValueChange={setGenre}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a genre" />
                                </SelectTrigger>
                                <SelectContent>
                                    {GENRES.map((g) => (
                                        <SelectItem key={g} value={g}>{g}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Cover Art Upload */}
                    <div className="space-y-3">
                        <Label>Cover Art (Optional)</Label>
                        <div
                            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${coverFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleCoverDrop}
                            onClick={() => coverInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={coverInputRef}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setCoverFile(file);
                                }}
                            />
                            {coverFile ? (
                                <div className="flex flex-col items-center gap-2">
                                    <CheckCircle2 className="w-8 h-8 text-primary" />
                                    <p className="font-semibold">{coverFile.name}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 cursor-pointer">
                                    <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                                    <p className="font-semibold text-sm">Click or drag Cover Art here</p>
                                    <p className="text-xs text-muted-foreground">Square image recommended (1080x1080px)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Show Preferences */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="flex items-center gap-2">
                                    <Radio className="w-4 h-4 text-primary" />
                                    Preferred Shows (Optional)
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Select up to 2 shows where you&apos;d love your track to be played. This helps our presenters route your music.
                                </p>
                            </div>
                            {selectedShows.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedShows([])}
                                    className="text-xs text-muted-foreground hover:text-destructive"
                                >
                                    <X className="w-3 h-3 mr-1" />
                                    Clear
                                </Button>
                            )}
                        </div>

                        {showsLoading ? (
                            <div className="flex items-center justify-center py-8 text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                <span className="text-sm">Loading shows...</span>
                            </div>
                        ) : shows.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
                                No shows available at the moment.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1">
                                {shows.map((show) => {
                                    const isSelected = selectedShows.includes(show.title);
                                    return (
                                        <button
                                            key={show.title}
                                            type="button"
                                            onClick={() => toggleShowSelection(show.title)}
                                            className={`
                                                flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200
                                                ${isSelected
                                                    ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10 ring-1 ring-primary/20'
                                                    : 'border-border hover:border-primary/30 hover:bg-muted/30'
                                                }
                                            `}
                                        >
                                            <div className={`
                                                w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors
                                                ${isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}
                                            `}>
                                                {isSelected ? (
                                                    <CheckCircle2 className="w-5 h-5" />
                                                ) : (
                                                    <Radio className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={`font-semibold text-sm truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                                    {show.title}
                                                </p>
                                                {show.presenterName && (
                                                    <span className="text-xs text-muted-foreground">
                                                        with {show.presenterName}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {selectedShows.length > 0 && (
                            <p className="text-xs text-primary font-medium">
                                {selectedShows.length}/2 show{selectedShows.length > 1 ? 's' : ''} selected
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="pitch">Pitch Notes (Optional)</Label>
                        <Textarea
                            id="pitch"
                            placeholder="Tell us the story behind the track, your inspirations, or why it should be played on Pie Radio..."
                            className="resize-none min-h-[120px]"
                            value={pitchNotes}
                            onChange={(e) => setPitchNotes(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">This helps our presenters connect with your music.</p>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t border-border/40 py-6 px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    {isUploading ? (
                        <div className="w-full sm:w-1/2">
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 text-center sm:text-left">Uploading... {uploadProgress}%</p>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground max-w-xs text-center sm:text-left">
                            By submitting, you confirm you own all rights to this track.
                        </p>
                    )}

                    <Button
                        size="lg"
                        onClick={handleUpload}
                        disabled={isUploading || !title.trim() || !genre || !audioFile}
                        className="w-full sm:w-auto font-bold uppercase tracking-wider"
                    >
                        {isUploading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                        ) : (
                            <><UploadCloud className="w-4 h-4 mr-2" /> Submit Track</>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

