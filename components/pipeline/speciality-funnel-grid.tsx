"use client";

import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, Users, Target, Activity, Award } from "lucide-react";

import { FunnelCard, FunnelData } from "./funnel-card";

const SPECIALITIES = [
  { key: "INFERTILITY", label: "IVF / Infertility", color: "indigo" },
  { key: "MATERNITY",   label: "MDT / Maternity",   color: "rose" },
  { key: "GYNECOLOGY",  label: "GYN / Gynecology",  color: "emerald" },
  { key: "PEDIATRICS",  label: "PEDI / Pediatrics", color: "amber" },
  { key: "OTHER",       label: "Unclassified / Raw", color: "slate" },
] as const;

export function SpecialityFunnelGrid({ leads }: { leads: any[] }) {
  const stats = useMemo(() => {
    return SPECIALITIES.reduce((acc, spec) => {
      const specLeads = leads.filter(l => (l.category === spec.key) || (spec.key === "OTHER" && !l.category));
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
      {SPECIALITIES.map((spec) => (
        <FunnelCard 
          key={spec.key} 
          label={spec.label} 
          data={stats[spec.key]} 
          color={spec.color} 
        />
      ))}
    </div>
  );
}
