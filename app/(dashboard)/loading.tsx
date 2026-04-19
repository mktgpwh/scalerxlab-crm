import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/50 dark:border-white/5">
        <div className="flex items-center gap-5">
           <Skeleton className="h-14 w-14 rounded-xl" />
           <div className="space-y-2">
             <Skeleton className="h-8 w-64" />
             <Skeleton className="h-4 w-40" />
           </div>
        </div>
        <div className="flex items-center gap-4">
           <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      
      <div className="flex gap-4">
         <Skeleton className="h-12 w-72 rounded-xl" />
         <Skeleton className="h-12 w-48 rounded-xl" />
      </div>

      <Skeleton className="h-28 w-full rounded-xl" />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
         <Skeleton className="h-40 rounded-xl" />
         <Skeleton className="h-40 rounded-xl" />
         <Skeleton className="h-40 rounded-xl" />
         <Skeleton className="h-40 rounded-xl" />
      </div>
      
      <Skeleton className="h-[400px] rounded-xl w-full mt-4" />
    </div>
  );
}
