import { prisma } from "@/lib/prisma";
import { RealtimeLeadsTable } from "./realtime-table";
import { notFound } from "next/navigation";
import { Lead } from "@/lib/types";

export default async function LeadsDashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params;
  
  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true }
  });

  if (!organization) {
    notFound(); 
  }

  const leads = await prisma.lead.findMany({
    where: { organizationId: organization.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Real-time Engagement</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 lowercase italic">
            /leads.log
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Managing capture pipeline for <span className="text-slate-900 underline decoration-primary/30 underline-offset-4">{orgSlug}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
           <div className="flex flex-col items-center px-4 border-r">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Captured</span>
              <span className="text-xl font-black text-slate-900">{leads.length}</span>
           </div>
           <div className="flex flex-col items-center px-4">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-tight flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                 Hot Intent
              </span>
              <span className="text-xl font-black text-rose-500">{leads.filter((l: any) => l.intent === 'HOT').length}</span>
           </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-[2rem] border border-slate-200/60 p-1 shadow-2xl shadow-slate-100 overflow-hidden ring-1 ring-white">
          <RealtimeLeadsTable 
            initialLeads={leads as unknown as Lead[]} 
            organizationId={organization.id} 
          />
      </div>
    </div>
  );
}
