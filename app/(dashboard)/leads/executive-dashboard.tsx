"use client";

import Image from "next/image";

import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { 
  BrainCircuit, Target, Flame, TrendingUp, Activity, MapPin, Loader2,
  Settings, Search, Filter, ChevronDown, Sparkles, Phone, Users, ShieldAlert,
  ShieldCheck, Lock, Shield
} from "lucide-react";
import { Popover as PopoverRoot } from "@/components/ui/popover";
import { FacebookIcon, WhatsAppIcon } from "@/components/icons";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/lib/store/use-dashboard-store";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
import { NewLeadDialog } from "@/components/leads/new-lead-dialog";
import { BulkImportDialog } from "@/components/leads/bulk-import-dialog";

const COLORS = ["#6366f1", "#10b981", "#ec4899", "#f59e0b"];

const INTENT_STYLES: Record<string, string> = {
  HOT:    "bg-rose-500/10 text-rose-600 ring-rose-500/20",
  WARM:   "bg-amber-500/10 text-amber-600 ring-amber-500/20",
  COLD:   "bg-blue-500/10 text-blue-600 ring-blue-500/20",
  UNSCORED: "bg-slate-100 text-slate-500 ring-slate-200/50",
};

// ─── Analytics Sub-Component ────────────────────────────────────────────────

function AnalyticsView({ 
  leads, 
  userRole, 
  branches, 
  callLogs = [], 
  dailyLeadsSeries = [] 
}: { 
  leads: any[], 
  userRole: string, 
  branches: any[], 
  callLogs?: any[], 
  dailyLeadsSeries?: any[] 
}) {
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [adSpendMode, setAdSpendMode] = useState<'AUTO' | 'MANUAL' | 'META'>('AUTO');
  const [customAdSpend, setCustomAdSpend] = useState<number>(0);

  const totalLeads = leads.length;
  const hotLeads   = leads.filter(l => l.intent === 'HOT').length;
  const hotRatio   = totalLeads > 0 ? ((hotLeads / totalLeads) * 100).toFixed(1) : 0;
  const displayAdSpend = adSpendMode === 'MANUAL' ? customAdSpend : totalLeads * 200;

  // ─── CBIO BUSINESS INTELLIGENCE ENGINE ─────────────────────
  // Intent-based Revenue Benchmarks
  const IVF_VALUE = 100000;
  const MDT_VALUE = 80000;
  const ESTIMATED_CONV = 0.25; // 25% for HOT leads

  const hotInfertility = leads.filter(l => l.category === 'INFERTILITY' && l.metadata?.intentLevel === 'HOT').length;
  const hotMaternity   = leads.filter(l => l.category === 'MATERNITY' && l.metadata?.intentLevel === 'HOT').length;

  const predictiveROI = (hotInfertility * IVF_VALUE * ESTIMATED_CONV) + (hotMaternity * MDT_VALUE * ESTIMATED_CONV);

  const ivfLeads      = leads.filter(l => l.category === 'INFERTILITY').length;
  const maternityLeads = leads.filter(l => l.category === 'MATERNITY').length;
  const gynoLeads     = leads.filter(l => l.category === 'GYNECOLOGY').length;
  const pediLeads     = leads.filter(l => l.category === 'PEDIATRICS').length;
  const otherLeads    = leads.filter(l => !l.category || l.category === 'OTHER').length;
  
  const treatmentData = [
    { name: 'IVF',  value: ivfLeads },
    { name: 'MDT',  value: maternityLeads },
    { name: 'GYN',  value: gynoLeads },
    { name: 'PEDI', value: pediLeads },
    { name: 'OTH',  value: otherLeads },
  ].filter(d => d.value > 0);

  // Sentiment Pulse Trends (Mocked for current view)
  const sentimentTrends = [
    { day: 'Mon', positive: 65, neutral: 20, negative: 15 },
    { day: 'Tue', positive: 70, neutral: 25, negative: 5 },
    { day: 'Wed', positive: 55, neutral: 35, negative: 10 },
    { day: 'Thu', positive: 80, neutral: 15, negative: 5 },
    { day: 'Fri', positive: 75, neutral: 20, negative: 5 },
    { day: 'Sat', positive: 90, neutral: 10, negative: 0 },
    { day: 'Sun', positive: 85, neutral: 10, negative: 5 },
  ];

  const regionalData = branches.map(branch => ({
    name: branch.name,
    count: leads.filter(l => l.branchId === branch.id).length
  }));

  const ivfPipelineLeads = leads.filter(l => l.category === 'INFERTILITY');
  const funnelData = [
    { stage: 'Raw Intake',    count: ivfPipelineLeads.filter(l => l.status === 'RAW').length },
    { stage: 'Qualified',     count: ivfPipelineLeads.filter(l => l.status === 'QUALIFIED').length },
    { stage: 'Clinic Visited',count: ivfPipelineLeads.filter(l => l.status === 'VISITED').length },
    { stage: 'Enrolled',      count: ivfPipelineLeads.filter(l => l.status === 'WON').length },
  ];

  useEffect(() => {
    fetch(`/api/executive-insight`)
      .then(res => res.json())
      .then(data => { if (data.insight) setInsight(data.insight); })
      .catch(console.error)
      .finally(() => setInsightLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* AI Insight Node */}
      <Card className="relative overflow-hidden border-none rounded-[2rem] bg-gradient-to-br from-slate-900 to-black shadow-2xl p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
        <div className="relative z-10 flex gap-6 items-start">
          <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
            {insightLoading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <BrainCircuit className="h-6 w-6 text-emerald-400" />}
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">Tactical Node | Llama-3</h3>
            <p className="text-sm md:text-base font-medium text-slate-200 leading-relaxed italic">
              {insightLoading ? "Vectorizing clinical pipeline data..." : `"${insight}"`}
            </p>
          </div>
        </div>
      </Card>

      {/* Telephony Matrix Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Dialog>
           <DialogTrigger render={
             <div className="h-full">
                <KpiCard 
                  title="Daily Signals" 
                  value={dailyLeadsSeries?.[dailyLeadsSeries.length - 1]?.count || 0} 
                  subValue="Today's Intake" 
                  icon={<Activity className="h-5 w-5" />} 
                  color="indigo" 
                />
             </div>
           } />
           <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 overflow-hidden bg-slate-900 border-slate-700 rounded-[2.5rem]">
               <DialogHeader className="p-6 pb-0">
                  <DialogTitle className="text-white">Daily Acquisition Trajectory</DialogTitle>
                  <DialogDescription className="text-slate-400 text-xs">Trailing 30-day signal capture analysis.</DialogDescription>
               </DialogHeader>
               <div className="h-[300px] md:h-[450px] w-full p-4 md:p-8">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={dailyLeadsSeries}>
                        <defs>
                          <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.1} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
           </DialogContent>
        </Dialog>
        
        <KpiCard 
           title="Calls Made" 
           value={callLogs.length} 
           subValue="Today Outbound" 
           icon={<Phone className="h-5 w-5" />} 
           color="blue" 
        />
        <KpiCard 
           title="Calls Handled" 
           value={callLogs.filter((c: any) => c.status === 'CONNECTED' || c.status === 'AI_HANDLED').length} 
           subValue="Connected + AI" 
           icon={<Target className="h-5 w-5" />} 
           color="emerald" 
        />
        <KpiCard 
           title="Missed Checks" 
           value={callLogs.filter((c: any) => c.status === 'MISSED').length} 
           subValue="Unreachable" 
           icon={<ShieldAlert className="h-5 w-5" />} 
           color="rose" 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KpiCard 
          title="Predictive ROI" 
          value={`₹${(predictiveROI / 100000).toFixed(1)}L`} 
          subValue="Future Conversions" 
          icon={<TrendingUp className="h-5 w-5" />} 
          color="emerald" 
          estimated
        />
        <KpiCard 
          title="Global Hot Ratio" 
          value={`${hotRatio}%`} 
          subValue={`${hotLeads} Hot Leads`} 
          icon={<Flame className="h-5 w-5" />} 
          color="rose" 
        />
        <KpiCard 
          title="Avg. Acquisition" 
          value={`₹${(displayAdSpend / totalLeads || 0).toFixed(0)}`} 
          subValue="Cost Per Lead" 
          icon={<Target className="h-5 w-5" />} 
          color="blue" 
        />
        <KpiCard 
          title="Presence" 
          value={`${branches.length} NODE`} 
          subValue="Active Clinical Centers" 
          icon={<Users className="h-5 w-5" />} 
          color="indigo" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Speciality Distribution Chart (Pie) */}
        <Card className="surface-layered border-none rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 shadow-sm ring-1 ring-slate-200/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              <h4 className="text-lg font-black italic tracking-tight">Speciality Distribution</h4>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departmental Flow</p>
          </div>
          <div className="h-[220px] md:h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={treatmentData}
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={8}
                   dataKey="value"
                 >
                   {treatmentData.map((entry: any, index: number) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
               </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 flex justify-center gap-3 md:gap-4 flex-wrap">
             {treatmentData.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                   <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tight text-slate-500">{item.name}</span>
                   <span className="text-[10px] md:text-[11px] font-black">{item.value}</span>
                </div>
             ))}
          </div>
        </Card>

        {/* Sentinel Sentiment Pulse (Mobile optimized) */}
        <Card className="surface-layered border-none rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 shadow-sm ring-1 ring-slate-200/50">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-emerald-500" />
                <h4 className="text-lg font-black italic tracking-tight">Sentinel Pulse</h4>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> <span className="text-[8px] font-black uppercase text-slate-400">Pos</span></div>
                <div className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-rose-500" /> <span className="text-[8px] font-black uppercase text-slate-400">Neg</span></div>
              </div>
            </div>
            <div className="h-[220px] md:h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sentimentTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPositive)" />
                  <Area type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorNegative)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
        </Card>
      </div>

         {/* Security & Compliance Section */}
         <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            {/* DPDPA Sovereignty Card */}
            <Card className="surface-layered border-none rounded-[2.5rem] p-8 md:p-10 shadow-sm ring-1 ring-slate-200/50 relative overflow-hidden group">
               <div className="flex items-center justify-between mb-6">
                  <Badge className="bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full border-none shadow-lg shadow-emerald-500/20">
                    Verified
                  </Badge>
                  <ShieldCheck className="h-6 w-6 text-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity" />
               </div>
               
               <div className="space-y-2">
                  <h4 className="text-2xl font-black italic tracking-tight text-slate-900 dark:text-white">DPDPA Sovereignty</h4>
                  <p className="text-sm font-bold text-slate-500">European & Indian Data Privacy Compliance Status.</p>
               </div>

               <div className="mt-8 p-4 rounded-3xl bg-emerald-50/50 border border-emerald-100/50 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                     <ShieldCheck className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                     <p className="text-[11px] font-black uppercase tracking-tight text-slate-900">Active Audit Log</p>
                     <p className="text-[10px] font-medium text-slate-500 leading-tight">System is currently recording all PII access and WhatsApp engagement events for regulatory auditing.</p>
                  </div>
               </div>
            </Card>

            {/* AES-256-GCM Encryption Card */}
            <Card className="surface-layered border-none rounded-[2.5rem] p-8 md:p-10 shadow-sm ring-1 ring-slate-200/50 relative overflow-hidden group">
               <div className="flex items-center justify-between mb-6">
                  <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-sm">
                     <Shield className="h-5 w-5" />
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-black px-3 py-1 rounded-full">
                     ACTIVE
                  </Badge>
               </div>

               <div className="space-y-4">
                  <h4 className="text-2xl font-black italic tracking-tight text-slate-900 dark:text-white">AES-256-GCM Encryption</h4>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">
                     All integration tokens (WATI, Tata Smartflo, Meta) are encrypted using AES-256-GCM before being stored in the database. Plain-text credentials are never persisted.
                  </p>
               </div>

               <div className="mt-10 pt-6 border-t border-slate-100 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                     <Settings className="h-3 w-3 text-slate-400 animate-spin-slow" />
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">256-Bit Key • GCM Mode • Random IV Per Token</span>
                  </div>
               </div>
            </Card>
         </div>
    </div>
  );
}


// ─── Main Export ─────────────────────────────────────────────────────────────

export function ExecutiveDashboard({ 
  initialLeads,
  userRole,
  currentUserId,
  team,
  branches,
  initialCallLogs = [],
  dailyLeadsSeries = []
}: { 
  initialLeads: Record<string, any>[]; 
  userRole: string;
  currentUserId: string;
  team: any[];
  branches: any[];
  initialCallLogs?: any[];
  dailyLeadsSeries?: any[];
}) {
  const { dateRange, category } = useDashboardStore();
  const [liveLeads, setLiveLeads] = useState<Record<string, any>[]>(initialLeads);
  const [liveCallLogs, setLiveCallLogs] = useState<any[]>(initialCallLogs);
  const [liveDailySeries, setLiveDailySeries] = useState<any[]>(dailyLeadsSeries);

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient();
      const channel = supabase.channel('executive_dashboard')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload: any) => {
          setLiveLeads(prev => [payload.new, ...prev]);
          setLiveDailySeries(prev => {
            const up = [...prev];
            if(up.length > 0) {
               up[up.length - 1] = { ...up[up.length - 1], count: up[up.length - 1].count + 1 };
            }
            return up;
          });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_logs' }, (payload: any) => {
          setLiveCallLogs(prev => [payload.new, ...prev]);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    });
  }, []);

  const globalFilteredLeads = useMemo(() => {
    return liveLeads.filter((l: any) => {
      // 1. Date Filter
      if (dateRange?.from) {
        const leadDate = new Date(l.createdAt);
        const from = startOfDay(dateRange.from);
        const to = endOfDay(dateRange.to || dateRange.from);
        if (!isWithinInterval(leadDate, { start: from, end: to })) return false;
      }
      // 2. Category Filter
      if (category && l.category !== category) return false;
      
      return true;
    });
  }, [liveLeads, dateRange, category]);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-6">
          <div className="h-10 w-auto text-slate-900 dark:text-white">
            <Image src="/scalerxlab-logo.png" alt={process.env.NEXT_PUBLIC_CLINIC_NAME || "ScalerX Lab"} width={140} height={35} className="object-contain" />
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden md:block" />
          <div className="flex items-center gap-4">
            <div className="relative flex h-3 w-3 mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tighter italic lowercase text-slate-900 dark:text-white">/intelligence.hub</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Sovereign Analytics Matrix</p>
            </div>
          </div>
        </div>

      </div>

      <DashboardFilterBar />

      <div className="mt-8">
          <AnalyticsView 
            leads={globalFilteredLeads} 
            userRole={userRole} 
            branches={branches}
            callLogs={liveCallLogs}
            dailyLeadsSeries={liveDailySeries}
          />
      </div>
    </div>
  );
}

function KpiCard({ title, value, subValue, icon, color, progress, estimated }: any) {
    const colorMap: any = {
        blue: "text-blue-500 bg-blue-500/10 ring-blue-500/20",
        rose: "text-rose-500 bg-rose-500/10 ring-rose-500/20",
        emerald: "text-emerald-500 bg-emerald-500/10 ring-emerald-500/20",
        indigo: "text-indigo-500 bg-indigo-500/10 ring-indigo-500/20"
    };

    return (
        <Card className="surface-layered border-none rounded-[2.5rem] p-8 shadow-sm ring-1 ring-slate-200/50 overflow-hidden relative group transition-all hover:shadow-2xl hover:ring-primary/30 hover:scale-[1.01] cursor-pointer">
            <div className="flex justify-between items-start mb-6">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500", colorMap[color])}>
                    {icon}
                </div>
                {estimated && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-100 text-slate-400">Estimated</span>
                )}
            </div>
            
            <div className="space-y-1">
                <h3 className={cn("text-3xl font-black tracking-tighter italic transition-all group-hover:tracking-tight", 
                    color === 'rose' ? "text-rose-500" : color === 'emerald' ? "text-emerald-500" : "text-slate-900")}>
                    {value}
                </h3>
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
                    <p className="text-[10px] font-black text-slate-500">{subValue}</p>
                </div>
            </div>

            {progress !== undefined && (
                <div className="h-1.5 w-full bg-slate-100 mt-6 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" 
                        style={{ width: `${progress}%` }} 
                    />
                </div>
            )}
        </Card>
    );
}

const STATUS_STYLES: Record<string, string> = {
  RAW:               "bg-slate-100 text-slate-600 ring-slate-200/50",
  QUALIFIED:         "bg-indigo-50 text-indigo-600 ring-indigo-500/20",
  CONTACTED:         "bg-blue-50 text-blue-600 ring-blue-500/20",
  APPOINTMENT_FIXED: "bg-amber-50 text-amber-600 ring-amber-500/20",
  VISITED:           "bg-violet-50 text-violet-600 ring-violet-500/20",
  WON:               "bg-emerald-100 text-emerald-700 ring-emerald-500/30",
  LOST:              "bg-rose-50 text-rose-600 ring-rose-500/20"
};

const CATEGORY_STYLES: Record<string, string> = {
  INFERTILITY: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
  MATERNITY:   "bg-indigo-500/10 text-indigo-600 ring-indigo-500/20",
  GYNECOLOGY:  "bg-rose-500/10 text-rose-600 ring-rose-500/20",
  OTHER:       "bg-slate-500/10 text-slate-600 ring-slate-500/20"
};

