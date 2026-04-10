import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "./kanban-board";
import { Lead } from "@/lib/types";

const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || "ScalerX Lab";

export default async function PipelinePage() {
  const leads = await prisma.lead.findMany({
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="space-y-8 h-full flex flex-col min-w-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Live Pipeline Management</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 lowercase italic">
            /sales.funnel
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Visualize and manage <span className="text-slate-900 underline decoration-primary/30 underline-offset-4">{clinicName}</span> conversion stages.
          </p>
        </div>

        <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Avg. Conv. Rate</span>
                <span className="text-xl font-black text-slate-900">12%</span>
             </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-transparent rounded-[2rem] overflow-hidden">
        <KanbanBoard 
            initialLeads={leads as unknown as Lead[]} 
        />
      </div>
    </div>
  );
}
