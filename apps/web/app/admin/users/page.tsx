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
                <h1 className="text-3xl font-black font-display tracking-tight text-[#141827]">User Management</h1>
            </div>

            <div className="bg-white border border-border shadow-sm rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span className="font-bold">Loading users...</span>
                    </div>
                ) : (
                    <RoleManagementTable users={users} />
                )}
            </div>
        </div>
    );
}
