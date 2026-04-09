import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap,
  Activity,
  Workflow
} from "lucide-react";
import { WhatsAppIcon, FacebookIcon, GoogleIcon } from "@/components/icons";

export default async function IntegrationsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params;
  
  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  if (!organization) notFound();

  const integrations = [
    {
      id: "whatsapp",
      name: "WhatsApp Business API",
      description: "Send automated alerts and AI-drafted replies directly to lead numbers.",
      icon: WhatsAppIcon,
      status: "Active",
      color: "text-[#25D366]",
      bgColor: "bg-[#25D366]/10",
      lastSync: "2 mins ago"
    },
    {
      id: "facebook",
      name: "Facebook Lead Ads",
      description: "Direct sync with FB Graph API to capture leads in real-time.",
      icon: FacebookIcon,
      status: "Connected",
      color: "text-[#1877F2]",
      bgColor: "bg-[#1877F2]/10",
      lastSync: "Today, 10:45 AM"
    },
    {
      id: "google",
      name: "Google Ads (GCLID)",
      description: "Track offline conversions by syncing CRM events back to Google Ads.",
      icon: GoogleIcon,
      status: "Configuring",
      color: "text-[#EA4335]",
      bgColor: "bg-[#EA4335]/10",
      lastSync: "Pending"
    }
  ];

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Connectivity Hub</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white lowercase italic">
            /integrations.center
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
            Manage your external data streams and autonomous engagement channels for <span className="text-slate-900 dark:text-white underline decoration-primary/30 decoration-2 underline-offset-4 font-bold">{organization.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 p-1.5 rounded-full border border-slate-200/60 dark:border-white/10 shadow-sm">
            <Button variant="ghost" size="sm" className="rounded-full text-[10px] font-black uppercase tracking-wider h-8">Outgoing Webhooks</Button>
            <Button size="sm" className="rounded-full text-[10px] font-black uppercase tracking-wider h-8 bg-primary">Add Integration</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((int) => (
          <Card key={int.id} className="group surface-layered rounded-[2.5rem] overflow-hidden transition-all hover:scale-[1.02] hover:glow-primary">
            <CardHeader className="p-8 pb-0">
              <div className="flex items-center justify-between mb-6">
                <div className={`h-14 w-14 rounded-2xl ${int.bgColor} ${int.color} flex items-center justify-center transition-transform group-hover:rotate-6`}>
                   <int.icon className="h-8 w-8" />
                </div>
                <Switch defaultChecked={int.status !== 'Configuring'} />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl font-black tracking-tight">{int.name}</CardTitle>
                <CardDescription className="text-xs font-semibold uppercase tracking-widest text-primary/70">{int.status}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed min-h-[40px]">
                {int.description}
              </p>
              
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Last Sync</span>
                    <span className="text-[11px] font-bold text-slate-900 dark:text-slate-200">{int.lastSync}</span>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                    <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Advanced Infrastructure Status */}
      <div className="mt-12 bg-white dark:bg-slate-950 rounded-[3rem] border border-slate-200/60 dark:border-white/5 p-12 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-0 group-hover:scale-100 duration-1000">
            <Workflow className="h-32 w-32 text-primary" />
         </div>
         
         <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-3">
               <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                  <Activity className="h-6 w-6" />
               </div>
               <div>
                  <h3 className="text-xl font-black tracking-tight italic uppercase">Autonomous Pipeline Health</h3>
                  <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">System Intelligence Audit</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-500 uppercase">Lead Ingestion (API)</span>
                     <span className="text-[10px] font-black text-emerald-500">99.9%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full w-[99%] bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-500 uppercase">AI Scoring Latency</span>
                     <span className="text-[10px] font-black text-amber-500">1.2s avg</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full w-[45%] bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-500 uppercase">WA Delivery Rate</span>
                     <span className="text-[10px] font-black text-primary">Managed</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full w-[88%] bg-primary shadow-[0_0_10px_rgba(99,102,241,0.3)]" />
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
               <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50 dark:bg-white/5 ring-1 ring-slate-200/50 dark:ring-white/10">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">DPDPA Audited Stream</span>
               </div>
            </div>
         </div>
      </div>

      {/* Outgoing Webhooks Registry */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black italic tracking-tight">Outgoing Webhooks</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Autonomous event dispatchers</p>
          </div>
          <Button size="sm" className="rounded-full text-[10px] font-black uppercase tracking-wider h-9 px-5 bg-primary shadow-lg shadow-primary/20">
            + Register Hook
          </Button>
        </div>

        <div className="space-y-3">
          {[
            { name: "Lead Created → CRM Core", url: "https://hook.scaler.x/leads/ingest", event: "LEAD_CREATED", status: "ACTIVE", calls: 142 },
            { name: "HOT Lead → Flash Alert", url: "https://hook.scaler.x/alerts/hot", event: "AI_SCORE_HOT", status: "ACTIVE", calls: 38 },
            { name: "WON → Patient Record", url: "https://hospital.pahlajani.in/api/patients", event: "STATUS_WON", status: "PENDING", calls: 0 },
          ].map((hook, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-white/5 rounded-2xl ring-1 ring-slate-200/50 dark:ring-white/5 shadow-sm">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${hook.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-xs font-black">{hook.name}</span>
                </div>
                <p className="text-[10px] font-mono text-slate-400 truncate">{hook.url}</p>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Event</p>
                  <p className="text-[10px] font-black text-slate-700 dark:text-slate-200">{hook.event}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Calls</p>
                  <p className="text-[10px] font-black text-slate-700 dark:text-slate-200">{hook.calls}</p>
                </div>
                <Badge className={`text-[9px] font-black border-none uppercase ${hook.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                  {hook.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
