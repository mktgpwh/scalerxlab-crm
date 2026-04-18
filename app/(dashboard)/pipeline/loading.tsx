import { Skeleton } from "@/components/ui/skeleton";

export default function PipelineLoading() {
  return (
    <div className="space-y-6 pt-4 h-full flex flex-col animate-in fade-in duration-500">
       <div className="flex justify-between items-center px-4">
         <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-40" />
         </div>
         <Skeleton className="h-10 w-56 rounded-full" />
       </div>
       <div className="flex gap-4 px-4 mt-6">
          <Skeleton className="h-12 w-72 rounded-2xl" />
       </div>
       <div className="flex gap-4 px-4 overflow-x-hidden flex-1 pb-10 mt-6">
          <Skeleton className="w-[350px] min-h-[500px] rounded-[2rem] shrink-0" />
          <Skeleton className="w-[350px] min-h-[500px] rounded-[2rem] shrink-0" />
          <Skeleton className="w-[350px] min-h-[500px] rounded-[2rem] shrink-0" />
          <Skeleton className="w-[350px] min-h-[500px] rounded-[2rem] shrink-0" />
       </div>
    </div>
  );
}
