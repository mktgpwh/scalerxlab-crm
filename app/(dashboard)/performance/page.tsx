"use client";

import React, { useMemo } from "react";
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
  ArrowRight
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

// High-Fidelity Mock Data Matrix
const OVERALL_STATS = [
  { label: "Total Pipeline Value", value: "₹4.2 Cr", growth: "+12.5%", icon: TrendingUp, color: "indigo" },
  { label: "Patient Check-Ins (Visited)", value: "842", growth: "+8.2%", icon: MapPin, color: "emerald" },
  { label: "Revenue Realized (Converted)", value: "₹1.8 Cr", growth: "+15.3%", icon: Award, color: "amber" },
  { label: "Mean Conversion Velocity", value: "14 Days", growth: "-2.1%", icon: Activity, color: "rose" },
];

const FUNNEL_DATA = [
  { name: 'Raw Leads', value: 4500, fill: '#6366f1' },
  { name: 'Qualified', value: 3200, fill: '#818cf8' },
  { name: 'Appointments', value: 1800, fill: '#a5b4fc' },
  { name: 'Visited', value: 842, fill: '#c7d2fe' },
  { name: 'Converted', value: 245, fill: '#10b981' },
];

const FIELD_REPS = [
  { name: "Suresh Mehra", center: "Raipur", leads: 145, revenue: "₹28L", conversion: "19%", centers: ["Raipur", "Bhilai"] },
  { name: "Anita Deshmukh", center: "Bhilai", leads: 92, revenue: "₹18L", conversion: "21%", centers: ["Bhilai"] },
  { name: "Rajesh S.", center: "Raipur", leads: 110, revenue: "₹22L", conversion: "18%", centers: ["Raipur", "Bilaspur"] },
  { name: "Karan Johar", center: "Bilaspur", leads: 75, revenue: "₹12L", conversion: "14%", centers: ["Bilaspur"] },
];

const TELE_SALES = [
  { name: "Kusum Singh", assigned: 450, booked: 210, visited: 140, converted: 42, color: "#6366f1" },
  { name: "Rahul Verma", assigned: 380, booked: 180, visited: 110, converted: 30, color: "#818cf8" },
  { name: "Priya Das", assigned: 520, booked: 240, visited: 160, converted: 55, color: "#10b981" },
  { name: "Amit Kumar", assigned: 310, booked: 120, visited: 85, converted: 20, color: "#f59e0b" },
];

const CENTER_PERFORMANCE = [
  { name: 'Raipur', field: 450, digital: 600, organic: 200 },
  { name: 'Bhilai', field: 300, digital: 400, organic: 150 },
  { name: 'Bilaspur', field: 200, digital: 300, organic: 100 },
];

export default function PerformanceDashboard() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const role = user?.role as string;
  const userId = user?.id;

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

  // Simulate RLS filtered data based on role
  const filteredFieldReps = useMemo(() => {
    if (role === "SUPER_ADMIN" || role === "TELE_SALES_ADMIN") return FIELD_REPS;
    if (role === "FIELD_SALES_ADMIN") {
      // In real DB, this would be `managerId === currentUserId`
      return FIELD_REPS.slice(0, 2); 
    }
    return [];
  }, [role]);
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
              {OVERALL_STATS.map((stat, i) => (
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
                            <stat.icon className="h-6 w-6" />
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
              ))}
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
                       <BarChart data={FUNNEL_DATA} layout="vertical" barSize={36} margin={{ left: 100 }}>
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
                             {FUNNEL_DATA.map((entry, index) => (
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
                       <Badge className="bg-white/20 text-white border-white/10 rounded-full px-3 py-1 font-bold text-[9px] uppercase tracking-widest backdrop-blur-md">Hot Lead Triage</Badge>
                       <div className="space-y-2">
                          <h4 className="text-3xl font-black tracking-tighter leading-tight">AI-Enhanced Velocity</h4>
                          <p className="text-sm font-medium text-indigo-50 opacity-80 leading-relaxed capitalize">
                             Current conversions are performing 14% faster than last quarter due to AgentX natural language qualification.
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
                                data={[
                                   { name: 'Smartflo', value: 45, fill: '#6366f1' },
                                   { name: 'AgentX', value: 30, fill: '#8b5cf6' },
                                   { name: 'WhatsApp', value: 15, fill: '#10b981' },
                                   { name: 'Field', value: 10, fill: '#f59e0b' },
                                ]} 
                                innerRadius={60} 
                                outerRadius={80} 
                                paddingAngle={5} 
                                dataKey="value"
                             >
                                <Cell fill="#6366f1" />
                                <Cell fill="#8b5cf6" />
                                <Cell fill="#10b981" />
                                <Cell fill="#f59e0b" />
                             </Pie>
                             <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: 'none', fontSize: '10px', fontWeight: 'bold' }} />
                          </PieChart>
                       </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 px-2">
                       <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-indigo-500" />
                          <span className="text-[9px] font-black uppercase text-zinc-400">Calls</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#8b5cf6]" />
                          <span className="text-[9px] font-black uppercase text-zinc-400">AgentX</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="text-[9px] font-black uppercase text-zinc-400">WA</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          <span className="text-[9px] font-black uppercase text-zinc-400">Field</span>
                       </div>
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
                   {filteredFieldReps.length > 0 ? filteredFieldReps.map((rep, i) => (
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
                                     <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Sourced {rep.leads} Active Signals</span>
                                  </div>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">CONVERTED REVENUE</p>
                               <h5 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{rep.revenue}</h5>
                            </div>
                         </div>
                         <div className="mt-6 flex items-center gap-2 overflow-hidden">
                            <span className="text-[9px] font-black uppercase text-zinc-400 whitespace-nowrap">CONTRIBUTING TO:</span>
                            <div className="flex items-center gap-1.5">
                               {rep.centers.map(center => (
                                  <span key={center} className="px-2.5 py-1 bg-zinc-100 dark:bg-white/5 rounded-full text-[8px] font-bold text-zinc-500 uppercase tracking-tighter border border-zinc-200/50">{center}</span>
                               ))}
                            </div>
                         </div>
                      </Card>
                   )) : (
                      <div className="p-12 rounded-[40px] border-2 border-dashed border-zinc-100 flex items-center justify-center dark:border-white/5">
                         <p className="text-sm font-bold text-zinc-400">RESTRICTED SCOPE: Field roster visibility unavailable at this node level.</p>
                      </div>
                   )}
                </div>
              </div>

              <div className="space-y-8">
                 <Card className="border-none bg-white dark:bg-zinc-900/50 ai-glass rounded-[40px] shadow-sm ring-1 ring-zinc-200/50 dark:ring-white/5 p-10">
                    <div className="space-y-1 mb-10">
                       <h4 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-widest">Network Growth Node</h4>
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Doctor Referrals & Camp Outreach (90D)</p>
                    </div>
                    <div className="h-[300px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={[
                             { name: 'JAN', docRec: 45, camps: 20 },
                             { name: 'FEB', docRec: 52, camps: 28 },
                             { name: 'MAR', docRec: 68, camps: 45 },
                             { name: 'APR', docRec: 85, camps: 60 },
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
                          <h4 className="text-2xl font-black text-indigo-600 mb-1">85</h4>
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Active Partner Doctors</p>
                       </div>
                       <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100">
                          <h4 className="text-2xl font-black text-emerald-600 mb-1">60</h4>
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
                          <h4 className="text-6xl font-black tracking-tighter leading-none">24.5%</h4>
                       </div>
                       <div className="space-y-2">
                          <p className="text-xs font-medium text-emerald-50 opacity-80 leading-relaxed capitalize">
                             Field-sourced leads are achieving clinical check-ins (Visited) at a significantly higher rate than digital organic traffic.
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
                          <circle className="stroke-indigo-500 transition-all duration-[2000ms]" cx="50" cy="50" r="45" strokeWidth="8" fill="none" strokeDasharray="283" strokeDashoffset="45" strokeLinecap="round" />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <h4 className="text-6xl font-black text-indigo-600 leading-none">88%</h4>
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] mt-2">Precision Rate</span>
                       </div>
                    </div>
                    
                    <div className="space-y-6 w-full">
                       <div className="flex items-center justify-between p-5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                          <div className="flex items-center gap-3">
                             <Sparkles className="h-4 w-4 text-indigo-500" />
                             <span className="text-[10px] font-black uppercase text-zinc-600">Qualified by AI</span>
                          </div>
                          <span className="text-sm font-black text-indigo-600">3,240</span>
                       </div>
                       <div className="flex items-center justify-between p-5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                          <div className="flex items-center gap-3">
                             <Target className="h-4 w-4 text-emerald-500" />
                             <span className="text-[10px] font-black uppercase text-zinc-600">Directly Booked</span>
                          </div>
                          <span className="text-sm font-black text-emerald-600">842</span>
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
                          {TELE_SALES.map((agent, i) => (
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
                                         <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${(agent.visited / agent.booked) * 100}%` }} />
                                      </div>
                                      <span className="text-[10px] font-black text-indigo-600">{Math.round((agent.visited / agent.booked) * 100)}%</span>
                                   </div>
                                </td>
                                <td className="py-6 text-right pr-4">
                                   <div className="flex flex-col items-end">
                                      <span className="text-lg font-black text-emerald-600 tracking-tighter uppercase">{agent.converted}</span>
                                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{Math.round((agent.converted / agent.assigned) * 100)}% EFFICIENCY</span>
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
                       <BarChart data={CENTER_PERFORMANCE} barGap={8} barSize={40}>
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
                 {CENTER_PERFORMANCE.map((center, i) => (
                    <Card key={i} className="border-none bg-white dark:bg-zinc-900/50 ai-glass rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 ring-1 ring-zinc-200/50 p-8 flex items-center justify-between group cursor-pointer">
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Operational Center</p>
                          <h4 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter group-hover:text-indigo-600 transition-colors">{center.name}</h4>
                       </div>
                       <div className="text-right">
                          <div className="flex items-center justify-end gap-2 text-emerald-600 font-black">
                             <ArrowUpRight className="h-4 w-4" />
                             <span className="text-lg leading-none">+{Math.floor(Math.random() * 20) + 5}%</span>
                          </div>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Growth Index</p>
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
