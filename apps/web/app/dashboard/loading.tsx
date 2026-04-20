import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="container py-12 px-4 md:px-8 max-w-screen-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <div className="space-y-3">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-5 w-48" />
            </div>
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-32 rounded-full" />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="md:col-span-2 space-y-6">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>

            {/* Sidebar Area */}
            <div className="space-y-6">
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
            </div>
        </div>
    </div>
  );
}
