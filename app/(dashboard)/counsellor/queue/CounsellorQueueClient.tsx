"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter 
} from "@/components/ui/sheet";
import { 
  Users, 
  Clock, 
  UserCircle, 
  ChevronRight, 
  Stethoscope,
  ClipboardList,
  UserPlus
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { submitConsultationAction } from "./actions";
import { cn } from "@/lib/utils";

interface QueuedPatient {
  id: string;
  name: string;
  updatedAt: Date | string;
  owner?: { name: string | null } | null;
  category: string;
}

export function CounsellorQueueClient({ leads }: { leads: QueuedPatient[] }) {
  const [selectedPatient, setSelectedPatient] = useState<QueuedPatient | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartConsultation = (patient: QueuedPatient) => {
    setSelectedPatient(patient);
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!selectedPatient) return;
    if (!notes.trim()) {
      toast.error("Clinical Requirement", { description: "Please enter consultation remarks before closing the node." });
      return;
    }

    setIsSubmitting(true);
    const result = await submitConsultationAction(selectedPatient.id, notes);
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Consultation Complete", { description: `Patient ${selectedPatient.name} has been moved to Billing check-out.` });
      setSelectedPatient(null);
    } else {
      toast.error("Operation Failed", { description: result.error });
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">OPD Live Matrix</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tighter lowercase">/counsellor.queue</h1>
          <p className="text-sm text-zinc-500 font-medium">Real-time patient triage for arriving signals.</p>
        </div>
        <Badge variant="outline" className="h-10 px-6 rounded-full border-zinc-200/50 bg-white shadow-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-400" />
            <span className="text-xs font-bold text-zinc-600 uppercase tracking-tighter">{leads.length} Patients Waiting</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leads.length > 0 ? (
          leads.map((patient, index) => (
            <Card key={patient.id} className="group relative overflow-hidden border-none bg-white dark:bg-zinc-900/50 ai-glass rounded-[40px] shadow-sm ring-1 ring-zinc-200/50 dark:ring-white/5 hover:shadow-xl transition-all duration-500">
              <div className="absolute top-0 right-0 p-8">
                <span className="text-[40px] font-bold text-zinc-100/50 dark:text-white/5 select-none">#{index + 1}</span>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-3xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100/50 dark:border-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                    <UserCircle className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white truncate">{patient.name}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-zinc-400">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px] font-bold uppercase tracking-tight">Waiting since {formatDistanceToNow(new Date(patient.updatedAt))}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Sourced By</span>
                        <div className="flex items-center gap-2">
                            <Badge variant="ghost" className="px-0 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 truncate">
                                {patient.owner?.name || "Global Entry"}
                            </Badge>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Speciality</span>
                        <Badge variant="outline" className="text-[10px] bg-zinc-50 border-zinc-200/50 font-bold tracking-tighter uppercase rounded-lg">
                            {patient.category.toLowerCase()}
                        </Badge>
                    </div>
                </div>

                <Button 
                  onClick={() => handleStartConsultation(patient)}
                  className="w-full h-14 rounded-3xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-bold uppercase tracking-[0.2em] group transition-all duration-300"
                >
                  Start Consultation
                  <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-6 text-center border-2 border-dashed border-zinc-100 rounded-[60px] dark:border-white/5 bg-zinc-50/30">
            <div className="h-20 w-20 rounded-[40px] bg-white shadow-xl flex items-center justify-center ring-1 ring-zinc-200/50">
              <ClipboardList className="h-10 w-10 text-zinc-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white lowercase">/queue.empty</h3>
              <p className="text-sm text-zinc-400 font-medium">All clinical signals for the current node are processed.</p>
            </div>
          </div>
        )}
      </div>

      <Sheet open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl border-none p-0 bg-white dark:bg-zinc-950 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="h-44 bg-zinc-900 relative p-10 flex flex-col justify-end">
              <div className="absolute top-10 right-10 opacity-10">
                <Stethoscope className="h-24 w-24 text-white" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.3em]">Consultation Live</span>
                </div>
                <h2 className="text-4xl font-bold tracking-tighter text-white">{selectedPatient?.name}</h2>
              </div>
            </div>

            <div className="p-10 space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center border border-zinc-100 dark:border-white/10">
                    <ClipboardList className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Clinical Assessment</h3>
                    <p className="text-xs text-zinc-400 font-medium tracking-tight">Log prescription and diagnostic remarks.</p>
                  </div>
                </div>

                <Textarea 
                  placeholder="Enter medical observations, treatment plan, or prescription notes here..."
                  className="min-h-[300px] rounded-[30px] border-none bg-zinc-50 dark:bg-white/5 p-8 text-sm font-medium focus-visible:ring-blue-500/20 transition-all placeholder:text-zinc-300"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="p-8 rounded-[40px] bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100/50 dark:border-blue-500/10 space-y-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Next State Handover</span>
                </div>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed">Submitting this assessment will move the patient to the **Billing Check-Out Queue** automatically. Ensure all procedural billing nodes are documented in the notes.</p>
              </div>
            </div>
          </div>

          <div className="p-10 bg-zinc-50/50 dark:bg-white/5 border-t border-zinc-100 dark:border-white/5">
            <Button 
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="w-full h-16 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20"
            >
              {isSubmitting ? "Matrix Syncing..." : "Mark as CONSULTED"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
