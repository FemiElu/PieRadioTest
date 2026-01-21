import { requireServerAdmin } from "@/lib/auth/server-auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata = {
  title: 'Admin Dashboard | Pie Radio',
  description: 'Pie Radio administration panel',
};

/**
 * Admin Layout
 * 
 * Server Component that provides the admin layout wrapper.
 * Authentication and role checking is handled by:
 * 1. Middleware (first line of defense, checks role before page loads)
 * 2. requireServerAdmin (second check, redirects if somehow bypassed)
 * 
 * This provides server-side security (not just client-side checks).
 */
export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Server-side role verification - will redirect to /unauthorized if not admin
  // This is a backup to middleware, which should have already caught unauthorized access
  await requireServerAdmin('/admin');

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  );
}
