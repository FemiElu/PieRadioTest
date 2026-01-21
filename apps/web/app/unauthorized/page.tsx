import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Access Denied | Pie Radio',
    description: 'You do not have permission to access this page.',
};

/**
 * Unauthorized access page
 * 
 * Displayed when a user tries to access a page they don't have permission for.
 * Provides friendly messaging and navigation options.
 */
export default function UnauthorizedPage() {
    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4">
            <div className="text-center space-y-6 max-w-md">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-destructive/10">
                        <ShieldAlert className="w-16 h-16 text-destructive" />
                    </div>
                </div>

                {/* Main Message */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold font-display tracking-tight">
                        Access Denied
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        You don&apos;t have permission to access this page.
                    </p>
                </div>

                {/* Additional Info */}
                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                    <p>
                        This page requires additional permissions. If you believe this is an error,
                        please contact an administrator or try logging in with a different account.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button asChild variant="default" size="lg">
                        <Link href="/" className="gap-2">
                            <Home className="w-4 h-4" />
                            Go Home
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/login" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Link>
                    </Button>
                </div>

                {/* Error Code */}
                <p className="text-xs text-muted-foreground/60 pt-4">
                    Error Code: 403 - Forbidden
                </p>
            </div>
        </div>
    );
}
