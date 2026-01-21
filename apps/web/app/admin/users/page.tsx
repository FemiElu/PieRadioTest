"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@packages/types";
import { formatDistanceToNow } from "date-fns";
import { RoleManagementTable } from "@/components/admin/role-management-table";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function UsersPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const supabase = createClient();

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false }); // Assuming created_at exists on profile, if not, remove order or use id

            if (!error && data) {
                setUsers(data);
            }
            setLoading(false);
        };

        fetchUsers();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">User Management</h1>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-zinc-500">Loading users...</div>
                ) : (
                    <RoleManagementTable users={users} />
                )}
            </div>
        </div>
    );
}
