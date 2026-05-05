"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import {
    Search,
    Filter,
    Plus,
    MoreVertical,
    Edit2,
    Trash2,
    RefreshCw,
    Newspaper,
    Eye,
    MessageSquare,
    Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NewsArticleCard } from "@/lib/news/types";
import { FileUploader } from "@/components/ui/file-uploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Save, Image as ImageIcon } from "lucide-react";

export function AdminNewsClient() {
    const router = useRouter();
    const [articles, setArticles] = useState<NewsArticleCard[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Spotlight State
    const [spotlight, setSpotlight] = useState<any>(null);
    const [isSavingSpotlight, setIsSavingSpotlight] = useState(false);
    const [spotlightForm, setSpotlightForm] = useState({
        title: "Artist of the Month",
        artist_name: "",
        image_url: "",
        link_url: "",
    });

    const fetchSpotlight = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/spotlight');
            if (res.ok) {
                const data = await res.json();
                if (data.id) {
                    setSpotlight(data);
                    setSpotlightForm({
                        title: data.title,
                        artist_name: data.artist_name,
                        image_url: data.image_url,
                        link_url: data.link_url || "",
                    });
                }
            }
        } catch (err) {
            console.error("Failed to fetch spotlight", err);
        }
    }, []);

    const fetchArticles = useCallback(async () => {
        setIsLoading(true);
        try {
            const qs = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                status: statusFilter,
            });
            if (searchQuery) qs.set("search", searchQuery);

            const res = await fetch(`/api/admin/news?${qs.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch articles");

            const data = await res.json();
            setArticles(data.articles);
            setTotal(data.meta.total);
        } catch (err) {
            console.error(err);
            // In a real app we'd trigger a toast error
        } finally {
            setIsLoading(false);
        }
    }, [page, searchQuery, statusFilter]);

    useEffect(() => {
        fetchArticles();
        fetchSpotlight();
    }, [fetchArticles, fetchSpotlight]);

    const handleSaveSpotlight = async () => {
        if (!spotlightForm.artist_name || !spotlightForm.image_url) {
            toast.error("Artist Name and Image are required");
            return;
        }

        setIsSavingSpotlight(true);
        try {
            const res = await fetch('/api/admin/spotlight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(spotlightForm),
            });

            if (res.ok) {
                toast.success("Spotlight updated successfully");
                fetchSpotlight();
            } else {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to save spotlight");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to save spotlight");
        } finally {
            setIsSavingSpotlight(false);
        }
    };

    const handleDelete = async (id: string, currentStatus: string) => {
        if (currentStatus === "archived") return;
        if (!confirm("Are you sure you want to archive this article?")) return;

        try {
            const res = await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchArticles();
            } else {
                throw new Error("Failed to delete");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleStatus = async (article: NewsArticleCard) => {
        const newStatus = article.status === "published" ? "draft" : "published";
        try {
            const res = await fetch(`/api/admin/news/${article.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                fetchArticles();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex flex-col gap-8 mt-4">
            {/* Spotlight Management Section */}
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border/50 bg-zinc-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-bold text-[#141827]">Home Page Spotlight</h2>
                            <p className="text-xs text-zinc-500">Manage the &quot;Artist of the Month&quot; section</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleSaveSpotlight}
                        disabled={isSavingSpotlight}
                        className="rounded-xl gap-2 shadow-lg shadow-primary/20"
                    >
                        {isSavingSpotlight ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Update Spotlight
                    </Button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="spotlight-title">Section Title</Label>
                            <Input
                                id="spotlight-title"
                                placeholder="Artist of the Month"
                                value={spotlightForm.title}
                                onChange={(e) => setSpotlightForm(prev => ({ ...prev, title: e.target.value }))}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="artist-name">Artist Name</Label>
                            <Input
                                id="artist-name"
                                placeholder="Enter artist name..."
                                value={spotlightForm.artist_name}
                                onChange={(e) => setSpotlightForm(prev => ({ ...prev, artist_name: e.target.value }))}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="link-url">Action Link (Optional)</Label>
                            <Input
                                id="link-url"
                                placeholder="https://..."
                                value={spotlightForm.link_url}
                                onChange={(e) => setSpotlightForm(prev => ({ ...prev, link_url: e.target.value }))}
                                className="rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label>Spotlight Image</Label>
                        {spotlightForm.image_url ? (
                            <div className="relative aspect-video rounded-2xl overflow-hidden border border-border group">
                                <NextImage
                                    src={spotlightForm.image_url}
                                    alt="Spotlight Preview"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setSpotlightForm(prev => ({ ...prev, image_url: "" }))}
                                        className="rounded-xl gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Change Image
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <FileUploader
                                bucket="news-images"
                                folderPath="spotlights"
                                acceptedFileTypes={["image/jpeg", "image/png", "image/webp"]}
                                onUploadComplete={(path) => {
                                    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/news-images/${path}`;
                                    setSpotlightForm(prev => ({ ...prev, image_url: publicUrl }));
                                }}
                                onUploadError={(err) => toast.error(err)}
                                className="h-[200px]"
                            />
                        )}
                        <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest text-center">
                            Recommended size: 1200x800px (3:2 or 16:9 aspect ratio)
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-zinc-50/50">
                    <div className="flex flex-col sm:flex-row gap-4 flex-1">
                        {/* Search Box */}
                        <div className="relative group w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search articles by title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 bg-white border border-border/50 rounded-xl pl-10 pr-4 text-sm outline-none transition-all placeholder:text-zinc-400 hover:border-zinc-300 focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-sm"
                                onKeyDown={(e) => e.key === "Enter" && fetchArticles()}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="h-11 bg-white border border-border/50 rounded-xl flex items-center px-4 gap-2 shadow-sm relative focus-within:ring-2 ring-primary/20 transition-all">
                                <Filter className="w-4 h-4 text-zinc-400" />
                                <select
                                    className="bg-transparent text-sm font-bold text-[#141827] outline-none appearance-none pr-4 cursor-pointer"
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <option value="all">All Status</option>
                                    <option value="published">Published</option>
                                    <option value="draft">Drafts</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={fetchArticles}
                                className="h-11 w-11 rounded-xl"
                            >
                                <RefreshCw
                                    className={cn("w-4 h-4", isLoading && "animate-spin")}
                                />
                            </Button>
                        </div>
                    </div>

                    <Link href="/admin/news/new">
                        <Button className="h-11 px-6 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all gap-2 group whitespace-nowrap">
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            New Article
                        </Button>
                    </Link>
                </div>

                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-zinc-400 min-h-[400px]">
                        <RefreshCw className="w-8 h-8 animate-spin mb-4 text-primary" />
                        <p className="font-bold">Loading articles...</p>
                    </div>
                ) : articles.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-zinc-400 min-h-[400px]">
                        <Newspaper className="w-12 h-12 mb-4 text-zinc-200" />
                        <p className="font-bold text-lg text-zinc-500">No articles found</p>
                        <p className="text-sm">Try adjusting your filters or create a new one.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50/80 text-zinc-500 text-xs uppercase tracking-wider font-bold">
                                    <th className="px-6 py-4 border-b border-border/50 whitespace-nowrap">
                                        Article Info
                                    </th>
                                    <th className="px-6 py-4 border-b border-border/50">Status</th>
                                    <th className="px-6 py-4 border-b border-border/50">Details</th>
                                    <th className="px-6 py-4 border-b border-border/50 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50 text-sm">
                                {articles.map((article) => (
                                    <tr
                                        key={article.id}
                                        className="hover:bg-zinc-50 transition-colors group"
                                    >
                                        <td className="px-6 py-4 align-top">
                                            <div className="flex gap-4">
                                                {article.cover_image_url ? (
                                                    <div className="relative w-16 h-16 shrink-0 mt-1">
                                                        <NextImage
                                                            src={article.cover_image_url}
                                                            alt={article.title}
                                                            fill
                                                            className="object-cover rounded-xl shadow-sm"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-16 h-16 rounded-xl bg-zinc-100 flex items-center justify-center mt-1 border border-zinc-200 shadow-sm shrink-0">
                                                        <Newspaper className="w-6 h-6 text-zinc-300" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {article.is_breaking && (
                                                            <span className="px-2 py-0.5 bg-red-100 text-red-600 font-bold uppercase tracking-wider text-[10px] rounded leading-none shrink-0">
                                                                Breaking
                                                            </span>
                                                        )}
                                                        <p className="font-bold font-display text-base text-[#141827] line-clamp-2">
                                                            {article.title}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-zinc-500 font-mono mb-2">
                                                        /{article.slug}
                                                    </p>
                                                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                                        <span className="text-primary truncate max-w-[120px]">
                                                            {article.category}
                                                        </span>
                                                        <span className="w-1 h-1 rounded-full bg-zinc-300" />
                                                        <span className="truncate max-w-[120px]">
                                                            {article.tier}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(article)}
                                                className={cn(
                                                    "px-3 py-1 text-xs uppercase font-bold tracking-wider rounded-full shrink-0 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95",
                                                    article.status === "published"
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : article.status === "archived"
                                                            ? "bg-zinc-200 text-zinc-600"
                                                            : "bg-amber-100 text-amber-700"
                                                )}
                                                title="Click to toggle status"
                                            >
                                                <span
                                                    className={cn(
                                                        "w-1.5 h-1.5 rounded-full inline-block",
                                                        article.status === "published"
                                                            ? "bg-emerald-500"
                                                            : article.status === "archived"
                                                                ? "bg-zinc-400"
                                                                : "bg-amber-500"
                                                    )}
                                                />
                                                {article.status}
                                            </button>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="flex items-center gap-1 text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded"
                                                        title="Likes"
                                                    >
                                                        <Heart className="w-3 h-3 text-red-500" />{" "}
                                                        {article.likes_count}
                                                    </span>
                                                    <span
                                                        className="flex items-center gap-1 text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded"
                                                        title="Comments"
                                                    >
                                                        <MessageSquare className="w-3 h-3 text-blue-500" />{" "}
                                                        {article.comments_count}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex flex-col gap-1">
                                                    <span>Created: {new Date(article.created_at!).toLocaleDateString()}</span>
                                                    {article.published_at && (
                                                        <span className="text-emerald-600">Pub: {new Date(article.published_at!).toLocaleDateString()}</span>
                                                    )}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/admin/news/${article.id}/edit`}
                                                    className="p-2 text-zinc-400 hover:bg-zinc-100 hover:text-[#141827] rounded-xl transition-all"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/news/${article.slug}`}
                                                    target="_blank"
                                                    className="p-2 text-zinc-400 hover:bg-primary/10 hover:text-primary rounded-xl transition-all"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(article.id, article.status)}
                                                    disabled={article.status === "archived"}
                                                    className={cn(
                                                        "p-2 rounded-xl transition-all",
                                                        article.status === "archived"
                                                            ? "text-zinc-200 cursor-not-allowed"
                                                            : "text-red-400 hover:bg-red-50 hover:text-red-600"
                                                    )}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-4 border-t border-border/50 flex items-center justify-between text-sm bg-zinc-50/50">
                            <span className="font-bold text-zinc-500">
                                Showing {(page - 1) * 20 + 1} to{" "}
                                {Math.min(page * 20, total)} of {total} articles
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className="font-bold rounded-xl"
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page * 20 >= total}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="font-bold rounded-xl"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

