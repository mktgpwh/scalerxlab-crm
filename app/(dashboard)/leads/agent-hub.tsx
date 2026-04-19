"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  Activity, 
  Users, 
  Phone, 
  Sparkles, 
  ChevronRight, 
  AlertTriangle,
  Plus,
  History,
  TrendingUp,
  Inbox
} from "lucide-react";
import { SpecialityFunnelGrid } from "@/components/pipeline/speciality-funnel-grid";
import { GeographyFunnelGrid } from "@/components/pipeline/geography-funnel-grid";
import { LeadsDataView } from "@/components/leads/leads-data-view";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AgentHubProps {
  initialLeads: any[];
  currentUserId: string;
  branches: any[];
  userRole: string;
}

import { NewLeadDialog } from "@/components/leads/new-lead-dialog";

export function AgentHub({ initialLeads, currentUserId, branches, userRole }: AgentHubProps) {
  const [isAddLeadOpen, setIsAddLeadOpen] = React.useState(false);
  
  // 1. Filter Leads strictly for this agent
  const myLeads = useMemo(() => initialLeads.filter(l => l.ownerId === currentUserId), [initialLeads, currentUserId]);
  
  // 2. High Intensity Sentinel (Escalated or High AI Score)
  const priorityLeads = useMemo(() => {
    return myLeads.filter(l => l.isEscalated || (l.aiScore && l.aiScore > 80))
      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
      .slice(0, 3);
  }, [myLeads]);

  // 3. Daily Stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const leadsToday = myLeads.filter(l => new Date(l.createdAt) >= today).length;
    const wonToday = myLeads.filter(l => l.status === 'WON' && new Date(l.updatedAt) >= today).length;
    
    return { leadsToday, wonToday };
  }, [myLeads]);

  return (
    <div className="space-y-10">
      {/* Top Section: Performance & Sentinel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Daily Scorecard */}
        <Card className="lg:col-span-1 rounded-xl border-none shadow-sm ring-1 ring-slate-200/50 p-8 bg-gradient-to-br from-white to-slate-50/50 overflow-hidden relative group">
           <div className="absolute -right-10 -top-10 h-40 w-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
           <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-semibold tracking-tight text-primary uppercase tracking-[0.2em]">Live Performance</span>
                </div>
                <h2 className="text-3xl font-semibold tracking-tight  tracking-tighter">Daily Scorecard</h2>
                <p className="text-sm font-medium text-slate-500 mt-2 ">Operation status for your clinic node.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="p-5 rounded-xl bg-white ring-1 ring-slate-100 shadow-sm">
                    <p className="text-[10px] font-semibold tracking-tight uppercase text-slate-400 mb-1">Assigned Today</p>
                    <p className="text-3xl font-semibold tracking-tight tracking-tighter">{stats.leadsToday}</p>
                </div>
                <div className="p-5 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 shadow-sm">
                    <p className="text-[10px] font-semibold tracking-tight uppercase text-emerald-600 mb-1">Converted</p>
                    <p className="text-3xl font-semibold tracking-tight tracking-tighter text-emerald-700">{stats.wonToday}</p>
                </div>
              </div>

              <Button 
                onClick={() => {
                   if (priorityLeads.length > 0) {
                      toast.info("Mission Initiated", { 
                        description: `Intercepting high-intensity signal: ${priorityLeads[0].name}`,
                        icon: <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      });
                      // Implementation detail: would navigate to lead detail view
                   } else {
                      toast("Sectors Clear", { description: "No high-intensity signals requiring immediate intervention." });
                   }
                }}
                className="w-full h-14 rounded-xl bg-slate-900 hover:bg-black text-white text-[11px] font-semibold tracking-tight uppercase tracking-[0.2em] mt-6 shadow-xl group/btn transition-all"
              >
                Execute Mission Plan
                <ChevronRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
           </div>
        </Card>

        {/* High Intensity Sentinel */}
        <Card className="lg:col-span-2 rounded-xl border-none shadow-sm ring-1 ring-slate-200/50 p-8 bg-slate-900 text-white relative overflow-hidden">
           <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
           <div className="relative z-10">
              <div className="flex items-center gap-3">
                {userRole === "FIELD_SALES" && (
                  <Button 
                    onClick={() => setIsAddLeadOpen(true)}
                    className="h-10 px-6 rounded-xl bg-primary text-white text-[10px] font-semibold tracking-tight uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Capture Field Lead
                  </Button>
                )}
                <Badge className="bg-primary/20 text-primary border-none font-semibold tracking-tight text-[10px] px-3 py-1">
                   {priorityLeads.length} HOT TARGETS
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {priorityLeads.length > 0 ? priorityLeads.map((l: any) => (
                   <div key={l.id} className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                        <span className="text-[9px] font-semibold tracking-tight text-white/40 uppercase bg-white/5 px-2 py-0.5 rounded-full">Score {l.aiScore}%</span>
                      </div>
                      <p className="font-semibold text-sm text-white truncate mb-1">{l.name}</p>
                      <p className="text-[10px] text-white/60 font-medium truncate">{l.phone || l.whatsappNumber}</p>
                      <div className="mt-4 flex items-center justify-between text-white/40 group-hover:text-primary transition-colors">
                        <span className="text-[9px] font-semibold tracking-tight uppercase tracking-widest">Intercept</span>
                        <ChevronRight className="h-3 w-3" />
                      </div>
                   </div>
                 )) : (
                   <div className="col-span-3 py-10 flex flex-col items-center justify-center opacity-40">
                      <Inbox className="h-8 w-8 mb-3" />
                      <p className="text-[10px] font-semibold tracking-tight uppercase tracking-widest text-center">No high-intensity signals detected at this clinical node.</p>
                   </div>
                 )}
              </div>
           </div>
        </Card>
      </div>

      {/* Funnels Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-xl font-semibold tracking-tight  tracking-tight">Personal Conversion Matrix</h3>
        </div>
        <div className="grid grid-cols-1 gap-10">
            <section className="space-y-4">
                <p className="text-[10px] font-semibold tracking-tight uppercase tracking-[0.2em] text-slate-400 px-1">Speciality Funnel (Personal)</p>
                <SpecialityFunnelGrid leads={myLeads} />
            </section>
            
            <section className="space-y-4">
                <p className="text-[10px] font-semibold tracking-tight uppercase tracking-[0.2em] text-slate-400 px-1">Geography Perspective (Personal)</p>
                <GeographyFunnelGrid leads={myLeads} branches={branches} />
            </section>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h3 className="text-xl font-semibold tracking-tight  tracking-tight">Personal Portfolio</h3>
            </div>
        </div>
        <LeadsDataView 
            leads={myLeads} 
            userRole={userRole} 
            team={[]} 
            branches={branches} 
        />
      </div>

      <NewLeadDialog 
        open={isAddLeadOpen} 
        onOpenChange={setIsAddLeadOpen} 
        userRole={userRole}
        team={[]}
        branches={branches}
      />
    </div>
  );
}
