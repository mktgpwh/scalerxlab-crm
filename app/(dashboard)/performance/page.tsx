"use client";

import React, { useMemo, useEffect, useState } from "react";
import { 
  TrendingUp, 
  Users, 
  Target, 
  Activity, 
  Award, 
  Zap, 
  Globe, 
  Phone, 
  MapPin, 
  BarChart3, 
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Sparkles,
  PieChart as PieChartIcon,
  Filter,
  Download,
  Search,
  ArrowRight,
  Loader2
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  AreaChart,
  Area,
  PieChart,
  Pie,
  CartesianGrid
} from "recharts";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { getPerformanceMatrixData } from "./actions";

const ICON_MAP: Record<string, any> = {
  TrendingUp,
  MapPin,
  Award,
  Activity
};

export default function PerformanceDashboard() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const role = user?.role as string;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getPerformanceMatrixData();
        setData(result);
      } catch (error) {
        console.error("Dashboard Data Fetch Error:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // RLS Visibility Mapping
  const visibilityConfig = useMemo(() => {
    switch (role) {
      case "SUPER_ADMIN":
        return { scope: "GLOBAL", description: "All Center Sovereignty" };
      case "TELE_SALES_ADMIN":
        return { scope: "CENTRALIZED", description: "Cross-Center Digital Funnel" };
      case "FIELD_SALES_ADMIN":
        return { scope: "LOCALIZED", description: "My Assigned Field Matrix" };
      case "TELE_SALES":
      case "FIELD_SALES":
        return { scope: "NODE_INDIVIDUAL", description: "Personal Performance Ledger" };
      default:
        return { scope: "RESTRICTED", description: "Limited View" };
    }
  }, [role]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-sm font-black text-zinc-400 uppercase tracking-widest animate-pulse">Syncing Production Matrix...</p>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Aggregating Global Clinical Signals</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-8 space-y-10 min-h-screen bg-[#fafafa] dark:bg-[#03060b] max-w-[1600px] mx-auto">
      {/* Dynamic Command Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-zinc-200/60 dark:border-white/5">
        <div className="space-y-1.5">
           <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Operational Intelligence Matrix</span>
           </div>
           <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white lowercase">/bi.performance</h1>
           <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[9px] font-black uppercase text-indigo-500 border-indigo-500/20">{visibilityConfig.scope} SCOPE</Badge>
              <p className="text-xs font-medium text-zinc-500 max-w-xl">
                {visibilityConfig.description}. Holistic telemetry across departmental nodes.
              </p>
           </div>
        </div>

        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-2xl border-zinc-200 dark:border-white/10 font-bold px-6 h-11 text-xs gap-2">
              <Download className="h-4 w-4" />
              EXPORT AUDIT
           </Button>
           <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black px-6 h-11 text-xs shadow-xl shadow-indigo-500/20 gap-2">
              <Filter className="h-4 w-4" />
              NODE FILTERS
           </Button>
        </div>
      </div>

      <Tabs defaultValue="overall" className="space-y-10">
        <TabsList className="bg-zinc-100/50 dark:bg-white/5 p-1 rounded-2xl border border-zinc-200/50 dark:border-white/5 h-14">
          <TabsTrigger value="overall" className="rounded-xl px-8 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-lg data-[state=active]:text-indigo-600">
             Overall Matrix
          </TabsTrigger>
          <TabsTrigger value="field" className="rounded-xl px-8 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-lg data-[state=active]:text-indigo-600">
             Field Sales
          </TabsTrigger>
          <TabsTrigger value="digital" className="rounded-xl px-8 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-lg data-[state=active]:text-indigo-600">
             Digital & Tele-Sales
          </TabsTrigger>
          <TabsTrigger value="centers" className="rounded-xl px-8 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-lg data-[state=active]:text-indigo-600">
             Center-Wise
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
           {/* KPI Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.overallStats.map((stat: any, i: number) => {
                const Icon = ICON_MAP[stat.icon] || TrendingUp;
                return (
                  <Card key={i} className="border-none bg-white dark:bg-zinc-900/50 ai-glass rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 ring-1 ring-zinc-200/50 dark:ring-white/5">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-4">
                          <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12",
                            stat.color === 'indigo' ? "bg-indigo-500/10 text-indigo-500" :
                            stat.color === 'emerald' ? "bg-emerald-500/10 text-emerald-500" :
                            stat.color === 'amber' ? "bg-amber-500/10 text-amber-500" :
                            "bg-rose-500/10 text-rose-500"
                          )}>
                              <Icon className="h-6 w-6" />
                          </div>
                          <div className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-black tracking-tighter flex items-center gap-1",
                              stat.growth.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          )}>
                              {stat.growth.startsWith('+') ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                              {stat.growth}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                          <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{stat.value}</h3>
                        </div>
                    </CardContent>
                  </Card>
                );
              })}
           </div>

           {/* Funnel Matrix */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border-none bg-white dark:bg-zinc-900/50 ai-glass rounded-[40px] shadow-sm ring-1 ring-zinc-200/50 dark:ring-white/5 p-10">
                 <div className="flex items-center justify-between mb-12">
                     <div className="space-y-1">
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight capitalize">The Conversion Funnel</h3>
                        <p className="text-xs font-medium text-zinc-500">Visualizing structural drop-offs from raw signals to converted revenue.</p>
                     </div>
                     <BarChart3 className="h-6 w-6 text-indigo-500/40" />
                 </div>
                 <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={data.funnelData} layout="vertical" barSize={36} margin={{ left: 100 }}>
                          <XAxis type="number" hide />
                          <YAxis 
                             dataKey="name" 
                             type="category" 
                             axisLine={false} 
                             tickLine={false} 
                             tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                          />
                          <Tooltip 
                             cursor={{ fill: 'transparent' }}
                             contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                          />
                          <Bar dataKey="value" radius={[0, 20, 20, 0]}>
                             {data.funnelData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                             ))}
                          </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </Card>

              <div className="space-y-6">
                 <Card className="border-none bg-indigo-600 rounded-[40px] p-10 text-white relative overflow-hidden group shadow-2xl shadow-indigo-500/20">
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                       <Zap className="h-32 w-32" />
                    </div>
                    <div className="relative space-y-6">
                       <Badge className="bg-white/20 text-white border-white/10 rounded-full px-3 py-1 font-bold text-[9px] uppercase tracking-widest backdrop-blur-md">Production Status</Badge>
                       <div className="space-y-2">
                          <h4 className="text-3xl font-black tracking-tighter leading-tight">Live Intelligence</h4>
                          <p className="text-sm font-medium text-indigo-50 opacity-80 leading-relaxed capitalize">
                             Database is purged and syncing live. Current metrics reflect real-time operational intake and actual converted revenue.
                          </p>
                       </div>
                       <Button className="w-full h-14 bg-white text-indigo-600 hover:bg-zinc-100 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">VIEW AI INSIGHTS</Button>
                    </div>
                 </Card>

                 <Card className="border-none bg-white dark:bg-zinc-900/50 ai-glass rounded-[40px] shadow-sm ring-1 ring-zinc-200/50 dark:ring-white/5 p-10">
                    <div className="flex items-center gap-3 mb-6">
                       <PieChartIcon className="h-5 w-5 text-indigo-500" />
                       <h4 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">Lead Origin Matrix</h4>
                    </div>
                    <div className="h-[200px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                             <Pie 
                                data={data.leadOriginMatrix} 
                                innerRadius={60} 
                                outerRadius={80} 
                                paddingAngle={5} 
                                dataKey="value"
                             >
                                {data.leadOriginMatrix.map((entry: any, index: number) => (
                                   <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                             </Pie>
                             <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: 'none', fontSize: '10px', fontWeight: 'bold' }} />
                          </PieChart>
                       </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 px-2">
                       {data.leadOriginMatrix.map((entry: any, i: number) => (
                         <div key={i} className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                            <span className="text-[9px] font-black uppercase text-zinc-400">{entry.name}</span>
                         </div>
                       ))}
                    </div>
                  </Card>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="field" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                   <div className="space-y-1">
                      <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight lowercase">/field.roster</h3>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Cross-Center Performance Matrix</p>
                   </div>
                   <Button variant="ghost" className="h-10 w-10 p-0 rounded-full bg-zinc-100/50">
                      <Search className="h-4 w-4" />
                   </Button>
                </div>

                <div className="space-y-4">
                   {data.fieldReps.length > 0 ? data.fieldReps.map((rep: any, i: number) => (
                      <Card key={i} className="border-none bg-white dark:bg-zinc-900/50 ai-glass rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 ring-1 ring-zinc-200/50 p-6 group cursor-pointer">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                  <Users className="h-7 w-7" />
                               </div>
                               <div className="space-y-1">
                                  <h4 className="font-black text-zinc-900 dark:text-white text-lg leading-tight">{rep.name}</h4>
                                  <div className="flex items-center gap-2">
                                     <Badge className="bg-indigo-50 text-indigo-600 border-none rounded-full px-2 py-0 h-4 text-[8px] font-black uppercase tracking-widest">{rep.center} HOME</Badge>
                                     <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Sourced {rep.leads} Signals</span>
                                  </div>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">REALIZED REVENUE</p>
                               <h5 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{rep.revenue}</h5>
                            </div>
                         </div>
                         <div className="mt-6 flex items-center gap-2 overflow-hidden">
                            <span className="text-[9px] font-black uppercase text-zinc-400 whitespace-nowrap">CONTRIBUTING TO:</span>
                            <div className="flex items-center gap-1.5">
                               {rep.centers.map((center: string) => (
                                  <span key={center} className="px-2.5 py-1 bg-zinc-100 dark:bg-white/5 rounded-full text-[8px] font-bold text-zinc-500 uppercase tracking-tighter border border-zinc-200/50">{center}</span>
                               ))}
                            </div>
                         </div>
                      </Card>
                   )) : (
                      <div className="p-12 rounded-[40px] border-2 border-dashed border-zinc-100 flex items-center justify-center dark:border-white/5">
                         <p className="text-sm font-bold text-zinc-400">RESTRICTED SCOPE: Field roster visibility unavailable or data set empty.</p>
                      </div>
                   )}
                </div>
              </div>

              <div className="space-y-8">
                 <Card className="border-none bg-white dark:bg-zinc-900/50 ai-glass rounded-[40px] shadow-sm ring-1 ring-zinc-200/50 dark:ring-white/5 p-10">
                    <div className="space-y-1 mb-10">
                       <h4 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-widest">Growth Calibrator</h4>
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Doctor Referrals & Camp Outreach (Live)</p>
                    </div>
                    <div className="h-[300px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={[
                             { name: 'WEEK 1', docRec: 0, camps: 0 },
                             { name: 'WEEK 2', docRec: 0, camps: 0 },
                             { name: 'WEEK 3', docRec: 0, camps: 0 },
                             { name: 'WEEK 4', docRec: 0, camps: 0 },
                          ]}>
                             <defs>
                                <linearGradient id="colorDoc" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                   <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorCamp" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                   <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                             <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: 'none', fontSize: '10px', fontWeight: 'bold' }} />
                             <Area type="monotone" dataKey="docRec" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorDoc)" />
                             <Area type="monotone" dataKey="camps" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCamp)" />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                       <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100">
                          <h4 className="text-2xl font-black text-indigo-600 mb-1">0</h4>
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Active Partner Doctors</p>
                       </div>
                       <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100">
                          <h4 className="text-2xl font-black text-emerald-600 mb-1">0</h4>
                          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Successful Camps YTD</p>
                       </div>
                    </div>
                 </Card>

                 <Card className="border-none bg-emerald-600 rounded-[40px] p-10 text-white relative overflow-hidden group shadow-2xl shadow-emerald-500/20">
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-[30deg] transition-transform duration-1000">
                       <Globe className="h-32 w-32" />
                    </div>
                    <div className="relative space-y-6">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Field Conversion Ratio</p>
                          <h4 className="text-6xl font-black tracking-tighter leading-none">0.0%</h4>
                       </div>
                       <div className="space-y-2">
                          <p className="text-xs font-medium text-emerald-50 opacity-80 leading-relaxed capitalize">
                             Field-sourced signals are calibrated to clinical check-ins (Visited). Pending live production inflow.
                          </p>
                       </div>
                       <div className="pt-4 flex items-center gap-4">
                          <div className="h-px flex-1 bg-white/20" />
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-60 italic">Attribution Protocol Verified</span>
                       </div>
                    </div>
                 </Card>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="digital" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 border-none bg-white dark:bg-zinc-900/50 ai-glass rounded-[40px] shadow-sm ring-1 ring-zinc-200/50 dark:ring-white/5 p-10">
                 <div className="space-y-1 mb-10">
                    <h4 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-widest">AgentX AI Triage</h4>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Autonomous Qualification Rate</p>
                 </div>
                 
                 <div className="flex flex-col items-center justify-center space-y-8 py-10">
                    <div className="relative h-64 w-64">
                       <svg className="h-full w-full" viewBox="0 0 100 100">
                          <circle className="stroke-zinc-100 dark:stroke-white/5" cx="50" cy="50" r="45" strokeWidth="8" fill="none" strokeDasharray="283" strokeDashoffset="0" strokeLinecap="round" />
                          <circle className="stroke-indigo-500 transition-all duration-[2000ms]" cx="50" cy="50" r="45" strokeWidth="8" fill="none" strokeDasharray="283" strokeDashoffset="0" strokeLinecap="round" />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <h4 className="text-6xl font-black text-indigo-600 leading-none">0%</h4>
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] mt-2">Precision Rate</span>
                       </div>
                    </div>
                    
                    <div className="space-y-6 w-full">
                       <div className="flex items-center justify-between p-5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                          <div className="flex items-center gap-3">
                             <Sparkles className="h-4 w-4 text-indigo-500" />
                             <span className="text-[10px] font-black uppercase text-zinc-600">Qualified by AI</span>
                          </div>
                          <span className="text-sm font-black text-indigo-600">0</span>
                       </div>
                       <div className="flex items-center justify-between p-5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                          <div className="flex items-center gap-3">
                             <Target className="h-4 w-4 text-emerald-500" />
                             <span className="text-[10px] font-black uppercase text-zinc-600">Directly Booked</span>
                          </div>
                          <span className="text-sm font-black text-emerald-600">0</span>
                       </div>
                    </div>
                 </div>
              </Card>

              <Card className="lg:col-span-2 border-none bg-white dark:bg-zinc-900/50 ai-glass rounded-[40px] shadow-sm ring-1 ring-zinc-200/50 dark:ring-white/5 p-10 overflow-hidden">
                 <div className="flex items-center justify-between mb-12">
                    <div className="space-y-1">
                       <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight lowercase">/tele-sales.leaderboard</h3>
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Human Engagement Flow (Live)</p>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="outline" size="sm" className="h-8 text-[9px] font-black uppercase rounded-full">30 Days</Button>
                       <Button variant="outline" size="sm" className="h-8 text-[9px] font-black uppercase rounded-full border-indigo-500 text-indigo-600 bg-indigo-50">90 Days</Button>
                    </div>
                 </div>

                 <div className="w-full overflow-x-auto">
                    <table className="w-full">
                       <thead>
                          <tr className="border-b border-zinc-100 dark:border-white/5">
                             <th className="text-left pb-4 text-[10px] font-black uppercase text-zinc-400 tracking-widest pl-4">Agent Node</th>
                             <th className="text-center pb-4 text-[10px] font-black uppercase text-zinc-400 tracking-widest">Assigned</th>
                             <th className="text-center pb-4 text-[10px] font-black uppercase text-zinc-400 tracking-widest">Booked</th>
                             <th className="text-center pb-4 text-[10px] font-black uppercase text-zinc-400 tracking-widest">Visited Ratio</th>
                             <th className="text-right pb-4 text-[10px] font-black uppercase text-zinc-400 tracking-widest pr-4">Converters</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-zinc-50 dark:divide-white/5">
                          {data.teleSales.map((agent: any, i: number) => (
                             <tr key={i} className="group hover:bg-zinc-50 dark:hover:bg-white/5 transition-all">
                                <td className="py-6 pl-4">
                                   <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm text-white" style={{ background: agent.color }}>
                                         {agent.name.charAt(0)}
                                      </div>
                                      <span className="font-black text-zinc-900 dark:text-white text-sm">{agent.name}</span>
                                   </div>
                                </td>
                                <td className="py-6 text-center text-sm font-bold text-zinc-500">{agent.assigned}</td>
                                <td className="py-6 text-center text-sm font-bold text-zinc-900 dark:text-white">{agent.booked}</td>
                                <td className="py-6 text-center">
                                   <div className="flex items-center justify-center gap-2">
                                      <div className="h-1.5 w-16 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                                         <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: agent.booked > 0 ? `${(agent.visited / agent.booked) * 100}%` : '0%' }} />
                                      </div>
                                      <span className="text-[10px] font-black text-indigo-600">{agent.booked > 0 ? Math.round((agent.visited / agent.booked) * 100) : 0}%</span>
                                   </div>
                                </td>
                                <td className="py-6 text-right pr-4">
                                   <div className="flex flex-col items-end">
                                      <span className="text-lg font-black text-emerald-600 tracking-tighter uppercase">{agent.converted}</span>
                                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{agent.assigned > 0 ? Math.round((agent.converted / agent.assigned) * 100) : 0}% EFFICIENCY</span>
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="centers" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border-none bg-white dark:bg-zinc-900/50 ai-glass rounded-[40px] shadow-sm ring-1 ring-zinc-200/50 dark:ring-white/5 p-10">
                 <div className="flex items-center justify-between mb-12">
                    <div className="space-y-1">
                       <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight lowercase">/center.ops_spread</h3>
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Source Breakdown per Operational Node</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-indigo-500" />
                          <span className="text-[9px] font-black uppercase text-zinc-400">Digital</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="text-[9px] font-black uppercase text-zinc-400">Field</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-zinc-200" />
                          <span className="text-[9px] font-black uppercase text-zinc-400">Organic</span>
                       </div>
                    </div>
                 </div>

                 <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={data.centerPerformance} barGap={8} barSize={40}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                          <Tooltip 
                             cursor={{ fill: '#f8fafc', radius: 20 }}
                             contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                          />
                          <Bar dataKey="digital" fill="#6366f1" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="field" fill="#10b981" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="organic" fill="#e2e8f0" radius={[8, 8, 0, 0]} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </Card>

              <div className="space-y-6">
                 {data.centerPerformance.map((center: any, i: number) => (
                    <Card key={i} className="border-none bg-white dark:bg-zinc-900/50 ai-glass rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 ring-1 ring-zinc-200/50 p-8 flex items-center justify-between group cursor-pointer">
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Operational Center</p>
                          <h4 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter group-hover:text-indigo-600 transition-colors">{center.name}</h4>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Status Active</p>
                       </div>
                    </Card>
                 ))}

                 <Card className="border-none bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden group shadow-2xl shadow-indigo-500/20">
                    <div className="relative space-y-4">
                       <h4 className="text-sm font-black uppercase tracking-widest">Expansion Protocol</h4>
                       <p className="text-xs font-medium text-indigo-50 opacity-80 leading-relaxed capitalize">
                          Analyze node saturation and digital CPA to identify the next high-intent geography for clinical deployment.
                       </p>
                       <Button variant="link" className="text-white p-0 h-auto font-black text-xs uppercase tracking-widest flex items-center gap-2 group/btn">
                          Launch Expansion BI
                          <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                       </Button>
                    </div>
                 </Card>
              </div>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
