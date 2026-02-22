"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@packages/types";
import {
    ChevronDown,
    Check,
    X,
    Loader2,
    User,
    Shield,
    Crown,
    Search,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserRole = Database["public"]["Enums"]["user_role"];

interface RoleManagementTableProps {
    users: Profile[];
}

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
    listener: {
        label: "Listener",
        icon: <User className="w-3 h-3" />,
        color: "bg-blue-500/10 text-blue-500 border-blue-500/20"
    },
    presenter: {
        label: "Presenter",
        icon: <Shield className="w-3 h-3" />,
        color: "bg-green-500/10 text-green-500 border-green-500/20"
    },
    admin: {
        label: "Admin",
        icon: <Crown className="w-3 h-3" />,
        color: "bg-purple-500/10 text-purple-500 border-purple-500/20"
    },
};

export function RoleManagementTable({ users: initialUsers }: RoleManagementTableProps) {
    const [users, setUsers] = useState(initialUsers);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    const filteredUsers = users.filter(user => {
        const search = searchQuery.toLowerCase();
        return (
            user.email?.toLowerCase().includes(search) ||
            user.username?.toLowerCase().includes(search) ||
            user.full_name?.toLowerCase().includes(search)
        );
    });

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        setError(null);
        setSaving(true);

        try {
            const response = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update role');
            }

            // Update local state
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, role: newRole } : u
            ));

            setEditingUserId(null);
            setPendingRole(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update role');
        } finally {
            setSaving(false);
        }
    };

    const startEditing = (userId: string, currentRole: UserRole | null) => {
        setEditingUserId(userId);
        setPendingRole(currentRole);
        setError(null);
    };

    const cancelEditing = () => {
        setEditingUserId(null);
        setPendingRole(null);
        setError(null);
    };

    return (
        <div>
            {/* Search */}
            <div className="p-4 border-b border-border/50">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mx-4 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                    <X className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border/50">
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                            <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => {
                            const isEditing = editingUserId === user.id;
                            const currentRole: UserRole = (user.role as UserRole) ?? 'listener';
                            const roleConfig = ROLE_CONFIG[currentRole];

                            return (
                                <tr
                                    key={user.id}
                                    className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                                >
                                    {/* User Info */}
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                                {user.avatar_url ? (
                                                    <Image
                                                        src={user.avatar_url}
                                                        alt={user.full_name || user.username || "User avatar"}
                                                        width={32}
                                                        height={32}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {user.full_name || user.username || "Unknown"}
                                                </p>
                                                {user.username && (
                                                    <p className="text-xs text-muted-foreground">
                                                        @{user.username}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Email */}
                                    <td className="p-4">
                                        <span className="text-sm text-muted-foreground">
                                            {user.email || "—"}
                                        </span>
                                    </td>

                                    {/* Role */}
                                    <td className="p-4">
                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={pendingRole || currentRole}
                                                    onChange={(e) => setPendingRole(e.target.value as UserRole)}
                                                    className="text-sm rounded-md border border-border bg-background px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                    disabled={saving}
                                                >
                                                    <option value="listener">Listener</option>
                                                    <option value="presenter">Presenter</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </div>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${roleConfig.color}`}>
                                                {roleConfig.icon}
                                                {roleConfig.label}
                                            </span>
                                        )}
                                    </td>

                                    {/* Joined */}
                                    <td className="p-4">
                                        <span className="text-sm text-muted-foreground">
                                            {user.created_at
                                                ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true })
                                                : "—"
                                            }
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="p-4 text-right">
                                        {isEditing ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={cancelEditing}
                                                    disabled={saving}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => pendingRole && handleRoleChange(user.id, pendingRole)}
                                                    disabled={saving || pendingRole === currentRole}
                                                >
                                                    {saving ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Check className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => startEditing(user.id, (user.role as UserRole) ?? null)}
                                            >
                                                <ChevronDown className="w-4 h-4 mr-1" />
                                                Change
                                            </Button>
                                        )}

                                        {(user.role as UserRole) === 'presenter' && (
                                            <Link href={`/admin/presenters?edit=${user.id}`}>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="ml-2 rounded-lg gap-1.5 text-xs text-primary border-primary/20 hover:bg-primary/5"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    Edit Profile
                                                </Button>
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}

                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                    {searchQuery
                                        ? "No users match your search"
                                        : "No users found"
                                    }
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div className="p-4 border-t border-border/50 text-sm text-muted-foreground">
                Showing {filteredUsers.length} of {users.length} users
            </div>
        </div >
    );
}
