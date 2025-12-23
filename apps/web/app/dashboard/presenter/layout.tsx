import { requireServerPresenterOrAdmin } from "@/lib/auth/server-auth";

export const metadata = {
    title: 'Presenter Dashboard | Pie Radio',
    description: 'Pie Radio presenter control panel',
};

/**
 * Presenter Dashboard Layout
 * 
 * Server Component that provides server-side role verification for presenter routes.
 * Authentication and role checking is handled by:
 * 1. Middleware (first line of defense)
 * 2. This layout (second check, redirects if somehow bypassed)
 */
export default async function PresenterLayout({
    children
}: {
    children: React.ReactNode
}) {
    // Server-side role verification - will redirect to /unauthorized if not presenter/admin
    await requireServerPresenterOrAdmin('/dashboard/presenter');

    return <>{children}</>;
}
