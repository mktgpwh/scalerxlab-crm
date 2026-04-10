"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  TrendingUp, 
  Flame, 
  Clock, 
  MapPin, 
  Loader2,
  BarChart3,
  CalendarDays,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AnalyticsDashboard() {
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadStats();
  }, [selectedBranchId]);

  const loadInitialData = async () => {
    try {
      const res = await fetch(`/api/branches`);
      const data = await res.json();
      setBranches(data || []);
    } catch (e) {
      console.error(e);
      setBranches([]);
    }
  };

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/stats?branchId=${selectedBranchId}`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!stats && isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative flex h-3 w-3 mt-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tighter italic lowercase">/Executive intelligence</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Real-time performance metrics</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-2xl ring-1 ring-slate-200/50 dark:ring-white/10">
              <MapPin className="h-4 w-4 text-primary" />
              <Select value={selectedBranchId} onValueChange={(val) => setSelectedBranchId(val ?? "all")}>
                <SelectTrigger className="w-[180px] bg-transparent border-none p-0 h-auto focus:ring-0 text-xs font-black uppercase tracking-widest">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200/50 dark:border-white/10 shadow-2xl">
                  <SelectItem value="all" className="text-xs font-bold uppercase">Global View</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id} className="text-xs font-bold uppercase">{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
           </div>
           
           <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-2xl ring-1 ring-slate-200/50 dark:ring-white/10">
              <Users className="h-4 w-4 text-emerald-500" />
              <Select defaultValue="all">
                <SelectTrigger className="w-[160px] bg-transparent border-none p-0 h-auto focus:ring-0 text-xs font-black uppercase tracking-widest text-emerald-600">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200/50 dark:border-white/10 shadow-2xl">
                  <SelectItem value="all" className="text-xs font-bold uppercase">All Departments</SelectItem>
                  <SelectItem value="INFERTILITY" className="text-xs font-bold uppercase">Infertility (IVF)</SelectItem>
                  <SelectItem value="MATERNITY" className="text-xs font-bold uppercase">Maternity</SelectItem>
                  <SelectItem value="GYNECOLOGY" className="text-xs font-bold uppercase">Gynecology</SelectItem>
                  <SelectItem value="OTHER" className="text-xs font-bold uppercase">Other</SelectItem>
                </SelectContent>
              </Select>
           </div>
           <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-2xl ring-1 ring-slate-200/50 dark:ring-white/10">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Last 30 Days</span>
           </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { title: "Total Signals", value: stats?.totalLeads || 0, icon: Users, trend: "+12.5%", color: "primary" },
           { title: "High Intent", value: stats?.hotLeads || 0, icon: Flame, trend: "+8.2%", color: "rose" },
           { title: "Conversion Ratio", value: `${stats?.conversionRate || 0}%`, icon: TrendingUp, trend: "+2.1%", color: "emerald" },
           { title: "Avg Latency", value: `${stats?.avgResponseTime || "N/A"}`, icon: Clock, trend: "-14%", color: "amber" }
         ].map((kpi, idx) => (
           <Card key={idx} className="surface-layered border-none rounded-[2rem] p-6 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10 group hover:glow-primary transition-all duration-500">
              <div className="flex justify-between items-start mb-4">
                 <div className={`h-12 w-12 rounded-2xl bg-${kpi.color}-500/10 flex items-center justify-center text-${kpi.color}-500`}>
                    <kpi.icon className="h-6 w-6" />
                 </div>
                 <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">{kpi.trend}</span>
              </div>
              <div className="space-y-1">
                 <h3 className="text-3xl font-black tracking-tighter italic">{kpi.value}</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.title}</p>
              </div>
           </Card>
         ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         <Card className="xl:col-span-2 surface-layered border-none rounded-[3rem] p-8 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h4 className="text-lg font-black italic tracking-tight">Signal Intake Over Time</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temporal engagement mapping</p>
               </div>
               <BarChart3 className="h-5 w-5 text-slate-300" />
            </div>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.intakeData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIntake" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fontWeight: 900, fill: "#94A3B8" }} 
                      tickFormatter={(val) => val ? new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fontWeight: 900, fill: "#94A3B8" }} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#6366f1" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorIntake)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </Card>

         <Card className="surface-layered border-none rounded-[3rem] p-8 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h4 className="text-lg font-black italic tracking-tight">Source Attribution</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Origin distribution</p>
               </div>
            </div>
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.sourceData || []}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {(stats?.sourceData || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
               </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-2">
               {(stats?.sourceData || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-[10px] font-black uppercase tracking-tight text-slate-500">{item.name}</span>
                     </div>
                     <span className="text-[11px] font-black tracking-tighter">{item.value} signals</span>
                  </div>
               ))}
            </div>
         </Card>
      </div>

      {/* Attribution Table / Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Card className="surface-layered border-none rounded-[2.5rem] p-8 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10 overflow-hidden">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Staff Performance Leaderboard</h4>
            <div className="space-y-6">
               {(stats?.staffLeaderboard || []).map((staff: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xs font-black">
                           {staff.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                           <p className="text-sm font-black italic tracking-tight">{staff.name}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase">{staff.role}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="text-right">
                           <p className="text-xs font-black tracking-tighter">{staff.conversionRate}%</p>
                           <p className="text-[8px] font-bold text-emerald-500 uppercase">Conversion</p>
                        </div>
                        <div className="h-8 w-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                           <div className="h-[60%] w-full bg-emerald-500" style={{ height: `${staff.conversionRate}%` }} />
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </Card>

         <Card className="bg-primary border-none rounded-[2.5rem] p-8 shadow-2xl shadow-primary/20 text-white relative overflow-hidden">
            <div className="absolute top-[-20px] right-[-20px] h-40 w-40 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-6">
               <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-white" />
               </div>
               <h4 className="text-3xl font-black italic tracking-tighter leading-tight">AI Sales Prediction Node</h4>
               <p className="text-sm font-medium opacity-80 leading-relaxed italic">
                 &quot;Based on the current high-intent {stats?.hotLeads || 0} leads from {selectedBranchId === 'all' ? 'global' : branches.find(b => b.id === selectedBranchId)?.city || 'local'} branches, the system expects a 15% revenue uptick in the next 14 cycles.&quot;
               </p>
               <Button className="w-full bg-white text-primary hover:bg-slate-50 rounded-2xl h-12 text-xs font-black uppercase tracking-widest transition-transform hover:scale-[1.02]">
                  Activate Insights Node
               </Button>
            </div>
         </Card>
      </div>
    </div>
  );
}
