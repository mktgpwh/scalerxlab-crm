"use client";

import React, { useMemo } from "react";
import { FunnelCard, FunnelData, FunnelColor } from "./funnel-card";
 
const COLORS: FunnelColor[] = ['violet', 'cyan', 'fuchsia', 'slate', 'rose', 'indigo', 'emerald', 'amber'];
 
export function GeographyFunnelGrid({ leads, branches }: { leads: any[], branches: any[] }) {
  const dynamicCities = useMemo(() => {
    const list: { key: string, label: string, color: FunnelColor }[] = [
      { key: "OVERALL", label: "Overall Business", color: "violet" }
    ];
    
    branches.forEach((branch, idx) => {
      list.push({
        key: branch.id,
        label: `${branch.name} Node`,
        color: COLORS[(idx + 1) % COLORS.length]
      });
    });

    return list;
  }, [branches]);

  const stats = useMemo(() => {
    return dynamicCities.reduce((acc, city) => {
      const cityLeads = city.key === "OVERALL" 
        ? leads 
        : leads.filter(l => l.branchId === city.key);

      acc[city.key] = {
        total: cityLeads.length,
        qualified: cityLeads.filter(l => ['QUALIFIED', 'CONTACTED', 'APPOINTMENT_FIXED', 'VISITED', 'WON'].includes(l.status)).length,
        visited: cityLeads.filter(l => ['VISITED', 'WON'].includes(l.status)).length,
        won: cityLeads.filter(l => l.status === 'WON').length,
      };
      return acc;
    }, {} as Record<string, FunnelData>);
  }, [leads, dynamicCities]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {dynamicCities.map((city) => (
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
