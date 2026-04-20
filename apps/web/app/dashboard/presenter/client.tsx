"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Radio, Mic, Calendar, Upload, Music, AlertCircle } from "lucide-react";
import { PresenterMessagesList } from "@/components/presenters/messages-list";
import { SongRequestList } from "@/components/presenters/song-request-list";
import { PresenterMessage } from "@/actions/presenter-messages";
import { useCurrentShow } from "@/hooks/use-current-show";
import { toast } from "sonner";
import { createTestShow, seedTestRequests } from "@/app/actions/demo";
import { Plus, Database, FlaskConical } from "lucide-react";

interface DashboardClientProps {
    initialMessages: PresenterMessage[];
}

export function DashboardClient({ initialMessages }: DashboardClientProps) {
    const { user, profile } = useAuth();
    const [isLive, setIsLive] = useState(false);
    const { currentShow, loading: showLoading } = useCurrentShow();

    // Determine if the current show belongs to this presenter
    // useCurrentShow maps the presenter's full_name to shows.host_id
    const isOurShow = currentShow?.shows?.host_id === profile?.full_name;
    
    const activeShowId = isOurShow ? currentShow?.id : null;

    const toggleLiveStatus = async () => {
        // TODO: Implement API call to update station_metadata
        // This would call the /api/stations/metadata endpoint
        setIsLive(!isLive);
    };

    return (
        <div className="container py-12 px-4 md:px-8 max-w-screen-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-display tracking-tight">
                        Presenter Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Welcome back, {profile?.full_name || profile?.username || user?.email}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Live Status Indicator */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${isLive
                        ? "bg-red-500/10 border-red-500/50 text-red-500"
                        : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500"
                        }`}>
                        <div className={`w-3 h-3 rounded-full ${isLive ? "bg-red-500 animate-pulse" : "bg-zinc-400"
                            }`} />
                        <span className="font-bold text-sm uppercase tracking-wider">
                            {isLive ? "ON AIR" : "OFF AIR"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Control Card */}
                <div className="md:col-span-2 space-y-6">
                    {/* Broadcast Controls */}
                    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Radio className="w-5 h-5 text-primary" />
                            Broadcast Controls
                        </h2>
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border/50">
                            <div>
                                <h3 className="font-medium">Live Status Indication</h3>
                                <p className="text-sm text-muted-foreground">
                                    Signify you are now live to admin & listeners.
                                </p>
                            </div>
                            <Button
                                variant={isLive ? "destructive" : "default"}
                                onClick={toggleLiveStatus}
                                className="min-w-32"
                            >
                                <Mic className="w-4 h-4 mr-2" />
                                {isLive ? "Go Offline" : "Go Live"}
                            </Button>
                        </div>
                    </div>

                    {/* Now Playing Editor */}
                    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Music className="w-5 h-5 text-primary" />
                            Now Playing
                        </h2>
                        <div className="flex items-center justify-center p-8 bg-muted/30 rounded-lg border border-dashed border-border">
                            <div className="text-center text-muted-foreground">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Stream metadata updates coming soon</p>
                                <p className="text-sm">Sync with your broadcast software</p>
                            </div>
                        </div>
                    </div>

                    {/* Song Requests Section (Live only for this presenter's show) */}
                    {activeShowId ? (
                        <SongRequestList showId={activeShowId} />
                    ) : (
                        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                                <Music className="w-5 h-5 text-primary" />
                                Song Requests
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {showLoading 
                                    ? "Checking for active shows..." 
                                    : "You don't have an active show in the schedule right now. Requests will appear here when your show is live."}
                            </p>
                        </div>
                    )}

                    {/* Messages List */}
                    <PresenterMessagesList initialMessages={initialMessages} />
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                        <div className="space-y-2">
                            <Button 
                                variant="outline" 
                                className="w-full justify-start gap-2"
                                onClick={() => {
                                    const el = document.getElementById('song-requests-section');
                                    el?.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                <Music className="w-4 h-4" />
                                Song Requests
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-2">
                                <Calendar className="w-4 h-4" />
                                Check Schedule
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-2">
                                <Upload className="w-4 h-4" />
                                Upload Show
                            </Button>
                        </div>
                    </div>

                    {/* Role Badge */}
                    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                        <h2 className="text-sm font-medium text-muted-foreground mb-2">
                            Your Role
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${profile?.role === 'admin'
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                }`}>
                                {profile?.role === 'admin' ? '👑 Admin' : '🎙️ Presenter'}
                            </span>
                        </div>
                    </div>

                    {/* Developer Tools (Admin or Dev Mode) */}
                    {(profile?.role === 'admin' || profile?.role === 'presenter') && (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
                                <FlaskConical className="w-5 h-5" />
                                Demo Mode
                            </h2>
                            <div className="space-y-3">
                                <Button 
                                    className="w-full justify-start gap-2" 
                                    onClick={async () => {
                                        try {
                                            toast.loading("Creating test show...", { id: "demo-show" });
                                            await createTestShow();
                                            toast.success("Test show created! Dashboard will refresh.", { id: "demo-show" });
                                            // useCurrentShow will pick up the new show via its interval or we can force reload
                                            window.location.reload();
                                        } catch (e: any) {
                                            toast.error(e.message, { id: "demo-show" });
                                        }
                                    }}
                                >
                                    <Plus className="w-4 h-4" />
                                    Start 1h Test Show
                                </Button>

                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start gap-2" 
                                    disabled={!activeShowId}
                                    onClick={async () => {
                                        if (!activeShowId) return;
                                        try {
                                            toast.loading("Seeding requests...", { id: "seed-req" });
                                            await seedTestRequests(activeShowId);
                                            toast.success("3 dummy requests added!", { id: "seed-req" });
                                        } catch (e: any) {
                                            toast.error(e.message, { id: "seed-req" });
                                        }
                                    }}
                                >
                                    <Database className="w-4 h-4" />
                                    Simulate 3 Requests
                                </Button>
                                
                                {!activeShowId && (
                                    <p className="text-[10px] text-muted-foreground mt-2 italic">
                                        * You must have an active show to simulate requests.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
