import { Skeleton } from "@/components/ui/skeleton";

export default function EventsLoading() {
  return (
    <div className="flex flex-col min-h-screen pb-20">
      <div className="container mx-auto max-w-7xl space-y-8 py-6 md:py-10 px-4 md:px-0">
        {/* Header Section Replica */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight text-[#141827]">
            LIVE <span className="text-primary italic">EVENTS</span>
          </h1>
          <p className="text-zinc-500 text-lg font-medium max-w-2xl">
            Experience the sound live. From exclusive studio sessions to underground gigs and massive festivals.
          </p>
        </div>

        {/* Skeleton for Filter/Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Skeleton className="h-12 w-full md:w-1/3 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
        </div>

        {/* Skeleton for Featured Event Component (if any) */}
        <div className="mb-12">
           <Skeleton className="w-full h-[40vh] md:h-[60vh] rounded-2xl" />
        </div>

        {/* Skeleton for Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[250px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
