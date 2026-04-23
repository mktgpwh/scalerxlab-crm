"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Users, 
  MapPin, 
  Clock, 
  UserCheck, 
  ArrowRight, 
  Calendar,
  CheckCircle2,
  Inbox,
  Sparkles,
  Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ScheduledLead {
  id: string;
  name: string;
  appointmentDate: string;
  appointmentCenter: string;
  assignedCounselor: string;
  status: string;
}

export default function ReceptionTodayPage() {
  const [leads, setLeads] = useState<ScheduledLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  // Initialize mock data for speed/preview, then we can fetch real
  useEffect(() => {
    // In a real app, this would be a fetch to /api/reception/scheduled
    const mockLeads: ScheduledLead[] = [
      {
        id: "1",
        name: "Ananya Sharma",
        appointmentDate: new Date().toISOString(),
        appointmentCenter: "Pahlajani's Raipur (Main)",
        assignedCounselor: "Rahul V.",
        status: "APPOINTMENT_SCHEDULED"
      },
      {
        id: "2",
        name: "Vikram Malhotra",
        appointmentDate: new Date(Date.now() + 3600000).toISOString(),
        appointmentCenter: "Pahlajani's Bhilai",
        assignedCounselor: "Priya S.",
        status: "APPOINTMENT_SCHEDULED"
      },
      {
        id: "3",
        name: "Sneha Reddy",
        appointmentDate: new Date(Date.now() + 7200000).toISOString(),
        appointmentCenter: "Pahlajani's Bilaspur",
        assignedCounselor: "Amit K.",
        status: "APPOINTMENT_SCHEDULED"
      }
    ];

    setTimeout(() => {
      setLeads(mockLeads);
      setIsLoading(false);
    }, 800);
  }, []);

  const handleCheckIn = async (leadId: string) => {
    setCheckingIn(leadId);
    
    // Optimistic UI update
    const leadToCheckIn = leads.find(l => l.id === leadId);
    
    try {
      const response = await fetch(`/api/reception/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId })
      });

      if (!response.ok) throw new Error("Check-in failed");

      toast.success(`Check-In Successful`, {
        description: `${leadToCheckIn?.name} has been transitioned to visited status.`,
      });

      // Remove from expected list with animation
      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (error) {
      toast.error("Process Aborted", {
        description: "Communication handshake with the attribution engine failed.",
      });
    } finally {
      setCheckingIn(null);
    }
  };

  return (
    <div className="p-8 space-y-8 min-h-screen bg-[#fafafa] dark:bg-[#03060b]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
             <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Live Reception Node</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Patient Arrival Control</h1>
          <p className="text-sm text-zinc-500 font-medium tracking-tight">Managing expected patient flows for today, {format(new Date(), "MMMM do, yyyy")}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
             <input 
                type="text" 
                placeholder="Find patient..." 
                className="pl-10 pr-4 h-11 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
             />
          </div>
          <div className="h-11 w-11 flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
             <Calendar className="h-5 w-5 text-zinc-600" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[240px] rounded-3xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : leads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads.map((lead) => (
            <Card 
              key={lead.id} 
              className={cn(
                "group relative border-none bg-white dark:bg-zinc-900/50 ai-glass rounded-[px] shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden ring-1 ring-zinc-200/50 dark:ring-white/5",
                checkingIn === lead.id && "scale-95 opacity-50 grayscale"
              )}
            >
              {/* Status Indicator */}
              <div className="absolute top-0 right-0 p-4">
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full">
                    <Clock className="h-3 w-3" />
                    <span className="text-[9px] font-black uppercase">{format(new Date(lead.appointmentDate), "H:mm")}</span>
                 </div>
              </div>

              <CardHeader className="p-6 pb-2">
                <div className="flex items-center gap-3 mb-2">
                   <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                      <Users className="h-6 w-6" />
                   </div>
                   <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Expected Patient</p>
                      <CardTitle className="text-xl font-black text-zinc-900 dark:text-white leading-tight">{lead.name}</CardTitle>
                   </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                         <MapPin className="h-3 w-3 text-indigo-500" />
                         Point of Care
                      </div>
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{lead.appointmentCenter.split(' ')[1] || 'Raipur'}</p>
                   </div>
                   <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                         <Sparkles className="h-3 w-3 text-emerald-500" />
                         Source Rep
                      </div>
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{lead.assignedCounselor}</p>
                   </div>
                </div>
              </CardContent>

              <CardFooter className="p-0">
                <Button 
                  onClick={() => handleCheckIn(lead.id)}
                  disabled={checkingIn !== null}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none border-t border-emerald-500/20 font-black text-xs uppercase tracking-[0.1em] gap-2 transition-all group-hover:h-16 group-active:scale-95"
                >
                  {checkingIn === lead.id ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" />
                      Mark Arrived / Check-In
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="h-[60vh] w-full flex items-center justify-center">
           <div className="text-center space-y-6 max-w-md mx-auto group">
              <div className="relative h-32 w-32 mx-auto">
                 <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                 <div className="relative h-full w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full flex items-center justify-center shadow-2xl transition-transform group-hover:rotate-12">
                    <Inbox className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                 </div>
              </div>
              <div className="space-y-2">
                 <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Sovereignty Synchronized</h2>
                 <p className="text-zinc-500 dark:text-zinc-400 font-medium">All expected patients for this window have been successfully processed or the queue is currently synchronized.</p>
              </div>
              <Button variant="outline" onClick={() => window.location.reload()} className="rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold px-8">REFRESH CONSOLE</Button>
           </div>
        </div>
      )}
    </div>
  );
}
