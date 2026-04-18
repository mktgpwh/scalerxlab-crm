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

const COLORS = ["#4F46E5", "#06B6D4", "#6366F1", "#8B5CF6", "#EC4899"];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background/80 backdrop-blur-md border border-border/50 p-4 rounded-xl shadow-xl">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
                {payload.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-semibold tracking-tight">
                            {item.name}: {typeof item.value === 'number' ? `₹${item.value.toLocaleString()}` : item.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

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
                    <Activity className="h-8 w-8 text-primary animate-pulse mx-auto" />
                    <p className="text-xs font-medium tracking-tight text-muted-foreground">Synthesizing intelligence matrix...</p>
                </div>
            </div>
        );
    }

    const totalRevenue = data?.departments?.reduce((acc: number, d: any) => acc + d.value, 0) || 0;
    const totalWonLeads = data?.conversion?.reduce((acc: number, c: any) => acc + c.won, 0) || 0;

    return (
        <div className="space-y-12 max-w-[1400px] mx-auto pb-24">
            {/* Header / Command Center Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-8 px-4 md:px-0">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-[0.15em]">Sovereignty Analytics</span>
                    </div>
                    <h2 className="text-4xl font-semibold tracking-tight text-foreground">
                        Intelligence Matrix
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Monitoring operational velocity and clinical revenue distribution.
                    </p>
                </div>
                
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
                    {[
                        { id: "today", label: "Today" },
                        { id: "last7", label: "7 Days" },
                        { id: "last30", label: "30 Days" }
                    ].map(btn => (
                        <Button 
                            key={btn.id}
                            onClick={() => setRange(btn.id)}
                            variant={range === btn.id ? "secondary" : "ghost"}
                            className={cn(
                                "h-8 px-5 rounded-lg text-[11px] font-semibold transition-all",
                                range === btn.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                            )}
                        >
                            {btn.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Top Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-0">
                {[
                    { label: "Billed Revenue", value: `₹${totalRevenue.toLocaleString()}`, sub: "+12.5% from last period", icon: IndianRupee, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                    { label: "Conversion Yield", value: totalWonLeads > 0 ? `${((totalWonLeads / (data?.leaks?.totalCount + totalWonLeads || 1)) * 100).toFixed(1)}%` : "N/A", sub: "Calculated mission efficiency", icon: Zap, color: "text-cyan-500", bg: "bg-cyan-500/10" },
                    { label: "Revenue Leaks", value: data?.leaks?.totalCount || 0, sub: "Qualified leads pending billing", icon: ShieldAlert, color: "text-rose-500", bg: "bg-rose-500/10" },
                    { label: "Lead Velocity", value: data?.conversion?.reduce((acc: number, c: any) => acc + c.raw, 0) || 0, sub: "New clinical intake", icon: Users, color: "text-violet-500", bg: "bg-violet-500/10" },
                ].map((stat, i) => (
                    <Card key={i} className="bg-card border-border/50 rounded-2xl p-6 group transition-all hover:bg-muted/30">
                        <div className="flex items-start justify-between">
                            <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                                <stat.icon className={cn("h-5 w-5", stat.color)} />
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="mt-5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                            <p className="text-3xl font-semibold tracking-tight text-foreground mt-1">{stat.value}</p>
                            <div className="flex items-center gap-1.5 mt-2">
                                <span className="text-[10px] font-semibold text-emerald-500">↑</span>
                                <p className="text-[10px] font-medium text-muted-foreground tracking-tight">{stat.sub}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Primary Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-0">
                
                {/* 1. Daily Growth Chart (Line/Area) */}
                <Card className="lg:col-span-8 bg-card border-border/50 rounded-2xl p-8 overflow-hidden relative">
                    <div className="flex items-center justify-between mb-10">
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold tracking-tight">Revenue Trajectory</h3>
                            <p className="text-xs text-muted-foreground">Rolling operational trend across clinical nodes</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-semibold text-indigo-500 bg-indigo-500/5 px-2.5 py-1">
                            Growth Surging
                        </Badge>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.revenueTrend}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                                <XAxis 
                                    dataKey="day" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 500, fill: 'hsl(var(--muted-foreground))'}} 
                                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 500, fill: 'hsl(var(--muted-foreground))'}}
                                    tickFormatter={(val) => `₹${val/1000}k`}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area 
                                    type="monotone" 
                                    dataKey="amount" 
                                    stroke="#4F46E5" 
                                    strokeWidth={2.5} 
                                    fillOpacity={1} 
                                    fill="url(#colorAmount)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* 2. Departmental Distribution (Pie) */}
                <Card className="lg:col-span-4 bg-card border-border/50 rounded-2xl p-8 flex flex-col">
                    <div className="text-center mb-10">
                        <h3 className="text-lg font-semibold tracking-tight">Revenue Distribution</h3>
                        <p className="text-xs text-muted-foreground">Clinical contribution split</p>
                    </div>
                    <div className="h-[280px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.departments}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={75}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    cornerRadius={4}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data?.departments?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</p>
                            <p className="text-2xl font-semibold tracking-tight">₹{(totalRevenue/1000).toFixed(0)}k</p>
                        </div>
                    </div>
                    <div className="w-full mt-8 space-y-3">
                        {data?.departments?.map((dept: any, i: number) => (
                            <div key={dept.name} className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-2 w-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                                    <span className="text-[11px] font-medium text-muted-foreground">{dept.name}</span>
                                </div>
                                <span className="text-xs font-semibold tracking-tight">₹{dept.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* 3. Source Strategy (Conversion Funnel) */}
                <Card className="lg:col-span-7 bg-card border-border/50 rounded-2xl p-8">
                    <div className="flex items-center justify-between mb-10">
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold tracking-tight">Conversion Efficiency</h3>
                            <p className="text-xs text-muted-foreground">Yield analysis per acquisition source</p>
                        </div>
                        <Badge variant="secondary" className="bg-muted text-muted-foreground font-medium px-3 h-8 rounded-lg border-none">
                            Omnichannel
                        </Badge>
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
                                    tick={{fontSize: 10, fontWeight: 500, fill: 'hsl(var(--muted-foreground))'}} 
                                    width={100}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--muted))', opacity: 0.1, radius: 10}} />
                                <Bar dataKey="raw" fill="hsl(var(--muted))" radius={[0, 6, 6, 0]} name="Raw Volume" barSize={12} />
                                <Bar dataKey="won" fill="#4F46E5" radius={[0, 6, 6, 0]} name="Conversion" barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* 4. Revenue Leak Details */}
                <Card className="lg:col-span-5 bg-card border-border/50 rounded-2xl p-8 bg-indigo-50/50 dark:bg-indigo-950/20">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold tracking-tight">Untracked Revenue</h3>
                                <p className="text-xs text-muted-foreground">{data?.leaks?.totalCount} HOT leads pending invoice</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        {data?.leaks?.leads?.map((lead: any) => (
                            <div key={lead.id} className="p-4 rounded-xl bg-background border border-border/60 flex items-center justify-between group hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer">
                                <div>
                                    <p className="text-[13px] font-semibold tracking-tight transition-colors">{lead.name}</p>
                                    <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{lead.phone}</p>
                                </div>
                                <div className="text-right">
                                    <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-200/50 dark:border-indigo-800/50 font-semibold text-[10px] px-2 h-6">HOT {lead.aiScore}%</Badge>
                                    <p className="text-[9px] font-medium text-muted-foreground mt-1.5 uppercase tracking-wider">{new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        ))}
                        {data?.leaks?.totalCount > 5 && (
                            <Button variant="ghost" className="w-full text-indigo-500 hover:text-indigo-600 hover:bg-indigo-100/50 font-semibold text-[11px] tracking-tight mt-2">
                                Inspect All Leaks <ChevronDown className="h-3 w-3 ml-2" />
                            </Button>
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
