"use client";

import Image from "next/image";

import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { 
  BrainCircuit, Target, Flame, TrendingUp, Activity, MapPin, Loader2,
  Settings, Search, Filter, ChevronDown, X, Sparkles, Phone, Users,
  ArrowUpDown, ExternalLink
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

function AnalyticsView({ leads, userRole, branches }: { leads: Record<string, any>[], userRole: string, branches: any[] }) {
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [adSpendMode, setAdSpendMode] = useState<'AUTO' | 'MANUAL' | 'META'>('AUTO');
  const [customAdSpend, setCustomAdSpend] = useState<number>(0);

  const totalLeads = leads.length;
  const hotLeads   = leads.filter(l => l.intent === 'HOT').length;
  const hotRatio   = totalLeads > 0 ? ((hotLeads / totalLeads) * 100).toFixed(1) : 0;
  const displayAdSpend = adSpendMode === 'MANUAL' ? customAdSpend : totalLeads * 200;

  const ivfLeads      = leads.filter(l => l.category === 'INFERTILITY').length;
  const maternityLeads = leads.filter(l => l.category === 'MATERNITY').length;
  const gynoLeads     = leads.filter(l => l.category === 'GYNECOLOGY').length;
  const otherLeads    = leads.filter(l => !l.category || l.category === 'OTHER').length;
  const targetProgress = Math.min((ivfLeads / 50) * 100, 100);

  const treatmentData = [
    { name: 'IVF',  value: ivfLeads },
    { name: 'MDT',  value: maternityLeads },
    { name: 'GYN',  value: gynoLeads },
    { name: 'OTH',  value: otherLeads },
  ].filter(d => d.value > 0);

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Total Ad Spend" 
          value={`₹${(displayAdSpend / 1000).toFixed(1)}k`} 
          subValue={`${totalLeads} Leads`} 
          icon={<TrendingUp className="h-5 w-5" />} 
          color="blue" 
          estimated={adSpendMode === 'AUTO'}
          onSettings={() => {}}
        />
        <KpiCard 
          title="Global Hot Ratio" 
          value={`${hotRatio}%`} 
          subValue={`${hotLeads} Hot Leads`} 
          icon={<Flame className="h-5 w-5" />} 
          color="rose" 
        />
        <KpiCard 
          title="IVF Target" 
          value={ivfLeads.toString()} 
          subValue="/ 50 Cycles" 
          icon={<Target className="h-5 w-5" />} 
          color="emerald" 
          progress={targetProgress}
        />
        <KpiCard 
          title="Presence" 
          value={`${branches.length} NODE`} 
          subValue="Active Clinical Centers" 
          icon={<Users className="h-5 w-5" />} 
          color="indigo" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Conversion Pipeline Chart (Funnel) */}
         <Card className="lg:col-span-2 surface-layered border-none rounded-[3rem] p-10 shadow-sm ring-1 ring-slate-200/50">
            <div className="flex items-center gap-2 mb-8">
              <Activity className="h-5 w-5 text-primary" />
              <h4 className="text-lg font-black italic tracking-tight">Conversion Pipeline Chart</h4>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} width={120} />
                  <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                  <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={32}>
                    {funnelData.map((_, index) => (
                      <Cell key={index} fill={[`#6366f1`, `#818cf8`, `#a5b4fc`, `#10b981`][index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
         </Card>

         {/* Treatment Split Chart (Donut) */}
         <Card className="surface-layered border-none rounded-[3rem] p-10 shadow-sm ring-1 ring-slate-200/50 flex flex-col">
            <div className="mb-6">
              <h4 className="text-sm font-black italic tracking-tight uppercase">Treatment Split Chart</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Donut: Maternity vs Infertility</p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={treatmentData}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {treatmentData.map((_, index) => (
                      <Cell key={index} fill={[COLORS[0], COLORS[2], COLORS[1], COLORS[3]][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-6">
              {treatmentData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: [COLORS[0], COLORS[2], COLORS[1], COLORS[3]][idx % 4] }} />
                    <span className="text-[10px] font-black uppercase tracking-tight">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400">{item.value}</span>
                </div>
              ))}
            </div>
         </Card>
      </div>

      {/* Center Performance Chart (Bar) */}
      <Card className="surface-layered border-none rounded-[3rem] p-10 shadow-sm ring-1 ring-slate-200/50">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-500" />
            <h4 className="text-lg font-black italic tracking-tight">Center Performance Chart</h4>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Leads mapped to specific branches</p>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
              <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// ─── Leads Data Table Sub-Component ─────────────────────────────────────────

function LeadsDataView({ 
  leads, 
  userRole, 
  team 
}: { 
  leads: Record<string, any>[], 
  userRole: string,
  team: any[]
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterIntent, setFilterIntent] = useState<string>("ALL");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sources   = useMemo(() => ["ALL", ...Array.from(new Set(leads.map(l => l.source).filter(Boolean)))], [leads]);
  const statuses  = useMemo(() => ["ALL", "RAW","QUALIFIED","CONTACTED","APPOINTMENT_FIXED","VISITED","WON","LOST"], []);
  const categories = ["ALL","INFERTILITY","MATERNITY","GYNECOLOGY","OTHER"];
  const intents   = ["ALL","HOT","WARM","COLD","UNSCORED"];

  const openLead = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("leadId", id);
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const { ownerId, setOwnerId } = useDashboardStore();

  const handleReassign = async (leadId: string, newOwnerId: string | null) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        body: JSON.stringify({ ownerId: newOwnerId === "unassigned" ? null : newOwnerId })
      });
      if (res.ok) {
        toast.success("Ownership Transferred", {
            description: "Lead visibility has been updated successfully."
        });
        // We might want to refresh here or use a lighter update
        router.refresh();
      }
    } catch (err) {
      toast.error("Transfer Failed", { description: "Matrix connectivity error." });
    }
  };

  const filtered = useMemo(() => {
    let result = leads.filter(l => {
      // 1. Ownership / Unassigned logic for Admins
      if (userRole === "ORG_ADMIN" || userRole === "SUPER_ADMIN") {
        if (ownerId === "unassigned" && l.ownerId !== null) return false;
        if (ownerId !== "unassigned" && ownerId !== null && l.ownerId !== ownerId) return false;
      }

      const q = search.toLowerCase();
      const matchSearch = !q || 
        (l.name || "").toLowerCase().includes(q) || 
        (l.phone || "").includes(q) || 
        (l.email || "").toLowerCase().includes(q) ||
        (l.aiNotes || "").toLowerCase().includes(q);
      const matchSource   = filterSource === "ALL"   || l.source === filterSource;
      const matchStatus   = filterStatus === "ALL"   || l.status === filterStatus;
      const matchCategory = filterCategory === "ALL" || (l.category || "OTHER") === filterCategory;
      const matchIntent   = filterIntent === "ALL"   || (l.intent || "UNSCORED") === filterIntent;
      return matchSearch && matchSource && matchStatus && matchCategory && matchIntent;
    });

    result.sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (sortField === "createdAt") { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      if (sortField === "aiScore") { av = av ?? -1; bv = bv ?? -1; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [leads, search, filterSource, filterStatus, filterCategory, filterIntent, sortField, sortDir]);

  const activeFilters = [filterSource, filterStatus, filterCategory, filterIntent].filter(f => f !== "ALL").length;

  return (
    <div className="space-y-6">
      {/* Search + Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-11 h-11 rounded-2xl bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/5 ring-1 ring-slate-200/50 dark:ring-white/5 font-medium focus-visible:ring-primary/30"
            placeholder="Search by name, phone, email, AI notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Source Filter */}
          <FilterChip label="Source" value={filterSource} options={sources} onChange={setFilterSource} />
          {/* Status Filter */}
          <FilterChip label="Status" value={filterStatus} options={statuses} onChange={setFilterStatus} />
          {/* Treatment Category */}
          <FilterChip label="Treatment" value={filterCategory} options={categories} onChange={setFilterCategory} />
          {/* Heat Score */}
          <FilterChip label="Heat" value={filterIntent} options={intents} onChange={setFilterIntent} />

          {(userRole === "ORG_ADMIN" || userRole === "SUPER_ADMIN") && (
            <FilterChip 
               label="Node Access" 
               value={ownerId === "unassigned" ? "UNASSIGNED" : (team.find(t => t.id === ownerId)?.name || "ALL OWNERS")} 
               options={["ALL", "UNASSIGNED", ...team.map(t => t.name)]} 
               onChange={(val) => {
                   if (val === "ALL") setOwnerId(null);
                   else if (val === "UNASSIGNED") setOwnerId("unassigned");
                   else {
                       const t = team.find(tm => tm.name === val);
                       if (t) setOwnerId(t.id);
                   }
               }} 
            />
          )}

          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full h-8 px-3"
              onClick={() => { setFilterSource("ALL"); setFilterStatus("ALL"); setFilterCategory("ALL"); setFilterIntent("ALL"); }}>
              <X className="h-3 w-3 mr-1" /> Clear ({activeFilters})
            </Button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
          Showing <span className="text-slate-900 dark:text-white">{filtered.length}</span> of {leads.length} leads
        </p>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
          <span>Sort:</span>
          <button onClick={() => toggleSort("createdAt")} className={cn("px-2 py-1 rounded-lg transition-colors", sortField === "createdAt" ? "bg-primary/10 text-primary" : "hover:bg-slate-100")}>Date</button>
          <button onClick={() => toggleSort("aiScore")} className={cn("px-2 py-1 rounded-lg transition-colors", sortField === "aiScore" ? "bg-primary/10 text-primary" : "hover:bg-slate-100")}>AI Score</button>
          <button onClick={() => toggleSort("name")} className={cn("px-2 py-1 rounded-lg transition-colors", sortField === "name" ? "bg-primary/10 text-primary" : "hover:bg-slate-100")}>Name</button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-black/20 rounded-[2rem] ring-1 ring-slate-200/60 dark:ring-white/5 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center justify-center">
            <div className="relative h-16 w-16 mb-6 opacity-20 grayscale">
              <Image src="/scalerxlab-logo.png" alt="ScalerX" fill className="object-contain" />
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
              Zero Nodes Detected in Matrix
            </p>
            <p className="text-[10px] text-slate-300 font-medium mt-2">Adjust filters or await incoming lead signals.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5">
                  {[
                    { label: "Patient", field: "name" },
                    { label: "Source / Origin", field: "source" },
                    { label: "Status", field: "status" },
                    { label: "Treatment", field: "category" },
                    { label: "Center", field: "branchId" },
                    { label: "Owner", field: "ownerId" },
                    { label: "Heat Score", field: "intent" },
                    { label: "AI Score", field: "aiScore" },
                    { label: "AI Remarks", field: null },
                    { label: "Engagement", field: null },
                    { label: "Compliance", field: "consentFlag" },
                    { label: "Captured", field: "createdAt" },
                  ].map(col => (
                    <th
                      key={col.label}
                      onClick={() => col.field && toggleSort(col.field)}
                      className={cn(
                        "px-5 py-4 text-left text-[9px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap",
                        col.field && "cursor-pointer hover:text-slate-700 select-none"
                      )}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {col.field && sortField === col.field && (
                          <ArrowUpDown className="h-3 w-3 text-primary" />
                        )}
                      </span>
                    </th>
                  ))}
                  <th className="px-5 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {filtered.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => openLead(lead.id)}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/5 cursor-pointer transition-colors group"
                  >
                    {/* Patient */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                          {(lead.name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{lead.name || "Anonymous"}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{lead.phone || lead.email || "—"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Source */}
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-tight text-slate-700 dark:text-slate-200">{(lead.source || "UNKNOWN").replace(/_/g, " ")}</p>
                        {lead.metadata?.utm_medium && <p className="text-[9px] text-slate-400 font-medium">UTM: {lead.metadata.utm_medium}</p>}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <Badge className={cn("text-[8px] font-black uppercase px-2 py-0.5 border-none", STATUS_STYLES[lead.status] || "bg-slate-100 text-slate-500")}>
                        {(lead.status || "RAW").replace(/_/g, " ")}
                      </Badge>
                    </td>

                    {/* Treatment Category */}
                    <td className="px-5 py-4">
                      <Badge className={cn("text-[8px] font-black uppercase px-2 py-0.5 border-none", CATEGORY_STYLES[lead.category] || CATEGORY_STYLES.OTHER)}>
                        {lead.category === 'INFERTILITY' ? 'IVF'
                          : lead.category === 'MATERNITY' ? 'MDT'
                          : lead.category === 'GYNECOLOGY' ? 'GYN'
                          : 'OTH'}
                      </Badge>
                    </td>

                    {/* Clinical Center */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-indigo-600 tracking-tight">
                          {lead.branch?.name || "Global Node"}
                        </span>
                        {lead.branch?.city && (
                          <span className="text-[9px] font-medium text-slate-400 capitalize">
                            {lead.branch.city}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Owner / Reassignment */}
                    <td className="px-5 py-4">
                      {userRole === "ORG_ADMIN" || userRole === "SUPER_ADMIN" ? (
                        <div onClick={(e) => e.stopPropagation()}>
                           <select 
                            value={lead.ownerId || "unassigned"} 
                            onChange={(e) => handleReassign(lead.id, e.target.value)}
                            className="bg-slate-50 border-none text-[10px] font-black uppercase tracking-tight rounded-lg px-2 h-7 focus:ring-1 focus:ring-primary/20 cursor-pointer"
                           >
                              <option value="unassigned">Unassigned</option>
                              {team.map(member => (
                                <option key={member.id} value={member.id}>{member.name}</option>
                              ))}
                           </select>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black uppercase text-slate-400">
                          {lead.owner?.name || "Unassigned"}
                        </span>
                      )}
                    </td>

                    {/* Heat Score */}
                    <td className="px-5 py-4">
                      <Badge className={cn("text-[8px] font-black uppercase px-2 py-0.5 ring-1 border-none", INTENT_STYLES[lead.intent] || INTENT_STYLES.UNSCORED)}>
                        {lead.intent === 'HOT' && <Flame className="h-2.5 w-2.5 mr-1 inline" />}
                        {lead.intent || "UNSCORED"}
                      </Badge>
                    </td>

                    {/* AI Score */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", (lead.aiScore || 0) > 70 ? "bg-emerald-500" : (lead.aiScore || 0) > 40 ? "bg-amber-500" : "bg-slate-300")}
                            style={{ width: `${lead.aiScore || 0}%` }}
                          />
                        </div>
                        <span className={cn("text-[10px] font-black", (lead.aiScore || 0) > 70 ? "text-emerald-600" : "text-slate-500")}>
                          {lead.aiScore ?? "—"}
                        </span>
                      </div>
                    </td>

                    {/* AI Remarks */}
                    <td className="px-5 py-4 max-w-[200px]">
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed truncate italic">
                        {lead.aiNotes 
                          ? `"${lead.aiNotes.slice(0, 80)}${lead.aiNotes.length > 80 ? '…' : ''}"`
                          : <span className="text-slate-300 not-italic">Pending analysis</span>}
                      </p>
                    </td>

                    {/* Engagement */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          disabled={!lead.consentFlag}
                          className={cn("h-8 w-8 p-0 rounded-xl hover:bg-emerald-500 hover:text-white transition-all", !lead.consentFlag && "opacity-20")}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://wa.me/${lead.phone || lead.whatsappNumber}`);
                          }}
                        >
                          <WhatsAppIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          disabled={!lead.consentFlag}
                          className={cn("h-8 w-8 p-0 rounded-xl hover:bg-blue-500 hover:text-white transition-all", !lead.consentFlag && "opacity-20")}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>

                    {/* Compliance */}
                    <td className="px-5 py-4">
                      {lead.consentFlag ? (
                        <Badge variant="outline" className="text-[7px] font-black uppercase text-emerald-500 border-emerald-500/20 bg-emerald-500/5">
                          Opt-In
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[7px] font-black uppercase text-rose-500 border-rose-500/20 bg-rose-500/5">
                          Silent
                        </Badge>
                      )}
                    </td>

                    {/* Captured */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-[10px] font-bold text-slate-400">{new Date(lead.createdAt).toLocaleDateString()}</p>
                      <p className="text-[9px] text-slate-300">{new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>

                    {/* Row CTA */}
                    <td className="px-5 py-4">
                      <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FilterChip Component ────────────────────────────────────────────────────

function FilterChip({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const isActive = value !== "ALL";
  return (
    <Popover>
      <PopoverTrigger className={cn(
        "flex items-center gap-1.5 h-9 px-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
        isActive
          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
          : "bg-white dark:bg-white/5 text-slate-500 border-slate-200/60 dark:border-white/10 hover:border-primary/30 hover:text-primary"
      )}>
        <Filter className="h-3 w-3" />
        {isActive ? value : label}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </PopoverTrigger>
      <PopoverContent className="w-44 rounded-2xl p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/60 shadow-xl" align="start">
        <div className="space-y-0.5">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors",
                value === opt ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-50 dark:hover:bg-white/5"
              )}
            >
              {opt === "ALL" ? `All ${label}s` : opt.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function ExecutiveDashboard({ 
  initialLeads,
  userRole,
  currentUserId,
  team,
  branches
}: { 
  initialLeads: Record<string, any>[]; 
  userRole: string;
  currentUserId: string;
  team: any[];
  branches: any[];
}) {
  const { dateRange, category } = useDashboardStore();

  const globalFilteredLeads = useMemo(() => {
    return initialLeads.filter(l => {
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
  }, [initialLeads, dateRange, category]);

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

        <div className="flex items-center gap-3">
            <BulkImportDialog userRole={userRole} branches={branches} />
            <NewLeadDialog userRole={userRole} team={team} branches={branches} />
        </div>
      </div>

      <DashboardFilterBar />

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="bg-white dark:bg-slate-900 h-12 p-1.5 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm w-auto inline-flex gap-1">
          <TabsTrigger value="analytics" className="rounded-xl text-[10px] font-black uppercase tracking-widest h-9 px-5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            /Analytics
          </TabsTrigger>
          <TabsTrigger value="leads" className="rounded-xl text-[10px] font-black uppercase tracking-widest h-9 px-5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            /Leads Data
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-current/10 opacity-60 text-[8px]">{globalFilteredLeads.length}</span>
          </TabsTrigger>
        </TabsList>
 
        <TabsContent value="analytics" className="mt-8 animate-in fade-in slide-in-from-bottom-2">
          <AnalyticsView leads={globalFilteredLeads} userRole={userRole} branches={branches} />
        </TabsContent>
        <TabsContent value="leads" className="mt-8 animate-in fade-in slide-in-from-bottom-2">
          <LeadsDataView leads={globalFilteredLeads} userRole={userRole} team={team} />
        </TabsContent>
      </Tabs>
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
        <Card className="surface-layered border-none rounded-[2.5rem] p-8 shadow-sm ring-1 ring-slate-200/50 overflow-hidden relative group transition-all hover:shadow-xl hover:ring-primary/20">
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

