"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Users, Target, Activity, Award } from "lucide-react";

export interface FunnelData {
  total: number;
  qualified: number;
  visited: number;
  won: number;
}

export type FunnelColor = 'indigo' | 'rose' | 'emerald' | 'amber' | 'violet' | 'cyan' | 'fuchsia' | 'slate';

export function FunnelCard({ 
  label, 
  data, 
  color 
}: { 
  label: string; 
  data: FunnelData; 
  color: FunnelColor;
}) {
  const colors: Record<FunnelColor, string> = {
    indigo:  "from-indigo-500/20 to-indigo-500/5 border-indigo-500/20 text-indigo-600",
    rose:    "from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-600",
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-600",
    amber:   "from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-600",
    violet:  "from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-600",
    cyan:    "from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-600",
    fuchsia: "from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-500/20 text-fuchsia-600",
    slate:   "from-slate-500/20 to-slate-500/5 border-slate-500/20 text-slate-600",
  };

  const bgColors: Record<FunnelColor, string> = {
    indigo:  "bg-indigo-500",
    rose:    "bg-rose-500",
    emerald: "bg-emerald-500",
    amber:   "bg-amber-500",
    violet:  "bg-violet-500",
    cyan:    "bg-cyan-500",
    fuchsia: "bg-fuchsia-500",
    slate:   "bg-slate-500",
  };

  const convRate = data.total > 0 ? ((data.won / data.total) * 100).toFixed(1) : "0.0";

  return (
    <Card className={cn("relative overflow-hidden border p-6 rounded-[2.5rem] bg-gradient-to-br transition-all hover:shadow-xl", colors[color])}>
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 leading-tight">{label}</h4>
            <div className={cn("px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter bg-white/50 border border-current")}>
                {convRate}% Conv.
            </div>
        </div>

        <div className="space-y-3 flex-1">
          <Step label="Leads" count={data.total} percentage={100} colorClass={bgColors[color]} icon={<Users className="h-3 w-3" />} />
          <Step label="Qualified" count={data.qualified} percentage={data.total > 0 ? (data.qualified / data.total) * 100 : 0} colorClass={bgColors[color]} icon={<Target className="h-3 w-3" />} />
          <Step label="Visited" count={data.visited} percentage={data.total > 0 ? (data.visited / data.total) * 100 : 0} colorClass={bgColors[color]} icon={<Activity className="h-3 w-3" />} />
          <Step label="Enrolled" count={data.won} percentage={data.total > 0 ? (data.won / data.total) * 100 : 0} colorClass={bgColors[color]} icon={<Award className="h-3 w-3" />} />
        </div>
      </div>
    </Card>
  );
}

function Step({ label, count, percentage, colorClass, icon }: { label: string, count: number, percentage: number, colorClass: string, icon: React.ReactNode }) {
    return (
        <div className="space-y-1.5 opacity-90 hover:opacity-100 transition-opacity text-slate-900">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <span className="opacity-60">{icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-tight opacity-70">{label}</span>
                </div>
                <span className="text-[10px] font-black">{count}</span>
            </div>
            <div className="h-2 w-full bg-slate-100/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/20">
                <div 
                    className={cn("h-full transition-all duration-1000 ease-out shadow-sm", colorClass)}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
