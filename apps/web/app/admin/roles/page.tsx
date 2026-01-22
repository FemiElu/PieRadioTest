import { requireServerAdmin } from "@/lib/auth/server-auth";
import { createClient } from "@/lib/supabase/server";
import { RoleManagementTable } from "@/components/admin/role-management-table";
import { Users, Shield, AlertTriangle } from "lucide-react";

export const metadata = {
    title: 'User Roles | Admin | Pie Radio',
    description: 'Manage user roles and permissions',
};

async function getUsersWithRoles() {
    const supabase = await createClient();

    const { data: users, error } = await supabase
        .from('profiles')
        .select('id, email, username, full_name, role, avatar_url, bio, is_live, slug, created_at, updated_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Failed to fetch users:', error);
        return [];
    }

    return users || [];
}

async function getRoleStats() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('role');

    if (error) {
        return { listener: 0, presenter: 0, admin: 0 };
    }

    const stats = { listener: 0, presenter: 0, admin: 0 };
    data?.forEach(profile => {
        if (profile.role && profile.role in stats) {
            stats[profile.role as keyof typeof stats]++;
        }
    });

    return stats;
}

export default async function AdminRolesPage() {
    // Server-side admin verification
    await requireServerAdmin('/admin/roles');

    const [users, stats] = await Promise.all([
        getUsersWithRoles(),
        getRoleStats()
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black font-display tracking-tight text-[#141827]">User Roles</h1>
                <p className="text-zinc-500 font-medium mt-1">
                    Manage user permissions and role assignments
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Users className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.listener}</p>
                            <p className="text-sm text-muted-foreground">Listeners</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                            <Shield className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.presenter}</p>
                            <p className="text-sm text-muted-foreground">Presenters</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                            <AlertTriangle className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.admin}</p>
                            <p className="text-sm text-muted-foreground">Admins</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Management Table */}
            <div className="rounded-xl border border-border/50 bg-card shadow-sm">
                <div className="p-4 border-b border-border/50">
                    <h2 className="text-lg font-semibold">All Users</h2>
                    <p className="text-sm text-muted-foreground">
                        Click on a user&apos;s role to change it
                    </p>
                </div>
                <RoleManagementTable users={users} />
            </div>
        </div>
    );
}
