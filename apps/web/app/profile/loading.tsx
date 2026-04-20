import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="container max-w-5xl py-8">
      {/* Optional Alert Skeleton */}
      <Skeleton className="mb-8 w-full h-[72px] rounded-lg" />

      {/* Profile Header Skeleton */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
         <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full shrink-0" />
         <div className="flex flex-col gap-3 flex-1 w-full">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-5 w-[150px]" />
            <div className="flex gap-2 mt-2">
               <Skeleton className="h-6 w-20 rounded-full" />
               <Skeleton className="h-6 w-24 rounded-full" />
            </div>
         </div>
      </div>

      <div className="mt-8">
        {/* Profile Tabs Skeleton */}
        <div className="flex gap-4 border-b border-border mb-6">
           <Skeleton className="h-10 w-24 rounded-t-md" />
           <Skeleton className="h-10 w-28 rounded-t-md" />
           <Skeleton className="h-10 w-20 rounded-t-md hidden sm:block" />
        </div>

        {/* Tab Content Skeleton (Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
           {Array.from({ length: 6 }).map((_, i) => (
             <div key={i} className="flex flex-col gap-3">
                <Skeleton className="w-full h-[200px] rounded-xl" />
                <Skeleton className="h-5 w-[140px]" />
                <Skeleton className="h-4 w-[100px]" />
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
