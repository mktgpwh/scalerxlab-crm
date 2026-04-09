import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Users, LayoutDashboard, MessageSquare, Command, 
  BarChart3, Activity, ArrowRight, Zap, TrendingUp, Target
} from "lucide-react";

export default async function DashboardHome({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params;

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true }
  });

  if (!organization) notFound();

  const [totalLeads, hotLeads, wonLeads, ivfLeads] = await Promise.all([
    prisma.lead.count({ where: { organizationId: organization.id } }),
    prisma.lead.count({ where: { organizationId: organization.id, intent: "HOT" } }),
    prisma.lead.count({ where: { organizationId: organization.id, status: "WON" } }),
    prisma.lead.count({ where: { organizationId: organization.id, category: "INFERTILITY" } }),
  ]);

  const hotRatio = totalLeads > 0 ? ((hotLeads / totalLeads) * 100).toFixed(1) : "0";

  const quickLinks = [
    { title: "Intelligence Hub", desc: "Executive Analytics Matrix", url: `/${orgSlug}/leads`, icon: Users, color: "text-indigo-500", bg: "bg-indigo-500/10", badge: `${totalLeads} Leads` },
    { title: "Capture Pipeline", desc: "Medical Funnel Kanban Board", url: `/${orgSlug}/pipeline`, icon: LayoutDashboard, color: "text-emerald-500", bg: "bg-emerald-500/10", badge: `${hotLeads} Hot` },
    { title: "Shared Inbox", desc: "WhatsApp · FB · Instagram", url: `/${orgSlug}/inbox`, icon: MessageSquare, color: "text-[#25D366]", bg: "bg-[#25D366]/10", badge: "Live" },
    { title: "Analytics Hub", desc: "Regional & Performance Data", url: `/${orgSlug}/analytics`, icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/10", badge: null },
    { title: "Integrations", desc: "Ad Channels & Webhooks", url: `/${orgSlug}/integrations`, icon: Command, color: "text-slate-500", bg: "bg-slate-100", badge: null },
    { title: "Activity Logs", desc: "DPDPA Sovereign Ledger", url: `/${orgSlug}/activity`, icon: Activity, color: "text-purple-500", bg: "bg-purple-500/10", badge: null },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Command Center Active</p>
          <h2 className="text-4xl font-black tracking-tighter italic lowercase text-slate-900 dark:text-white">
            /pahlajani.hub
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Welcome back to <span className="font-black text-slate-900 dark:text-white">{organization.name}</span> — All systems nominal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Live Stream Active</span>
        </div>
      </div>

      {/* Critical KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Captured", value: totalLeads, icon: Users, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { label: "Hot Intent", value: `${hotRatio}%`, icon: Zap, color: "text-rose-500", bg: "bg-rose-500/10", pulse: true },
          { label: "IVF Pipeline", value: ivfLeads, icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Patients Won", value: wonLeads, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
        ].map((kpi, i) => (
          <Card key={i} className="surface-layered border-none rounded-[2rem] p-5 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10">
            <div className={`h-9 w-9 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center mb-3`}>
              <kpi.icon className={`h-5 w-5 ${kpi.pulse ? "animate-pulse" : ""}`} />
            </div>
            <p className="text-2xl font-black tracking-tighter">{kpi.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{kpi.label}</p>
          </Card>
        ))}
      </div>

      {/* Quick Navigation Grid */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-5">Command Nodes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link, i) => (
            <Link href={link.url} key={i}>
              <Card className="surface-layered border-none rounded-[2rem] p-6 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10 hover:ring-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group cursor-pointer">
                <div className="flex items-start justify-between mb-5">
                  <div className={`h-11 w-11 rounded-2xl ${link.bg} flex items-center justify-center`}>
                    <link.icon className={`h-5 w-5 ${link.color}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    {link.badge && (
                      <Badge className="text-[9px] font-black bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-none">
                        {link.badge}
                      </Badge>
                    )}
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </div>
                <h4 className="font-black text-sm tracking-tight text-slate-900 dark:text-white">{link.title}</h4>
                <p className="text-[11px] font-medium text-slate-400 mt-1">{link.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
