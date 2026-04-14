"use client";

import React, { useMemo } from "react";
import { FunnelCard, FunnelData } from "./funnel-card";

const CITIES = [
  { key: "OVERALL", label: "Overall Business", color: "violet" },
  { key: "Raipur", label: "Raipur Node", color: "cyan" },
  { key: "Bhilai", label: "Bhilai Node", color: "fuchsia" },
  { key: "Bilaspur", label: "Bilaspur Node", color: "slate" },
] as const;

export function GeographyFunnelGrid({ leads }: { leads: any[] }) {
  const stats = useMemo(() => {
    return CITIES.reduce((acc, city) => {
      const cityLeads = city.key === "OVERALL" 
        ? leads 
        : leads.filter(l => l.branch?.city === city.key);

      acc[city.key] = {
        total: cityLeads.length,
        qualified: cityLeads.filter(l => ['QUALIFIED', 'CONTACTED', 'APPOINTMENT_FIXED', 'VISITED', 'WON'].includes(l.status)).length,
        visited: cityLeads.filter(l => ['VISITED', 'WON'].includes(l.status)).length,
        won: cityLeads.filter(l => l.status === 'WON').length,
      };
      return acc;
    }, {} as Record<string, FunnelData>);
  }, [leads]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {CITIES.map((city) => (
        <FunnelCard 
          key={city.key} 
          label={city.label} 
          data={stats[city.key]} 
          color={city.color} 
        />
      ))}
    </div>
  );
}
