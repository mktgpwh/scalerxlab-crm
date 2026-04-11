"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp,
  History,
  Activity,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";

export default function CallManagementPage() {
  const [isAiRouting, setIsAiRouting] = useState(false);
  const [liveCalls, setLiveCalls] = useState(0);
  const [stats, setStats] = useState({
    qualified: 0,
    missed: 0,
    inbound: 0,
    outbound: 0,
  });
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // 1. Initial Data Load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch Settings
        const settingsRes = await fetch(`/api/telephony/settings`);
        const settingsData = await settingsRes.json();
        if (settingsData && !settingsData.error) {
            setIsAiRouting(settingsData.aiRoutingEnabled);
        }

        // Fetch Stats
        const statsRes = await fetch(`/api/telephony/stats`);
        const statsData = await statsRes.json();
        if (statsData && !statsData.error) {
            setStats(statsData);
        }

        // Fetch Logs
        const logsRes = await fetch(`/api/telephony/logs`);
        const logsData = await logsRes.json();
        if (logsData && !logsData.error) {
            setRecords(logsData);
        }
      } catch (err) {
        console.error("Failed to load call hub data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. Real-time Subscriptions
  useEffect(() => {
    // Listen for CALL_INCOMING broadcasts to increment live counter and stats
    const channel = supabase
      .channel('global_notifications')
      .on(
        'broadcast',
        { event: 'CALL_INCOMING' },
        (payload) => {
          setLiveCalls(prev => prev + 1);
          setStats(prev => ({ ...prev, inbound: prev.inbound + 1 }));
          
          // Decrement live calls after a simulated "session" duration
          setTimeout(() => setLiveCalls(prev => Math.max(0, prev - 1)), 30000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const toggleAiRouting = async (checked: boolean) => {
    setIsAiRouting(checked);
    try {
        const res = await fetch(`/api/telephony/settings`, {
            method: "POST",
            body: JSON.stringify({ aiRoutingEnabled: checked })
        });
        if (res.ok) {
            toast.success(checked ? "AI Routing Activated" : "Human Routing Enabled", {
                description: checked 
                  ? "All inbound calls are now handled by AgentX Intelligent Voice." 
                  : "Calls are being routed to Pahlajani's medical front-desk.",
                icon: checked ? <Sparkles className="w-4 h-4 text-emerald-500" /> : <Activity className="w-4 h-4 text-primary" />
            });
        }
    } catch (err) {
        setIsAiRouting(!checked);
        toast.error("Failed to update routing configuration");
    }
  };

  return (
    <div className="flex flex-col gap-8 p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50 dark:bg-slate-950/20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2">
        <div className="flex items-center gap-6">
           <div className="h-10 w-auto">
              <Image src="/scalerxlab-logo.png" alt="ScalerX" width={140} height={35} className="object-contain" />
           </div>
           <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden md:block" />
           <div className="space-y-1">
              <div className="flex items-center gap-3">
                 <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white lowercase italic">
                   /telephony.hub
                 </h1>
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest pl-1">
                 Managing टाटा स्मार्टफ्लो for <span className="text-slate-900 dark:text-slate-300">Pahlajani's Hub</span>
              </p>
           </div>
        </div>

        {/* AI Toggle Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl ring-1 ring-slate-200 dark:ring-white/5 shadow-2xl shadow-primary/5 flex items-center gap-6 min-w-[320px]">
           <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Voice Routing</span>
              <span className="text-sm font-black text-slate-900 dark:text-white leading-none">
                {isAiRouting ? "AI Orchestrator" : "Human Front-Desk"}
              </span>
           </div>
           <div className="flex-1" />
           <div className="flex items-center gap-3">
              <AnimatePresence mode="wait">
                 {isAiRouting ? (
                   <motion.div 
                     key="ai"
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                     className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                   />
                 ) : (
                   <motion.div 
                     key="human"
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                     className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                   />
                 )}
              </AnimatePresence>
              <Switch checked={isAiRouting} onCheckedChange={toggleAiRouting} className="data-[state=checked]:bg-emerald-500" />
           </div>
        </div>
      </div>

      {/* Stats Command Center */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {/* Live Calls */}
         <Card className="rounded-[2.5rem] border-none shadow-sm dark:bg-slate-900/50 hover:shadow-2xl transition-all duration-500 ring-1 ring-slate-100 dark:ring-white/5 overflow-hidden group">
            <CardContent className="p-7 relative">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Activity className="w-24 h-24 text-primary" />
               </div>
               <div className="space-y-4">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl w-fit">
                     <Zap className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
                        {liveCalls}
                     </h3>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Active Calls</p>
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* Qualified Inbound */}
         <Card className="rounded-[2.5rem] border-none shadow-sm dark:bg-slate-900/50 hover:shadow-2xl transition-all duration-500 ring-1 ring-slate-100 dark:ring-white/5 overflow-hidden group">
            <CardContent className="p-7 relative">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <CheckCircle2 className="w-24 h-24 text-primary" />
               </div>
               <div className="space-y-4">
                  <div className="p-3 bg-primary/10 rounded-2xl w-fit">
                     <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
                        {stats.qualified}
                     </h3>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Qualified Leads (24h)</p>
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* Missed Calls */}
         <Card className="rounded-[2.5rem] border-none shadow-sm dark:bg-slate-900/50 hover:shadow-2xl transition-all duration-500 ring-1 ring-slate-100 dark:ring-white/5 overflow-hidden group">
            <CardContent className="p-7 relative">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <PhoneMissed className="w-24 h-24 text-rose-500" />
               </div>
               <div className="space-y-4">
                  <div className="p-3 bg-rose-500/10 rounded-2xl w-fit">
                     <PhoneMissed className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
                        {stats.missed}
                     </h3>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Missed Today</p>
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* Total Volume */}
         <Card className="rounded-[2.5rem] border-none shadow-sm dark:bg-slate-900/50 hover:shadow-2xl transition-all duration-500 ring-1 ring-slate-100 dark:ring-white/5 overflow-hidden group">
            <CardContent className="p-7">
               <div className="space-y-6">
                  <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl w-fit">
                     <History className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.inbound}</span>
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Inbound</p>
                     </div>
                     <div className="space-y-1 border-l border-slate-100 dark:border-white/5 pl-4">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.outbound}</span>
                        <p className="text-[9px] font-black uppercase tracking-widest text-primary">Outbound</p>
                     </div>
                  </div>
               </div>
            </CardContent>
         </Card>
      </div>

      {/* Call Registry Section */}
      <Tabs defaultValue="all" className="w-full">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <TabsList className="bg-white dark:bg-white/5 p-1.5 rounded-2xl h-12 ring-1 ring-slate-200 dark:ring-white/10 shadow-sm">
                <TabsTrigger value="all" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">All Registry</TabsTrigger>
                <TabsTrigger value="missed" className="rounded-xl px-6 font-bold data-[state=active]:bg-rose-500 data-[state=active]:text-white">Dropped</TabsTrigger>
                <TabsTrigger value="ai" className="rounded-xl px-6 font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-white inline-flex gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Handled
                </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
                <Button variant="outline" className="rounded-2xl border-slate-200 dark:border-white/10 font-black uppercase text-[10px] h-11 px-6 tracking-widest">
                    Export DVR
                </Button>
                <Button className="rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[10px] h-11 px-6 tracking-widest shadow-xl">
                    Refresh Feed
                </Button>
            </div>
         </div>

         <TabsContent value="all" className="mt-0">
            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-100 dark:ring-white/5 overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full">
                     <thead>
                        <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                           <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Direction</th>
                           <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Caller Node</th>
                           <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Duration</th>
                           <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Handler</th>
                           <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                           <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Recording</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                        {loading ? (
                           <tr>
                              <td colSpan={6} className="px-8 py-20 text-center">
                                 <Activity className="w-8 h-8 text-primary animate-spin mx-auto opacity-20" />
                              </td>
                           </tr>
                        ) : (records.length === 0 || !records) ? (
                            <tr>
                               <td colSpan={6} className="px-8 py-24 text-center">
                                  <div className="flex flex-col items-center justify-center opacity-20 grayscale scale-75">
                                      <Image src="/scalerxlab-logo.png" alt="ScalerX" width={120} height={30} className="object-contain mb-4" />
                                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                                         Awaiting Voice Signals...
                                      </p>
                                  </div>
                               </td>
                            </tr>
                        ) : records.map((log) => (
                           <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                <td className="px-8 py-5">
                                    {log.direction === "INBOUND" ? (
                                        <div className="flex items-center gap-2 text-emerald-500">
                                            <PhoneIncoming className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase">Inbound</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-primary">
                                            <PhoneOutgoing className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase">Outbound</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                                            {log.lead?.name || "Anonymous Caller"}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 leading-none mt-1">
                                            +91 {log.callerId}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 font-mono text-xs text-slate-500">
                                    {Math.floor(log.duration / 60)}m {log.duration % 60}s
                                </td>
                                <td className="px-8 py-5">
                                    {log.isAiHandled ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none inline-flex gap-1.5 items-center px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                                            <Sparkles className="w-2.5 h-2.5" />
                                            AgentX Voice
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-slate-100 dark:bg-white/10 text-slate-500 border-none inline-flex gap-1.5 items-center px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                                            <Activity className="w-2.5 h-2.5" />
                                            Medical Agent
                                        </Badge>
                                    )}
                                </td>
                                <td className="px-8 py-5">
                                    {log.isQualified ? (
                                        <div className="flex items-center gap-1.5 text-emerald-500">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase">Qualified</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Activity className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase">In Review</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <Button variant="ghost" size="sm" className="h-8 rounded-lg text-primary font-black uppercase text-[10px] hover:bg-primary/10">
                                        Play DVR
                                    </Button>
                                </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </Card>
         </TabsContent>
      </Tabs>
    </div>
  );
}
