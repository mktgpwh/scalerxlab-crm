"use client";

import React, { useState, useEffect } from "react";
import { 
    Activity, 
    TrendingUp, 
    Users, 
    IndianRupee, 
    Layers, 
    ArrowUpRight, 
    ArrowDownRight, 
    Zap, 
    AlertCircle,
    Calendar,
    ChevronDown,
    Filter,
    ShieldAlert
} from "lucide-react";
import { 
    LineChart, 
    Line, 
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
    BarChart, 
    Bar,
    Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const COLORS = ["#243467", "#4F46E5", "#6366F1", "#818CF8", "#A5B4FC"];

export default function MatrixDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState("last30");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/analytics?range=${range}`);
                const json = await res.json();
                setData(json);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [range]);

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <Activity className="h-10 w-10 text-primary animate-pulse mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Synthesizing Intelligence Matrix...</p>
                </div>
            </div>
        );
    }

    const totalRevenue = data?.departments?.reduce((acc: number, d: any) => acc + d.value, 0) || 0;
    const totalWonLeads = data?.conversion?.reduce((acc: number, c: any) => acc + c.won, 0) || 0;

    return (
        <div className="space-y-10 max-w-[1400px] mx-auto pb-20 fade-in duration-700">
            {/* Header / Command Center Controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">MIS Sovereignty Engine</span>
                    </div>
                    <h2 className="text-5xl font-black tracking-tighter text-slate-900 lowercase italic">
                        /intelligence.matrix
                    </h2>
                    <p className="text-sm font-medium text-slate-500">
                        Operational velocity and revenue distribution across all hospital nodes.
                    </p>
                </div>
                
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
                    {[
                        { id: "today", label: "Today" },
                        { id: "last7", label: "Last 7D" },
                        { id: "last30", label: "Last 30D" }
                    ].map(btn => (
                        <Button 
                            key={btn.id}
                            onClick={() => setRange(btn.id)}
                            variant={range === btn.id ? "default" : "ghost"}
                            className={cn(
                                "h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                range === btn.id ? "bg-[#243467] text-white shadow-lg" : "text-slate-400"
                            )}
                        >
                            {btn.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Top Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Billed Revenue", value: `₹${totalRevenue.toLocaleString()}`, sub: "+12.5% from last month", icon: IndianRupee, color: "text-emerald-500" },
                    { label: "Conversion Yield", value: totalWonLeads > 0 ? `${((totalWonLeads / (data?.leaks?.totalCount + totalWonLeads || 1)) * 100).toFixed(1)}%` : "N/A", sub: "Based on 30D won leads", icon: Zap, color: "text-amber-500" },
                    { label: "Active Revenue Leaks", value: data?.leaks?.totalCount || 0, sub: "HOT leads without invoices", icon: ShieldAlert, color: "text-rose-500" },
                    { label: "Patient Velocity", value: data?.conversion?.reduce((acc: number, c: any) => acc + c.raw, 0) || 0, sub: "Leads ingested this period", icon: Users, color: "text-indigo-500" },
                ].map((stat, i) => (
                    <Card key={i} className="surface-layered border-none rounded-[2.5rem] p-6 group hover:scale-[1.02] transition-all">
                        <div className="flex items-start justify-between">
                            <stat.icon className={cn("h-6 w-6 stroke-[2.5px]", stat.color)} />
                            <ArrowUpRight className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="mt-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                            <p className="text-3xl font-black tracking-tighter text-slate-900 mt-1 italic">{stat.value}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">{stat.sub}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Primary Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. Daily Growth Chart (Line/Area) */}
                <Card className="lg:col-span-8 surface-layered border-none rounded-[3rem] p-10 overflow-hidden relative">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black italic tracking-tight">Revenue Growth Velocity</h3>
                            <p className="text-xs font-medium text-slate-400">30-day rolling operational trend</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/5 border-emerald-500/20 px-3 h-8">
                            Surging +8%
                        </Badge>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.revenueTrend}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#243467" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#243467" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="day" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} 
                                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}}
                                    tickFormatter={(val) => `₹${val/1000}k`}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 900, fontSize: '10px' }}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#243467" strokeWidth={4} fillOpacity={1} fill="url(#colorAmount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* 2. Departmental Distribution (Pie) */}
                <Card className="lg:col-span-4 surface-layered border-none rounded-[3rem] p-10 flex flex-col items-center">
                    <div className="text-center mb-8">
                        <h3 className="text-xl font-black italic tracking-tight">Revenue Split</h3>
                        <p className="text-xs font-medium text-slate-400">Departmental contribution</p>
                    </div>
                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.departments}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data?.departments?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 900, fontSize: '10px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</p>
                            <p className="text-2xl font-black italic tracking-tighter">₹{(totalRevenue/1000).toFixed(0)}k</p>
                        </div>
                    </div>
                    <div className="w-full mt-4 space-y-2">
                        {data?.departments?.map((dept: any, i: number) => (
                            <div key={dept.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{dept.name}</span>
                                </div>
                                <span className="text-xs font-black text-slate-900 italic">₹{dept.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* 3. Source Strategy (Conversion Funnel) */}
                <Card className="lg:col-span-7 surface-layered border-none rounded-[3rem] p-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black italic tracking-tight">Lead Conversion Funnel</h3>
                            <p className="text-xs font-medium text-slate-400">Conversion efficiency per source</p>
                        </div>
                        <Filter className="h-5 w-5 text-slate-300" />
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.conversion} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="source" 
                                    type="category" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} 
                                    width={100}
                                />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="raw" fill="#e2e8f0" radius={[0, 10, 10, 0]} name="Raw Leads" barSize={20} />
                                <Bar dataKey="won" fill="#243467" radius={[0, 10, 10, 0]} name="Won Conversions" barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* 4. Revenue Leak Details */}
                <Card className="lg:col-span-5 surface-layered border-none rounded-[3rem] p-10 bg-rose-500/[0.02]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black italic tracking-tight text-rose-600">Revenue Leakage</h3>
                                <p className="text-xs font-medium text-rose-400">{data?.leaks?.totalCount} untracked HOT leads (last 24h)</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {data?.leaks?.leads?.map((lead: any) => (
                            <div key={lead.id} className="p-4 rounded-[1.8rem] bg-white border border-rose-100 flex items-center justify-between group hover:shadow-lg hover:border-rose-300 transition-all cursor-pointer">
                                <div>
                                    <p className="text-sm font-black text-slate-900 group-hover:text-rose-600 transition-colors uppercase italic tracking-tight">{lead.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{lead.phone}</p>
                                </div>
                                <div className="text-right">
                                    <Badge className="bg-rose-500 text-white font-black text-[9px] uppercase tracking-widest mb-1">HOT {lead.aiScore}%</Badge>
                                    <p className="text-[9px] font-bold text-rose-400 uppercase tracking-tight">Active since {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        ))}
                        {data?.leaks?.totalCount > 5 && (
                            <Button variant="link" className="w-full text-rose-500 font-black text-[10px] uppercase tracking-widest">
                                View All {data?.leaks?.totalCount} Leaks <ChevronDown className="h-3 w-3 ml-2" />
                            </Button>
                        )}
                        {data?.leaks?.totalCount === 0 && (
                            <div className="py-20 text-center space-y-4">
                                <CheckCircleIcon className="h-12 w-12 text-emerald-400 mx-auto" />
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest italic">Zero Leakage Detected</p>
                            </div>
                        )}
                    </div>
                </Card>

            </div>
        </div>
    );
}

function CheckCircleIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
