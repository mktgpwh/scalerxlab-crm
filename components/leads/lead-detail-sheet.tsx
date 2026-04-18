"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Loader2, 
  Sparkles, 
  History, 
  Zap, 
  ShieldAlert,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Activity,
  PenLine,
  Save,
  Lock
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Lead } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function LeadDetailSheet() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const leadId = searchParams.get("leadId");
  const tabParam = searchParams.get("tab") || "overview";
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [note, setNote] = useState<string>("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch lead data and user role
  useEffect(() => {
    async function getProfile() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
          const { data } = await supabase.from("users").select("role").eq("id", session.user.id).single();
          if (data) setUserRole(data.role);
      }
    }
    getProfile();

    if (leadId) {
      fetchLead(leadId);
    } else {
      setLead(null);
    }
  }, [leadId]);

  const fetchLead = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leads/${id}`);
      const data = await response.json();
      setLead(data);
      // Fetch activities too
      const actRes = await fetch(`/api/leads/${id}/activities`);
      const actData = await actRes.json();
      setActivities(actData);
      
      // Load draft if exists in metadata
      if (data.metadata?.latestDraft) {
          setDraft(data.metadata.latestDraft);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const closeSheet = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("leadId");
    params.delete("tab");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCall = async () => {
    if (!lead) return;
    if (!lead.consentFlag) {
        toast.error("CONSENT REQUIRED", { description: "DPDPA compliance prevents outreach to this record." });
        return;
    }

    try {
      const res = await fetch(`/api/telephony/tata/make-call`, {
        method: "POST",
        body: JSON.stringify({ leadId: lead.id })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Dialing...", { description: "Connecting via Tata Smartflo." });
        logEngagement("CALL");
      } else {
        toast.error(data.error || "Bridge failed");
      }
    } catch (err) {
      toast.error("Telephony server unreachable");
    }
  };

  const generateDraft = async () => {
    if (!lead) return;
    setIsDrafting(true);
    try {
      const response = await fetch("/api/ai/draft-reply", {
        method: "POST",
        body: JSON.stringify({
          leadName: lead.status === 'LOST' ? "[REDACTED]" : lead.name,
          intent: lead.intent,
          score: lead.aiScore,
          notes: lead.aiNotes
        }),
      });
      const data = await response.json();
      setDraft(data.reply);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDrafting(false);
    }
  };

  const logEngagement = async (type: string) => {
    if (!lead) return;
    try {
      await fetch(`/api/leads/${lead.id}/log`, {
        method: "POST",
        body: JSON.stringify({
          action: `ENGAGEMENT_${type}`,
          description: `User clicked ${type} engagement trigger`,
          metadata: { timestamp: new Date().toISOString() }
        })
      });
    } catch (e) {
      console.error("Failed to log engagement", e);
    }
  };

  const handleSendWhatsapp = async (text: string) => {
      if (!lead) return;
      const promise = fetch(`/api/leads/${lead.id}/whatsapp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
      }).then(async res => {
          if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || "WATI Dispatch Failed");
          }
          return res.json();
      });

      toast.promise(promise, {
          loading: "Transmitting via Native Node...",
          success: "Message securely dispatched via WATI",
          error: (err) => err.message
      });
  };

  if (!leadId) return null;

  const isArchived = lead?.status === 'LOST';
  const mask = (val: string | null | undefined) => {
    if (isArchived) return "[REDACTED]";
    if (!val) return "N/A";
    if (val.length <= 4) return val;
    return '*'.repeat(val.length - 4) + val.slice(-4);
  };

  return (
    <Sheet open={!!leadId} onOpenChange={(open) => !open && closeSheet()}>
      <SheetContent className="sm:max-w-xl h-full border-l border-slate-200/40 dark:border-white/5 bg-white/95 dark:bg-black/95 backdrop-blur-3xl p-0 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : lead ? (
          <>
            <div className="p-8 pb-4 space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-white/5 border-none ring-1 ring-slate-200/50 dark:ring-white/10">
                      ID-{lead.id.slice(-6).toUpperCase()}
                    </Badge>
                    {isArchived && (
                      <Badge className="bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase border-none ring-1 ring-rose-500/20">
                        <ShieldAlert className="h-3 w-3 mr-1" /> Archived
                      </Badge>
                    )}
                    {!lead.consentFlag && (
                      <Badge className="bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase border-none ring-1 ring-rose-500/20">
                        <Lock className="h-3 w-3 mr-1" /> Blocked
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">AI Confidence Index</span>
                     <div className="h-1.5 w-16 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000" 
                          style={{ width: `${lead.aiScore || 0}%` }}
                        />
                     </div>
                  </div>
               </div>

               <div className="space-y-1">
                  <h2 className="text-3xl font-black tracking-tighter italic lowercase underline decoration-primary/40 underline-offset-8">
                     {mask(lead.name)}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">
                     Source: {lead.source?.replace('_', ' ')} / {lead.isAutoAssigned ? "System Routing" : "Direct Assign"}
                  </p>
               </div>
            </div>

            <Tabs defaultValue={tabParam} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-8 border-b border-slate-100 dark:border-white/5">
                <TabsList className="bg-transparent h-14 p-0 gap-6">
                  <TabsTrigger 
                    value="overview" 
                    className="relative bg-transparent h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[10px] font-black uppercase tracking-[0.2em] px-0 transition-all cursor-pointer hover:text-primary/70"
                  >
                    /Overview
                  </TabsTrigger>
                  {userRole !== "COUNSELOR" && (
                    <TabsTrigger 
                      value="engagement" 
                      className="relative bg-transparent h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[10px] font-black uppercase tracking-[0.2em] px-0 transition-all cursor-pointer hover:text-primary/70"
                    >
                      /Engage
                    </TabsTrigger>
                  )}
                  <TabsTrigger 
                    value="timeline" 
                    className="relative bg-transparent h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[10px] font-black uppercase tracking-[0.2em] px-0 transition-all cursor-pointer hover:text-primary/70"
                  >
                    /Timeline
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notes" 
                    className="relative bg-transparent h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[10px] font-black uppercase tracking-[0.2em] px-0 transition-all cursor-pointer hover:text-primary/70"
                  >
                    /Notes
                  </TabsTrigger>
                </TabsList>
                {userRole === "COUNSELOR" && (
                   <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                      <Lock className="h-3 w-3 text-slate-400" />
                      <span className="text-[9px] font-black uppercase text-slate-400">Read-Only Matrix</span>
                   </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-8 lg:p-10 scrollbar-thin">
                <TabsContent value="overview" className="m-0 space-y-10 animate-in fade-in slide-in-from-bottom-4">
                  {/* Lead Sovereignty Card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Card className="surface-layered border-none rounded-[2rem] p-6 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10">
                        <div className="space-y-4">
                           <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-primary" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Communication Node</span>
                           </div>
                           <div className="space-y-2">
                              <div className="flex flex-col">
                                 <span className="text-[9px] font-bold text-slate-400 uppercase">Contact Stream</span>
                                 <span className="text-sm font-black tracking-tight">{mask(lead.phone || lead.whatsappNumber)}</span>
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[9px] font-bold text-slate-400 uppercase">Signal</span>
                                 <span className="text-sm font-black tracking-tight">{mask(lead.email)}</span>
                              </div>
                           </div>
                        </div>
                     </Card>
                     <Card className="bg-primary/5 border-none rounded-[2rem] p-6 ring-1 ring-primary/20">
                        <div className="space-y-4">
                           <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Intelligence Score</span>
                           </div>
                           <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-black italic tracking-tighter">{lead.aiScore || "0"}</span>
                              <span className="text-xs font-bold text-primary italic">%</span>
                           </div>
                           <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Calculated Intent</p>
                        </div>
                     </Card>
                  </div>

                  {/* Treatment Probability Chart (Exclusive to Pahlajani's) */}
                  <Card className="surface-layered border-none rounded-[2rem] p-6 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10 relative overflow-hidden">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                           <Activity className="h-4 w-4 text-emerald-500" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Category Conversion Matrix</span>
                        </div>
                     </div>
                     <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart 
                              data={[
                                 { name: 'IVF', probability: lead.category === 'INFERTILITY' ? 88 : 12, fill: lead.category === 'INFERTILITY' ? '#10b981' : '#f1f5f9' },
                                 { name: 'MDT', probability: lead.category === 'MATERNITY' ? 95 : 20, fill: lead.category === 'MATERNITY' ? '#6366f1' : '#f1f5f9' },
                                 { name: 'GYN', probability: lead.category === 'GYNECOLOGY' ? 70 : 15, fill: lead.category === 'GYNECOLOGY' ? '#ec4899' : '#f1f5f9' },
                              ]}
                              layout="vertical"
                              margin={{ top: 0, right: 30, left: -20, bottom: 0 }}
                           >
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                              <Bar dataKey="probability" radius={[0, 10, 10, 0]} barSize={20}>
                                 {
                                    [0, 1, 2].map((entry, index) => (
                                       <Cell key={`cell-${index}`} />
                                    ))
                                 }
                              </Bar>
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </Card>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Rationale</h4>
                       <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
                    </div>
                    <p className="text-sm font-medium leading-relaxed italic text-slate-600 dark:text-slate-400">
                      &quot;{lead.aiNotes || "Processing natural language signals for deeper context... Intelligence node pending."}&quot;
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="engagement" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  {/* High Intensity Actions */}
                  <div className="grid grid-cols-2 gap-4">
                     <Button 
                        variant="outline" 
                        className={cn(
                            "h-20 rounded-[1.5rem] border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900/50 transition-all shadow-sm group cursor-pointer hover:bg-blue-600 hover:text-white"
                        )}
                        onClick={handleCall}
                     >
                        <div className="flex flex-col items-center gap-1">
                           <Phone className="h-5 w-5 group-hover:scale-110 transition-transform" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Execute Call</span>
                        </div>
                     </Button>
                     <Button 
                        variant="outline" 
                        className={cn(
                            "h-20 rounded-[1.5rem] border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900/50 transition-all shadow-sm group cursor-pointer hover:bg-[#25D366] hover:text-white hover:border-[#25D366]"
                        )}
                        onClick={() => {
                           const txt = window.prompt("Enter message to send via WATI:");
                           if (txt) handleSendWhatsapp(txt);
                        }}
                     >
                        <div className="flex flex-col items-center gap-1">
                           <WhatsAppIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Engage on WA</span>
                        </div>
                     </Button>
                  </div>

                  <div className="space-y-6 pt-6">
                     <div className="flex items-center justify-between">
                        <div>
                           <h4 className="text-sm font-black italic tracking-tight">Smart Draft / Autonomous Reply</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Precision Response Node</p>
                        </div>
                        <Button 
                            size="sm" 
                            className="bg-emerald-500 hover:bg-emerald-600 rounded-full h-8 px-4 text-[10px] font-black uppercase tracking-widest"
                            onClick={generateDraft}
                            disabled={isDrafting || !lead.consentFlag}
                        >
                            {isDrafting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
                            {draft ? "Refine" : "Analyze & Draft"}
                        </Button>
                     </div>

                     <AnimatePresence mode="wait">
                        {draft ? (
                           <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-4"
                           >
                              <div className="p-6 rounded-[2rem] bg-emerald-500/5 ring-1 ring-emerald-500/10 text-sm font-medium leading-relaxed italic text-emerald-800 dark:text-emerald-300 relative">
                                 &quot;{draft}&quot;
                                 <div className="absolute top-4 right-6 uppercase text-[8px] font-black text-emerald-500/40 tracking-[0.3em]">Draft Node Active</div>
                              </div>
                              <Button 
                                 className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/10 text-xs font-black uppercase tracking-widest"
                                 disabled={!lead.consentFlag}
                                 onClick={() => handleSendWhatsapp(draft!)}
                              >
                                 <WhatsAppIcon className="h-4 w-4 mr-2" />
                                 Transmit via WhatsApp
                              </Button>
                           </motion.div>
                        ) : (
                           <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[3rem] bg-slate-50/50 dark:bg-white/5">
                              <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center mb-4">
                                 <WhatsAppIcon className="h-6 w-6 text-slate-300" />
                              </div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center max-w-[200px]">
                                 Connect AI to generate high-conversion engagement signals.
                              </p>
                           </div>
                        )}
                     </AnimatePresence>
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                   <div className="flex items-center gap-3 mb-8">
                      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                         <History className="h-6 w-6" />
                      </div>
                      <div>
                         <h4 className="text-sm font-black italic">Lead Journey Log</h4>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DPDPA Audit Trail</p>
                      </div>
                   </div>

                   <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100 dark:before:bg-white/5">
                      {activities.length > 0 ? activities.map((activity, idx) => (
                         <div key={activity.id} className="relative pl-10">
                            <div className="absolute left-0 top-1 h-9 w-9 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center z-10">
                               <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            </div>
                            <div className="space-y-1 pt-1">
                               <div className="flex items-center justify-between">
                                  <span className="text-xs font-black uppercase tracking-tight italic text-slate-900 dark:text-white">
                                     {activity.action.replace('_', ' ')}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400">
                                     {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                   {activity.description}
                                </p>
                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                                   {new Date(activity.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                         </div>
                      )) : (
                        <div className="py-20 text-center">
                           <History className="h-12 w-12 mx-auto text-slate-200 mb-4" />
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No signals recorded yet.</p>
                        </div>
                      )}
                   </div>
                </TabsContent>

                <TabsContent value="notes" className="m-0 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                         <PenLine className="h-5 w-5" />
                      </div>
                      <div>
                         <h4 className="text-sm font-black italic">Clinical Notes</h4>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agent Observations</p>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <Textarea
                         className="min-h-[200px] rounded-[1.5rem] bg-amber-50/50 dark:bg-amber-500/5 border-amber-200/50 dark:border-amber-500/10 ring-1 ring-amber-200/40 dark:ring-amber-500/10 text-sm font-medium text-slate-700 dark:text-slate-300 resize-none focus-visible:ring-amber-400/40 placeholder:text-slate-400 placeholder:text-xs placeholder:font-bold placeholder:uppercase placeholder:tracking-wide"
                         placeholder="Record clinical observations, patient concerns, follow-up triggers..."
                         value={note}
                         onChange={(e) => { setNote(e.target.value); setNoteSaved(false); }}
                      />
                      <Button
                         className={`w-full h-12 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                            noteSaved 
                               ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" 
                               : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                         } shadow-xl`}
                         onClick={() => {
                            if (note) { setNoteSaved(true); }
                         }}
                      >
                         {noteSaved 
                            ? <><Save className="h-4 w-4 mr-2" /> Annotation Persisted</>
                            : <><PenLine className="h-4 w-4 mr-2" /> Save Clinical Note</>
                         }
                      </Button>
                   </div>

                   <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 ring-1 ring-slate-200/50 dark:ring-white/5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Compliance Note</p>
                      <p className="text-[10px] font-medium text-slate-500">All clinical notes are encrypted at rest and governed by the DPDPA retention policy. Notes auto-expire after 180 days.</p>
                   </div>
                </TabsContent>
              </div>
            </Tabs>

            <div className="p-8 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Retention Sovereign</span>
                   </div>
                   <span className="text-[10px] font-black text-emerald-500 uppercase">DPDPA Active</span>
                </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
             <div className="h-20 w-20 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                <ShieldAlert className="h-10 w-10 text-rose-500" />
             </div>
             <h3 className="text-xl font-black italic tracking-tight">Signal Lost / Authorization Error</h3>
             <p className="text-xs font-medium text-slate-500 max-w-xs leading-relaxed uppercase tracking-tighter">
                Lead data could not be retrieved. Ensure the ID is valid and active within your sovereignty node.
             </p>
             <Button variant="outline" className="rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest" onClick={closeSheet}>
                Terminate Session
             </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
