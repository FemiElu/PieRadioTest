import { Skeleton } from "@/components/ui/skeleton";

export default function ScheduleLoading() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-background">
      {/* Page Header */}
      <section className="container px-4 md:px-8 py-10 max-w-screen-2xl mx-auto border-b border-border/50">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight text-foreground">
            Schedule
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Plan your listening. Never miss a show.
          </p>
        </div>
      </section>

      {/* Schedule Content Skeleton */}
      <section className="container py-8 md:py-16 px-4 md:px-8 max-w-screen-2xl mx-auto flex gap-6">
        {/* Sidebar Fake */}
        <div className="hidden lg:flex flex-col gap-2 w-48 shrink-0 py-12 border-r border-border/50 pr-6">
            <Skeleton className="w-full h-8 mb-4" />
            <Skeleton className="w-3/4 h-8 opacity-50" />
            <Skeleton className="w-full h-8 opacity-50" />
            <Skeleton className="w-1/2 h-8 opacity-50" />
        </div>
        
         {/* Main Grid Fake */}
        <div className="flex-1 flex flex-col gap-4">
             {/* Header row of dates */}
             <div className="flex gap-4 mb-4">
                <Skeleton className="h-16 w-32 rounded-xl" />
                <Skeleton className="h-16 w-32 rounded-xl" />
                <Skeleton className="h-16 w-32 rounded-xl" />
                <Skeleton className="h-16 w-32 rounded-xl hidden md:block" />
                <Skeleton className="h-16 w-32 rounded-xl hidden lg:block" />
             </div>

             {/* Timeslots */}
             <div className="space-y-4">
                 {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                        <Skeleton className="w-16 h-24 rounded-lg hidden sm:block shrink-0" />
                        <Skeleton className="w-full h-24 rounded-xl" />
                    </div>
                 ))}
             </div>
        </div>
      </section>
    </div>
  );
}
