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

const COLORS = ["#6366f1", "#10b981", "#ec4899", "#f59e0b"];

const INTENT_STYLES: Record<string, string> = {
  HOT:    "bg-rose-500/10 text-rose-600 ring-rose-500/20",
  WARM:   "bg-amber-500/10 text-amber-600 ring-amber-500/20",
  COLD:   "bg-blue-500/10 text-blue-600 ring-blue-500/20",
  UNSCORED: "bg-slate-100 text-slate-500 ring-slate-200/50",
};

const CATEGORY_STYLES: Record<string, string> = {
  INFERTILITY: "bg-purple-500/10 text-purple-600",
  MATERNITY:   "bg-pink-500/10 text-pink-600",
  GYNECOLOGY:  "bg-rose-500/10 text-rose-700",
  OTHER:       "bg-slate-100 text-slate-500",
};

const STATUS_STYLES: Record<string, string> = {
  RAW:               "bg-slate-100 text-slate-600",
  QUALIFIED:         "bg-blue-500/10 text-blue-600",
  CONTACTED:         "bg-indigo-500/10 text-indigo-600",
  APPOINTMENT_FIXED: "bg-violet-500/10 text-violet-600",
  VISITED:           "bg-emerald-500/10 text-emerald-600",
  WON:               "bg-emerald-600/20 text-emerald-700",
  LOST:              "bg-slate-200 text-slate-500 line-through",
};

// ─── Analytics Sub-Component ────────────────────────────────────────────────

function AnalyticsView({ leads }: { leads: Record<string, any>[] }) {
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

  const regionalData = [
    { name: 'Raipur',   count: Math.floor(totalLeads * 0.55) },
    { name: 'Bhilai',   count: Math.floor(totalLeads * 0.30) },
    { name: 'Bilaspur', count: Math.floor(totalLeads * 0.15) }
  ];

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

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ad Spend */}
        <Card className="relative surface-layered border-none rounded-[2rem] p-6 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10 overflow-visible">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <TrendingUp className="h-5 w-5" />
            </div>
            <Popover>
              <PopoverTrigger className="flex items-center justify-center rounded-md h-6 w-6 text-slate-400 hover:text-slate-900 absolute top-4 right-4 focus:outline-none hover:bg-slate-100 transition-colors">
                <Settings className="h-4 w-4" />
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-2xl border border-slate-200/60 shadow-2xl p-4 bg-white/90 backdrop-blur-xl" align="end">
                <div className="space-y-4">
                  <div><h4 className="text-sm font-black italic tracking-tighter">Budget Origin</h4><p className="text-[10px] font-bold text-slate-500 uppercase">Select Data Source</p></div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant={adSpendMode === 'MANUAL' ? "default" : "outline"} className={`text-[10px] font-bold rounded-xl ${adSpendMode === 'MANUAL' && "bg-blue-500 hover:bg-blue-600"}`} onClick={() => setAdSpendMode('MANUAL')}>Manual Entry</Button>
                    <Button variant={adSpendMode === 'META' ? "default" : "outline"} className={`text-[10px] font-bold rounded-xl flex items-center gap-2 ${adSpendMode === 'META' && "bg-[#1877F2] hover:bg-[#1877F2]/90"}`} onClick={() => setAdSpendMode('META')}><FacebookIcon className="h-3 w-3" />Meta CAPI</Button>
                  </div>
                  {adSpendMode === 'MANUAL' && (
                    <div className="pt-2"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Set Value (₹)</label><Input type="number" className="mt-1 font-black text-right rounded-xl h-9 bg-slate-50" value={customAdSpend} onChange={(e) => setCustomAdSpend(Number(e.target.value))} placeholder="e.g. 50000" /></div>
                  )}
                  {adSpendMode === 'META' && (
                    <div className="pt-2 flex flex-col items-center p-3 text-center bg-blue-50 rounded-xl"><Loader2 className="h-4 w-4 text-blue-500 animate-spin mb-2"/><span className="text-[10px] font-bold text-slate-600">Connecting to Business Manager...</span></div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full mr-8">{adSpendMode === 'AUTO' ? 'ESTIMATED' : adSpendMode}</span>
          </div>
          <h3 className="text-3xl font-black tracking-tighter italic">₹{(displayAdSpend / 1000).toFixed(1)}k</h3>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Ad Spend</p>
            <p className="text-[10px] font-black text-slate-600">{totalLeads} Leads</p>
          </div>
        </Card>

        {/* Hot Ratio */}
        <Card className="surface-layered border-none rounded-[2rem] p-6 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500"><Flame className="h-5 w-5 animate-pulse" /></div>
          </div>
          <h3 className="text-3xl font-black tracking-tighter italic text-rose-500">{hotRatio}%</h3>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Hot Ratio</p>
            <p className="text-[10px] font-black text-slate-600">{hotLeads} Hot Leads</p>
          </div>
        </Card>

        {/* IVF Target */}
        <Card className="surface-layered border-none rounded-[2rem] p-6 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Target className="h-5 w-5" /></div>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">ACTIVE</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <h3 className="text-3xl font-black tracking-tighter italic text-emerald-500">{ivfLeads}</h3>
              <span className="text-xs font-black text-slate-400 mb-1">/ 50 IVF Cycles</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: `${targetProgress}%` }} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IVF Funnel */}
        <Card className="lg:col-span-2 surface-layered border-none rounded-[2rem] p-8 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10">
          <div className="flex items-center gap-2 mb-8"><Activity className="h-5 w-5 text-primary" /><h4 className="text-lg font-black italic tracking-tight">The IVF Flow (Infertility Matrix)</h4></div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} width={110} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: 'bold' }} />
                <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={24}>
                  {funnelData.map((_, index) => <Cell key={index} fill={index === 3 ? '#10b981' : '#6366f1'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart */}
        <Card className="surface-layered border-none rounded-[2rem] p-6 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10 flex flex-col">
          <div className="mb-4"><h4 className="text-sm font-black italic tracking-tight">Department Vector</h4><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lead Classification</p></div>
          <div className="flex-1 flex items-center justify-center min-h-[150px]">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={treatmentData} innerRadius={40} outerRadius={65} paddingAngle={5} dataKey="value">
                  {treatmentData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {treatmentData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 p-1.5 rounded-lg">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-[9px] font-black uppercase truncate">{item.name} <span className="opacity-50">({item.value})</span></span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Regional Attribution */}
      <Card className="surface-layered border-none rounded-[2rem] p-8 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10">
        <div className="flex items-center gap-2 mb-6"><MapPin className="h-5 w-5 text-indigo-500" /><h4 className="text-lg font-black italic tracking-tight">Geospatial Momentum</h4></div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={regionalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRegion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: 'bold' }} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorRegion)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// ─── Leads Data Table Sub-Component ─────────────────────────────────────────

function LeadsDataView({ leads }: { leads: Record<string, any>[] }) {
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

  const filtered = useMemo(() => {
    let result = leads.filter(l => {
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
  initialLeads 
}: { 
  initialLeads: Record<string, any>[]; 
}) {
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

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="bg-white dark:bg-slate-900 h-12 p-1.5 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm w-auto inline-flex gap-1">
          <TabsTrigger value="analytics" className="rounded-xl text-[10px] font-black uppercase tracking-widest h-9 px-5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            /Analytics
          </TabsTrigger>
          <TabsTrigger value="leads" className="rounded-xl text-[10px] font-black uppercase tracking-widest h-9 px-5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            /Leads Data
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-current/10 opacity-60 text-[8px]">{initialLeads.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-8 animate-in fade-in slide-in-from-bottom-2">
          <AnalyticsView leads={initialLeads} />
        </TabsContent>
        <TabsContent value="leads" className="mt-8 animate-in fade-in slide-in-from-bottom-2">
          <LeadsDataView leads={initialLeads} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
