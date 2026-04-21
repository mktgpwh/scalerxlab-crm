"use client";

import React, { useState } from "react";
import { 
    TrendingUp, 
    IndianRupee, 
    Clock, 
    FileText, 
    ArrowUpRight, 
    ChevronRight, 
    MessageSquare, 
    Calendar,
    Download,
    ShieldAlert
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
    Area, 
    AreaChart, 
    ResponsiveContainer, 
    Tooltip, 
    XAxis, 
    YAxis, 
    CartesianGrid,
    PieChart, 
    Pie, 
    Cell,
    Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// --- High Fidelity Mock Data ---

const TREND_DATA = [
    { name: "01 Apr", revenue: 42000 },
    { name: "04 Apr", revenue: 38000 },
    { name: "08 Apr", revenue: 52000 },
    { name: "12 Apr", revenue: 48000 },
    { name: "16 Apr", revenue: 61000 },
    { name: "20 Apr", revenue: 58000 },
    { name: "22 Apr", revenue: 72000 },
];

const COLLECTION_DATA = [
    { name: "Paid", value: 450, color: "#10b981" },
    { name: "Pending", value: 85, color: "#f59e0b" },
    { name: "Overdue", value: 15, color: "#ef4444" },
];

const RECENT_INVOICES = [
    { id: "INV-1045", patient: "Abhishek Singh", department: "OPD", amount: 1500, status: "PAID", date: "2026-04-22" },
    { id: "INV-1044", patient: "Rahul Verma", department: "LAB", amount: 3200, status: "PENDING", date: "2026-04-21" },
    { id: "INV-1043", patient: "Priyanka Das", department: "PHARMACY", amount: 850, status: "PAID", date: "2026-04-21" },
    { id: "INV-1042", patient: "Simran Kaur", department: "ULTRASOUND", amount: 2100, status: "OVERDUE", date: "2026-04-20" },
    { id: "INV-1041", patient: "Vikram Mehta", department: "IPD", amount: 15400, status: "PENDING", date: "2026-04-20" },
];

// --- Sub-Components ---

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-2xl ring-1 ring-white/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <IndianRupee className="h-3 w-3 text-indigo-400" />
                    {payload[0].value.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

export default function BillingReporting() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [invFilter, setInvFilter] = useState("ALL");

    useEffect(() => {
        if (status === "authenticated" && (session?.user as any)?.role !== "SUPER_ADMIN") {
            toast.error("Access Prohibited", {
                description: "This command node is restricted to Super Administrators."
            });
            router.push("/billing");
        }
    }, [session, status, router]);

    if (status === "loading") {
        return <div className="h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>;
    }

    if ((session?.user as any)?.role !== "SUPER_ADMIN") {
        return null;
    }

    const handleSendReminder = (id: string) => {
        toast.promise(new Promise(resolve => setTimeout(resolve, 1000)), {
            loading: "Transmitting WA Reminder Node...",
            success: "Payment reminder dispatched successfully.",
            error: "Bridge failure."
        });
    };

    return (
        <div className="space-y-10 pb-20 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-indigo-500" />
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] dark:text-indigo-400">Financial Command Center</span>
                    </div>
                    <h1 className="text-5xl font-semibold tracking-tight tracking-tighter text-slate-900 dark:text-white lowercase">
                        /revenue.intelligence
                    </h1>
                    <p className="text-sm font-medium text-slate-500 max-w-lg leading-relaxed">
                        Cross-departmental financial analytics and receivables management. Monitoring clinical intake velocity in real-time.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-10 px-4 rounded-xl text-[10px] uppercase font-bold tracking-widest border-slate-200 dark:border-white/10 transition-all cursor-pointer">
                        <Calendar className="h-3.5 w-3.5 mr-2" /> Last 30 Days
                    </Button>
                    <Button className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] uppercase font-bold tracking-widest shadow-lg shadow-indigo-600/20 transition-all cursor-pointer">
                        <Download className="h-3.5 w-3.5 mr-2" /> Export BI Report
                    </Button>
                </div>
            </div>

            {/* KPI Layer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="ai-glass border-none rounded-xl overflow-hidden shadow-sm hover:shadow-indigo-500/10 transition-all group">
                    <CardContent className="p-8">
                        <div className="flex items-start justify-between mb-6">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <IndianRupee className="h-6 w-6 text-indigo-600" />
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-2 py-1 rounded-lg text-[9px] font-black uppercase">
                                <TrendingUp className="h-2.5 w-2.5 mr-1" /> +12.5%
                            </Badge>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Total Revenue (MTD)</span>
                            <h3 className="text-3xl font-semibold tracking-tight tracking-tighter">₹4,22,850</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="ai-glass border-none rounded-xl overflow-hidden shadow-sm hover:shadow-indigo-500/10 transition-all group">
                    <CardContent className="p-8">
                        <div className="flex items-start justify-between mb-6">
                            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <Clock className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Outstanding Receivables</span>
                            <h3 className="text-3xl font-semibold tracking-tight tracking-tighter text-amber-600">₹86,400</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="ai-glass border-none rounded-xl overflow-hidden shadow-sm hover:shadow-indigo-500/10 transition-all group">
                    <CardContent className="p-8">
                        <div className="flex items-start justify-between mb-6">
                            <div className="h-12 w-12 rounded-2xl bg-slate-900/10 dark:bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <FileText className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Invoices Generated</span>
                            <h3 className="text-3xl font-semibold tracking-tight tracking-tighter">542</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Layer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Revenue Trend AreaChart */}
                <Card className="lg:col-span-8 surface-layered border-none rounded-2xl p-8 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/5 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-semibold tracking-tight ">Revenue Velocity</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Daily Ingress Trendline</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-full">
                            <TrendingUp className="h-3 w-3 text-indigo-600" />
                            <span className="text-[9px] font-bold uppercase text-indigo-700 dark:text-indigo-400">Peak Signal Active</span>
                        </div>
                    </div>
                    
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={TREND_DATA}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" opacity={0.1} />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 600 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#6366f1" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorRev)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Collection Distribution PieChart */}
                <Card className="lg:col-span-4 surface-layered border-none rounded-2xl p-8 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/5 flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold tracking-tight ">Collection Mix</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status Proportional Mapping</p>
                    </div>

                    <div className="flex-1 flex items-center justify-center min-h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={COLLECTION_DATA}
                                    innerRadius={65}
                                    outerRadius={85}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {COLLECTION_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#0f172a', 
                                        border: 'none', 
                                        borderRadius: '12px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        color: '#fff',
                                        padding: '10px'
                                    }} 
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    align="center"
                                    iconType="circle"
                                    formatter={(value) => <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-2">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-white/5 space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-slate-400">Target Efficiency</span>
                            <span className="text-indigo-600 font-black">92.4%</span>
                        </div>
                        <div className="h-1 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: '92.4%' }} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Receivables Engine Table */}
            <Card className="surface-layered border-none rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-200/50 dark:ring-white/5 overflow-hidden">
                <CardHeader className="p-8 border-b border-border/50 dark:border-white/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <CardTitle className="text-2xl font-semibold tracking-tight ">Recent Receivables</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1">Tactical Invoice Status Engine</CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 bg-slate-50 dark:bg-white/5 p-1 rounded-xl ring-1 ring-slate-200/50 dark:ring-white/10">
                                {["ALL", "PAID", "PENDING", "OVERDUE"].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setInvFilter(f)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all cursor-pointer",
                                            invFilter === f 
                                              ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" 
                                              : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-border/50 dark:border-white/5">
                                {["Invoice ID", "Patient Entity", "Department", "Valuation", "Status", "Timestamp", "Actions"].map(h => (
                                    <th key={h} className="px-8 py-5 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {RECENT_INVOICES
                                .filter(i => invFilter === "ALL" || i.status === invFilter)
                                .map(inv => (
                                <tr key={inv.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all">
                                    <td className="px-8 py-6">
                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-tighter">{inv.id}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-black text-slate-400">{inv.patient[0]}</div>
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{inv.patient}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest border-slate-200 dark:border-white/10 py-0.5">{inv.department}</Badge>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-sm font-bold tracking-tighter">₹{inv.amount.toLocaleString()}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <Badge className={cn(
                                            "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border-none",
                                            inv.status === "PAID" && "bg-emerald-500/10 text-emerald-600",
                                            inv.status === "PENDING" && "bg-amber-500/10 text-amber-600",
                                            inv.status === "OVERDUE" && "bg-rose-500/10 text-rose-600"
                                        )}>
                                            {inv.status}
                                        </Badge>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[10px] font-semibold text-slate-400">{inv.date}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            {(inv.status === "PENDING" || inv.status === "OVERDUE") && (
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 rounded-lg text-emerald-500 hover:text-white hover:bg-emerald-500 transition-all cursor-pointer"
                                                    onClick={() => handleSendReminder(inv.id)}
                                                >
                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost" className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer">
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-8 border-t border-border/50 dark:border-white/5 bg-slate-50/30 dark:bg-white/5">
                    <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 cursor-pointer">
                        View Full Financial Ledger <ArrowUpRight className="h-3 w-3 ml-2" />
                    </Button>
                </div>
            </Card>
        </div>
    );
}
