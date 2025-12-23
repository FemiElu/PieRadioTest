"use client";

import Image from "next/image";
import Link from "next/link";
import { Instagram, Twitter, Globe, Music, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

type PresenterWithMeta = any;

export function PresenterGrid({ presenters }: { presenters: PresenterWithMeta[] }) {
    if (presenters.length === 0) {
        return (
            <div className="py-24 text-center space-y-4 bg-muted/30 rounded-3xl border-2 border-dashed border-border/60">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Music className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                    <p className="text-xl font-bold font-display">No presenters found</p>
                    <p className="text-muted-foreground">Our presenters are currently backstage. Check back soon!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {presenters.map((presenter) => (
                <div
                    key={presenter.id}
                    className="group relative flex flex-col bg-white rounded-3xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                >
                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/5 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Image Area */}
                    <div className="aspect-[4/5] relative overflow-hidden bg-zinc-100">
                        {presenter.avatar_url ? (
                            <Image
                                src={presenter.avatar_url}
                                alt={presenter.full_name || presenter.username}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-800 font-display font-black text-6xl select-none">
                                PIE
                            </div>
                        )}

                        {/* Status Overlay */}
                        {presenter.is_live && (
                            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                On Air
                            </div>
                        )}

                        {/* Social Overlay */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                            {presenter.presenter_meta?.instagram_handle && (
                                <a
                                    href={`https://instagram.com/${presenter.presenter_meta.instagram_handle}`}
                                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Instagram className="w-5 h-5" />
                                </a>
                            )}
                            {presenter.presenter_meta?.twitter_handle && (
                                <a
                                    href={`https://twitter.com/${presenter.presenter_meta.twitter_handle}`}
                                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Twitter className="w-5 h-5" />
                                </a>
                            )}
                            {presenter.presenter_meta?.website_url && (
                                <a
                                    href={presenter.presenter_meta.website_url}
                                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Globe className="w-5 h-5" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Info Area */}
                    <div className="p-6 text-center space-y-3">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-bold font-display tracking-tight group-hover:text-primary transition-colors">
                                {presenter.full_name || presenter.username}
                            </h3>
                            <p className="text-sm font-semibold text-primary/60 uppercase tracking-widest">
                                {presenter.username || "Host"}
                            </p>
                        </div>

                        {presenter.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed italic">
                                &quot;{presenter.bio}&quot;
                            </p>
                        )}

                        <div className="pt-2">
                            <Link
                                href={`/presenters/${presenter.username}`}
                                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-900 hover:text-primary transition-colors group/btn"
                            >
                                View Profile
                                <div className="w-6 h-px bg-zinc-900 group-hover/btn:bg-primary group-hover/btn:w-8 transition-all" />
                            </Link>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
