"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, User, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AppointmentSchedulerProps {
  leadId: string;
  currentStatus: string;
}

const centers = [
  "Pahlajani's Raipur (Main)",
  "Pahlajani's Bhilai",
  "Pahlajani's Bilaspur",
];

export function AppointmentScheduler({ leadId, currentStatus }: AppointmentSchedulerProps) {
  const [date, setDate] = useState<Date>();
  const [center, setCenter] = useState<string>("");
  const [counselor, setCounselor] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSchedule = async () => {
    if (!date || !center) {
      toast.error("Protocol Incomplete", {
        description: "Please select both a date and a target center for the appointment.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentDate: date,
          appointmentCenter: center,
          assignedCounselor: counselor,
          status: "APPOINTMENT_SCHEDULED",
        }),
      });

      if (!response.ok) throw new Error("Scheduling Engine Failure");

      toast.success("Appointment Synchronized", {
        description: `Patient scheduled for ${format(date, "PPP")} at ${center}.`,
      });
      router.refresh();
    } catch (error) {
      toast.error("Transmission Error", {
        description: "The scheduling request could not be committed to the ledger.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="surface-layered border-none rounded-2xl shadow-xl ring-1 ring-slate-200/50 dark:ring-white/10 overflow-hidden group">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-indigo-500" />
            <CardTitle className="text-[10px] font-semibold tracking-tight uppercase tracking-widest text-slate-400">
              Appointment Scheduler
            </CardTitle>
          </div>
          {currentStatus === "APPOINTMENT_SCHEDULED" && (
             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                <span className="text-[8px] font-bold uppercase">Scheduled</span>
             </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <span className="text-[9px] font-semibold text-slate-400 uppercase ml-1">Arrival Window</span>
            <Popover>
              <PopoverTrigger>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal border-slate-200/60 dark:border-white/5 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black transition-all",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl overflow-hidden" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="bg-white dark:bg-zinc-950"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <span className="text-[9px] font-semibold text-slate-400 uppercase ml-1">Transit Center</span>
            <Select onValueChange={(val) => setCenter(val || "")} value={center}>
              <SelectTrigger className="border-slate-200/60 dark:border-white/5 bg-white/50 dark:bg-black/20">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 opacity-50 text-indigo-500" />
                  <SelectValue placeholder="Select Center" />
                </div>
              </SelectTrigger>
              <SelectContent className="border-none shadow-2xl rounded-xl">
                {centers.map((c) => (
                  <SelectItem key={c} value={c} className="focus:bg-indigo-50 text-xs">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <span className="text-[9px] font-semibold text-slate-400 uppercase ml-1">Assigned Counselor</span>
            <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-50 text-indigo-500" />
                <input 
                  type="text" 
                  placeholder="Counselor Name" 
                  value={counselor}
                  onChange={(e) => setCounselor(e.target.value)}
                  className="w-full text-xs h-9 pl-9 pr-4 rounded-md border border-slate-200/60 dark:border-white/5 bg-white/50 dark:bg-black/20 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSchedule} 
          disabled={isSubmitting || !date || !center}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 shadow-lg shadow-indigo-500/20 transition-all font-bold text-xs group"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>COMMITTING...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>INITIALIZE APPOINTMENT</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
