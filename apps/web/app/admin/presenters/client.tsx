"use client";

import { useState, useEffect, useCallback } from "react";
import { Mic2, Plus, Edit, Trash2, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PresenterFormModal, PresenterFormData } from "@/components/admin/presenter-form-modal";

// Presenter type for display
interface DisplayPresenter {
    id: string;
    full_name: string | null;
    username: string | null;
    slug: string | null;
    email: string | null;
    avatar_url: string | null;
    bio: string | null;
    is_live: boolean | null;
    role: string | null;
    created_at: string | null;
    presenter_meta: {
        category: string | null;
        instagram_handle: string | null;
        twitter_handle: string | null;
        website_url: string | null;
    } | null;
}

export default function AdminPresentersClient() {
    const [presenters, setPresenters] = useState<DisplayPresenter[]>([]);
    const [unreadByPresenter, setUnreadByPresenter] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPresenter, setSelectedPresenter] = useState<PresenterFormData | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();

    const fetchPresenters = useCallback(async () => {
        setIsLoading(true);
        const supabase = createClient();

        try {
            const [presentersResponse, messagesResponse] = await Promise.all([
                // Fetch presenters with their metadata
                supabase
                    .from("profiles")
                    .select(`
                        id,
                        full_name,
                        username,
                        slug,
                        email,
                        avatar_url,
                        bio,
                        is_live,
                        role,
                        created_at,
                        presenter_meta (
                            category,
                            instagram_handle,
                            twitter_handle,
                            website_url
                        )
                    `)
                    .eq("role", "presenter")
                    .order("full_name"),

                // Fetch unread message counts
                supabase
                    .from("presenter_messages")
                    .select("presenter_id")
                    .eq("is_read", false)
            ]);

            if (!presentersResponse.error && presentersResponse.data) {
                setPresenters(presentersResponse.data as DisplayPresenter[]);
            }

            if (messagesResponse.data) {
                const counts = messagesResponse.data.reduce((acc: Record<string, number>, msg: { presenter_id: string }) => {
                    acc[msg.presenter_id] = (acc[msg.presenter_id] || 0) + 1;
                    return acc;
                }, {});
                setUnreadByPresenter(counts);
            }

            // Check for edit parameter after loading presenters
            const editId = searchParams.get("edit");
            if (editId && presentersResponse.data) {
                const presenterToEdit = (presentersResponse.data as DisplayPresenter[]).find(p => p.id === editId);
                if (presenterToEdit) {
                    handleEditPresenter(presenterToEdit);
                    // Clear the param without refreshing
                    const newParams = new URLSearchParams(searchParams.toString());
                    newParams.delete("edit");
                    router.replace(`/admin/presenters?${newParams.toString()}`);
                }
            }
        } catch (error) {
            console.error("Error fetching presenters:", error);
        } finally {
            setIsLoading(false);
        }
    }, [searchParams, router]);

    useEffect(() => {
        fetchPresenters();
    }, [fetchPresenters]);

    const handleEditPresenter = (presenter: DisplayPresenter) => {
        const formData: PresenterFormData = {
            id: presenter.id,
            full_name: presenter.full_name || "",
            username: presenter.username || "",
            email: presenter.email || "",
            bio: presenter.bio || "",
            avatar_url: presenter.avatar_url || "",
            category: presenter.presenter_meta?.category || "Main Station",
            instagram_handle: presenter.presenter_meta?.instagram_handle || "",
            twitter_handle: presenter.presenter_meta?.twitter_handle || "",
            website_url: presenter.presenter_meta?.website_url || "",
        };
        setSelectedPresenter(formData);
        setIsModalOpen(true);
    };

    const handleAddPresenter = () => {
        setSelectedPresenter(null);
        setIsModalOpen(true);
    };

    const handleModalSuccess = () => {
        fetchPresenters();
    };

    const totalUnread = Object.values(unreadByPresenter).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black font-display tracking-tight text-[#141827]">Presenters</h1>
                    <p className="text-zinc-500 font-medium mt-1">Manage your radio presenters and their profiles</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchPresenters} className="rounded-xl gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                    <Button onClick={handleAddPresenter} className="rounded-xl gap-2">
                        <Plus className="w-4 h-4" />
                        Add Presenter
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Mic2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{presenters.length}</p>
                            <p className="text-sm text-muted-foreground">Total Presenters</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{presenters.filter(p => p.is_live).length}</p>
                            <p className="text-sm text-muted-foreground">Currently Live</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Mail className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{totalUnread}</p>
                            <p className="text-sm text-muted-foreground">Unread Messages</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Presenters Table */}
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-zinc-50">
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Presenter</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Messages</th>
                                <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            Loading presenters...
                                        </div>
                                    </td>
                                </tr>
                            ) : presenters.length > 0 ? (
                                presenters.map((presenter) => (
                                    <tr key={presenter.id} className="hover:bg-zinc-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-100">
                                                    {presenter.avatar_url ? (
                                                        <Image
                                                            src={presenter.avatar_url}
                                                            alt={presenter.full_name || ""}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold">
                                                            {(presenter.full_name || "P").charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">{presenter.full_name || presenter.username}</p>
                                                    <p className="text-sm text-muted-foreground">{presenter.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                                                {presenter.presenter_meta?.category || "Main Station"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {presenter.is_live ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                    Live
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600">
                                                    Offline
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {unreadByPresenter[presenter.id] ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                                    {unreadByPresenter[presenter.id]} unread
                                                </span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/presenters/${presenter.slug || presenter.username}`}>
                                                    <Button variant="outline" size="sm" className="rounded-lg gap-1.5">
                                                        View
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-lg gap-1.5"
                                                    onClick={() => handleEditPresenter(presenter)}
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                    Edit
                                                </Button>
                                                <Button variant="outline" size="sm" className="rounded-lg text-red-600 hover:bg-red-50 hover:border-red-200">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center">
                                                <Mic2 className="w-8 h-8 text-zinc-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">No presenters yet</p>
                                                <p className="text-sm text-muted-foreground">Add your first presenter to get started</p>
                                            </div>
                                            <Button onClick={handleAddPresenter} className="mt-2 rounded-xl gap-2">
                                                <Plus className="w-4 h-4" />
                                                Add Presenter
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h3 className="font-bold text-blue-900 mb-2">💡 How Presenters Work</h3>
                <p className="text-sm text-blue-800">
                    Presenters are users with the <code className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">presenter</code> role.
                    To add a new presenter, either create a new user account and set their role to presenter,
                    or upgrade an existing user&apos;s role in the User Management section.
                </p>
            </div>

            {/* Presenter Form Modal */}
            <PresenterFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                presenter={selectedPresenter}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
}
