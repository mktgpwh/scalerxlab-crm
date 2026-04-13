import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPrismaDateFilter } from "@/lib/utils/date-filters";
import { SpecialityFunnelGrid } from "@/components/pipeline/speciality-funnel-grid";
import { LeadsDataView } from "@/components/leads/leads-data-view";
import { NewLeadDialog } from "@/components/leads/new-lead-dialog";
import { BulkImportDialog } from "@/components/leads/bulk-import-dialog";
import { PipelineFilterBar } from "@/components/pipeline/pipeline-filter-bar";
import { Activity, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ 
    from?: string; 
    to?: string; 
    category?: string;
    branchId?: string;
  }>;
}

const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || "ScalerX Lab";

export default async function PipelinePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true }
  });

  if (!profile) {
    redirect("/login");
  }

  const isAdmin = profile.role === "ORG_ADMIN" || profile.role === "SUPER_ADMIN";

  // localized filters for this page (independent of Command Center)
  const dateFilter = getPrismaDateFilter(params.from, params.to);
  const categoryFilter = params.category ? { category: params.category as any } : {};
  const branchFilter = params.branchId ? { branchId: params.branchId } : {};

  // Fetch specialized data sets
  const [leads, branches, team] = await Promise.all([
    prisma.lead.findMany({
      where: {
        ...(isAdmin ? {} : { ownerId: profile.id }),
        ...dateFilter,
        ...categoryFilter,
        ...branchFilter
      },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        branch: { select: { id: true, name: true, city: true } }
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    }),
    isAdmin ? prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true }
    }) : []
  ]);

  return (
    <div className="space-y-10 pb-20 max-w-[1600px] mx-auto overflow-x-hidden">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
             <Activity className="h-4 w-4 text-primary animate-pulse" />
             <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Live Pipeline Matrix</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 lowercase italic">
            /lead.pipelines
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Real-time stage-wise conversion across <span className="text-slate-900 underline decoration-primary/30 underline-offset-4">{clinicName}</span> specialities.
          </p>
        </div>

        <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 mr-4">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">DPDPA Ledger Active</span>
             </div>
             <BulkImportDialog userRole={profile.role} branches={branches} />
             <NewLeadDialog userRole={profile.role} team={team} branches={branches} />
        </div>
      </div>

      {/* Independent Filter Bar */}
      <div className="surface-layered border-none rounded-[2rem] p-1 shadow-sm ring-1 ring-slate-200/50">
          <PipelineFilterBar />
      </div>

      {/* Speciality Funnels Layer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Department Velocity Matrix</h3>
        </div>
        <Suspense fallback={<div className="h-64 flex items-center justify-center animate-pulse bg-slate-50 rounded-[2rem]">Calculating Funnels...</div>}>
            <SpecialityFunnelGrid leads={leads} />
        </Suspense>
      </div>

      {/* Leads Data Table Layer */}
      <div className="space-y-6 pt-10 border-t border-slate-100 dark:border-white/5">
          <div className="px-2">
            <h3 className="text-2xl font-black italic tracking-tight lowercase">/signals.data</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Direct Telemetry for current filtered node</p>
          </div>
          <LeadsDataView 
            leads={leads as unknown as Record<string, any>[]} 
            userRole={profile.role} 
            team={team as any[]}
            branches={branches as any[]}
          />
      </div>
    </div>
  );
}
