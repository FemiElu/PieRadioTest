import { Skeleton } from "@/components/ui/skeleton";

export default function NewsLoading() {
  return (
    <div className="min-h-screen bg-white pb-24">
      <main className="container max-w-screen-2xl mx-auto px-4 md:px-8 py-6 md:py-10">
        
        {/* Skeleton for Top Filtering Bar */}
        <div className="mb-8 sticky top-16 bg-white/80 py-2 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex gap-2 w-full overflow-hidden">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-36 rounded-full hidden md:block" />
            <Skeleton className="h-10 w-20 rounded-full hidden md:block" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full shrink-0 ml-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Content (Left/Center) */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            
            {/* Skeleton for Breaking News Carousel */}
            <Skeleton className="w-full h-[40vh] md:h-[60vh] rounded-3xl" />

            {/* Skeleton for Main Feed */}
            <div>
              <div className="flex items-center justify-between mb-6">
                 <Skeleton className="h-8 w-48" />
                 <Skeleton className="h-5 w-32" />
              </div>
              
               <div className="flex flex-col gap-8">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col md:flex-row gap-6">
                        <Skeleton className="w-full md:w-[300px] h-[200px] rounded-3xl shrink-0" />
                        <div className="flex flex-col flex-1 gap-3 py-2">
                           <div className="flex gap-2">
                             <Skeleton className="w-20 h-6 outline-full rounded-md" />
                             <Skeleton className="w-16 h-6 outline-full rounded-md" />
                           </div>
                           <Skeleton className="w-full h-8" />
                           <Skeleton className="w-3/4 h-8" />
                           <div className="mt-auto pt-4 flex gap-4">
                              <Skeleton className="w-24 h-4" />
                              <Skeleton className="w-24 h-4" />
                           </div>
                        </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Right Rail (Desktop Only) */}
          <aside className="hidden lg:col-span-4 lg:flex flex-col gap-10">
            
            {/* Skeleton for Trending Section */}
            <div className="rounded-3xl border border-zinc-100 p-6 bg-zinc-50/50">
               <div className="flex items-center gap-2 mb-6">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <Skeleton className="h-7 w-40" />
               </div>
               <div className="flex flex-col gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-4">
                          <Skeleton className="w-8 h-8 rounded-md" />
                          <div className="flex flex-col gap-2 flex-1">
                              <Skeleton className="w-full h-4" />
                              <Skeleton className="w-full h-4" />
                              <Skeleton className="w-1/2 h-3" />
                          </div>
                      </div>
                  ))}
               </div>
            </div>

            {/* Skeleton for Newsletter CTA */}
            <div className="rounded-3xl p-8">
               <Skeleton className="w-full h-48 rounded-3xl" />
            </div>
            
          </aside>
        </div>
      </main>
    </div>
  );
}
