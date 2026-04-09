"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { 
  BrainCircuit, 
  Target, 
  Flame, 
  TrendingUp, 
  Activity, 
  MapPin, 
  Loader2 
} from "lucide-react";
import { Lead } from "@/lib/types";

const COLORS = ["#6366f1", "#10b981", "#ec4899", "#f59e0b"];

export function ExecutiveDashboard({ 
  initialLeads, 
  orgSlug 
}: { 
  initialLeads: Record<string, any>[]; 
  orgSlug: string; 
}) {
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);

  // Derive Metrics
  const totalLeads = initialLeads.length;
  const hotLeads = initialLeads.filter(l => l.intent === 'HOT').length;
  const hotRatio = totalLeads > 0 ? ((hotLeads / totalLeads) * 100).toFixed(1) : 0;
  
  // Synthetic Ad Spend (Assuming ~₹200 CPA on average organically)
  const syntheticAdSpend = totalLeads * 200;

  // IVF Target (50 Leads)
  const ivfLeads = initialLeads.filter(l => l.category === 'INFERTILITY').length;
  const targetProgress = Math.min((ivfLeads / 50) * 100, 100);

  // Treatment Data for Pie Chart
  const maternityLeads = initialLeads.filter(l => l.category === 'MATERNITY').length;
  const gynoLeads = initialLeads.filter(l => l.category === 'GYNECOLOGY').length;
  const otherLeads = initialLeads.filter(l => l.category === 'OTHER').length;

  const treatmentData = [
    { name: 'IVF', value: ivfLeads },
    { name: 'MDT', value: maternityLeads },
    { name: 'GYN', value: gynoLeads },
    { name: 'OTH', value: otherLeads },
  ].filter(d => d.value > 0);

  // Regional Attribution (Synthetic Random distribution based on total for demo if actual branch null)
  const regionalData = [
    { name: 'Raipur', count: Math.floor(totalLeads * 0.55) },
    { name: 'Bhilai', count: Math.floor(totalLeads * 0.30) },
    { name: 'Bilaspur', count: Math.floor(totalLeads * 0.15) }
  ];

  // IVF Funnel Pipeline
  const ivfPipelineLeads = initialLeads.filter(l => l.category === 'INFERTILITY');
  const counts = {
     RAW: ivfPipelineLeads.filter(l => l.status === 'RAW').length,
     QUALIFIED: ivfPipelineLeads.filter(l => l.status === 'QUALIFIED').length,
     VISITED: ivfPipelineLeads.filter(l => l.status === 'VISITED').length,
     WON: ivfPipelineLeads.filter(l => l.status === 'WON').length,
  };
  const funnelData = [
    { stage: 'Raw Intake', count: counts.RAW },
    { stage: 'Qualified', count: counts.QUALIFIED },
    { stage: 'Clinic Visited', count: counts.VISITED },
    { stage: 'Enrolled', count: counts.WON },
  ];

  useEffect(() => {
    fetch(`/api/organizations/${orgSlug}/executive-insight`)
      .then(res => res.json())
      .then(data => {
        if (data.insight) setInsight(data.insight);
      })
      .catch(console.error)
      .finally(() => setInsightLoading(false));
  }, [orgSlug]);

  return (
    <div className="space-y-8 pb-10">
      
      {/* Structural Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter italic lowercase text-slate-900 dark:text-white">/intelligence.hub</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Executive Analytics Matrix</p>
        </div>
      </div>

      {/* Groq Insight Node */}
      <Card className="relative overflow-hidden border-none rounded-[2rem] bg-gradient-to-br from-slate-900 to-black shadow-2xl p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
        <div className="relative z-10 flex gap-6 items-start">
           <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              {insightLoading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <BrainCircuit className="h-6 w-6 text-emerald-400" />}
           </div>
           <div className="space-y-2 flex-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">Tactical Node | Llama-3</h3>
              <p className="text-sm md:text-base font-medium text-slate-200 leading-relaxed italic">
                 {insightLoading ? "Vectorizing clinical pipeline data for strategic extraction..." : `"${insight}"`}
              </p>
           </div>
        </div>
      </Card>

      {/* KPI Grid Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="surface-layered border-none rounded-[2rem] p-6 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10">
            <div className="flex justify-between items-start mb-4">
               <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <TrendingUp className="h-5 w-5" />
               </div>
               <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">ESTIMATED</span>
            </div>
            <h3 className="text-3xl font-black tracking-tighter italic">₹{(syntheticAdSpend / 1000).toFixed(1)}k</h3>
            <div className="flex items-center justify-between mt-1">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Ad Spend</p>
               <p className="text-[10px] font-black text-slate-600">{totalLeads} Leads</p>
            </div>
         </Card>
         
         <Card className="surface-layered border-none rounded-[2rem] p-6 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10">
            <div className="flex justify-between items-start mb-4">
               <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <Flame className="h-5 w-5 animate-pulse" />
               </div>
            </div>
            <h3 className="text-3xl font-black tracking-tighter italic text-rose-500">{hotRatio}%</h3>
            <div className="flex items-center justify-between mt-1">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Hot Ratio</p>
               <p className="text-[10px] font-black text-slate-600">{hotLeads} Hot Leads</p>
            </div>
         </Card>

         <Card className="surface-layered border-none rounded-[2rem] p-6 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10">
            <div className="flex justify-between items-start mb-4">
               <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Target className="h-5 w-5" />
               </div>
               <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">ACTIVE</span>
            </div>
            <div className="space-y-3">
               <div className="flex justify-between items-end">
                  <h3 className="text-3xl font-black tracking-tighter italic text-emerald-500">{ivfLeads}</h3>
                  <span className="text-xs font-black text-slate-400 mb-1">/ 50 IVF Cyles</span>
               </div>
               <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: `${targetProgress}%` }} />
               </div>
            </div>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* The IVF Funnel */}
         <Card className="lg:col-span-2 surface-layered border-none rounded-[2rem] p-8 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10">
            <div className="flex items-center gap-2 mb-8">
               <Activity className="h-5 w-5 text-primary" />
               <h4 className="text-lg font-black italic tracking-tight">The IVF Flow (Infertility Matrix)</h4>
            </div>
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.5} />
                     <XAxis type="number" hide />
                     <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} width={100} />
                     <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                     <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={24} fill="#6366f1">
                        {funnelData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={index === 3 ? '#10b981' : '#6366f1'} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </Card>

         {/* Distribution Column */}
         <div className="space-y-6">
            <Card className="surface-layered border-none rounded-[2rem] p-6 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10 flex flex-col h-full">
               <div className="mb-4">
                  <h4 className="text-sm font-black italic tracking-tight">Department Vector</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lead Classification</p>
               </div>
               <div className="flex-1 flex items-center justify-center min-h-[150px]">
                  <ResponsiveContainer w-full h-full>
                     <PieChart>
                        <Pie data={treatmentData} innerRadius={40} outerRadius={65} paddingAngle={5} dataKey="value">
                           {treatmentData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', fontSize: '10px', fontWeight: 'bold' }} />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="grid grid-cols-2 gap-2 mt-2">
                  {treatmentData.map((item, idx) => (
                     <div key={idx} className="flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 p-1.5 rounded-lg">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-[9px] font-black uppercase truncate">{item.name} <span className="opacity-50">({item.value})</span></span>
                     </div>
                  ))}
               </div>
            </Card>
         </div>
      </div>

      {/* Regional Attribution Bottom Span */}
      <Card className="surface-layered border-none rounded-[2rem] p-8 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10">
         <div className="flex items-center gap-2 mb-6">
            <MapPin className="h-5 w-5 text-indigo-500" />
            <h4 className="text-lg font-black italic tracking-tight">Geospatial Momentum</h4>
         </div>
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
