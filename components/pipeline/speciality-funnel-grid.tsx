"use client";

import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, Users, Target, Activity, Award } from "lucide-react";

interface FunnelData {
  total: number;
  qualified: number;
  visited: number;
  won: number;
}

const SPECIALITIES = [
  { key: "INFERTILITY", label: "IVF / Infertility", color: "indigo" },
  { key: "MATERNITY",   label: "MDT / Maternity",   color: "rose" },
  { key: "GYNECOLOGY",  label: "GYN / Gynecology",  color: "emerald" },
  { key: "PEDIATRICS",  label: "PEDI / Pediatrics", color: "amber" },
];

export function SpecialityFunnelGrid({ leads }: { leads: any[] }) {
  const stats = useMemo(() => {
    return SPECIALITIES.reduce((acc, spec) => {
      const specLeads = leads.filter(l => l.category === spec.key);
      acc[spec.key] = {
        total: specLeads.length,
        qualified: specLeads.filter(l => ['QUALIFIED', 'CONTACTED', 'APPOINTMENT_FIXED', 'VISITED', 'WON'].includes(l.status)).length,
        visited: specLeads.filter(l => ['VISITED', 'WON'].includes(l.status)).length,
        won: specLeads.filter(l => l.status === 'WON').length,
      };
      return acc;
    }, {} as Record<string, FunnelData>);
  }, [leads]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {SPECIALITIES.map((spec) => (
        <FunnelCard 
          key={spec.key} 
          label={spec.label} 
          data={stats[spec.key]} 
          color={spec.color as any} 
        />
      ))}
    </div>
  );
}

function FunnelCard({ label, data, color }: { label: string, data: FunnelData, color: 'indigo' | 'rose' | 'emerald' | 'amber' }) {
  const colors = {
    indigo:  "from-indigo-500/20 to-indigo-500/5 border-indigo-500/20 text-indigo-600",
    rose:    "from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-600",
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-600",
    amber:   "from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-600",
  };

  const bgColors = {
    indigo:  "bg-indigo-500",
    rose:    "bg-rose-500",
    emerald: "bg-emerald-500",
    amber:   "bg-amber-500",
  };

  const convRate = data.total > 0 ? ((data.won / data.total) * 100).toFixed(1) : "0.0";

  return (
    <Card className={cn("relative overflow-hidden border p-6 rounded-[2.5rem] bg-gradient-to-br transition-all hover:shadow-xl", colors[color])}>
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 group-hover:text-primary transition-colors">{label}</h4>
            <div className={cn("px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter bg-white/50 border border-current")}>
                {convRate}% Conv.
            </div>
        </div>

        <div className="space-y-3 flex-1">
          {/* Funnel Steps */}
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
        <div className="space-y-1.5 opacity-90 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <span className="text-slate-500">{icon}</span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{label}</span>
                </div>
                <span className="text-[10px] font-black text-slate-900">{count}</span>
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
