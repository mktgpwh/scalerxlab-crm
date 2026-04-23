"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { UserRole, LeadStatus, LeadSource, BillingDept } from "@prisma/client";

export async function getPerformanceMatrixData() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  
  const role = session.user.role as UserRole;
  const userId = session.user.id;

  // Base filters for RLS
  const leadFilter: any = {};
  const invoiceFilter: any = {};

  if (role === "TELE_SALES" || role === "FIELD_SALES") {
    leadFilter.ownerId = userId;
    invoiceFilter.lead = { ownerId: userId };
  } else if (role === "FIELD_SALES_ADMIN") {
    leadFilter.OR = [
      { ownerId: userId }, 
      { owner: { managerId: userId } },
      { owner: { role: "FIELD_SALES" } }
    ];
    invoiceFilter.lead = { 
      OR: [
        { ownerId: userId }, 
        { owner: { managerId: userId } },
        { owner: { role: "FIELD_SALES" } }
      ] 
    };
  } else if (role === "TELE_SALES_ADMIN") {
    leadFilter.owner = { role: "TELE_SALES" };
    invoiceFilter.lead = { owner: { role: "TELE_SALES" } };
  }

  // 1. Overall Stats
  const [totalPipeline, checkIns, revenueRealized] = await Promise.all([
    prisma.invoice.aggregate({
      where: invoiceFilter,
      _sum: { totalAmount: true }
    }),
    prisma.lead.count({
      where: { ...leadFilter, status: "VISITED" }
    }),
    prisma.payment.aggregate({
      where: { invoice: invoiceFilter },
      _sum: { amount: true }
    })
  ]);

  // Funnel Data Mapping
  const funnelStatuses: { name: string; status: LeadStatus; fill: string }[] = [
    { name: 'Raw Leads', status: 'RAW', fill: '#6366f1' },
    { name: 'Qualified', status: 'QUALIFIED', fill: '#818cf8' },
    { name: 'Appointments', status: 'APPOINTMENT_SCHEDULED', fill: '#a5b4fc' },
    { name: 'Visited', status: 'VISITED', fill: '#c7d2fe' },
    { name: 'Converted', status: 'WON', fill: '#10b981' },
  ];

  const funnelData = await Promise.all(funnelStatuses.map(async (f) => {
    const count = await prisma.lead.count({ 
      where: { ...leadFilter, status: f.status } 
    });
    return { name: f.name, value: count, fill: f.fill };
  }));

  // 2. Lead Origin Matrix
  const originRaw = await prisma.lead.groupBy({
    by: ['source'],
    where: leadFilter,
    _count: { _all: true }
  });

  const originColors: Record<string, string> = {
    SMARTFLO_CALL: '#6366f1',
    AGENT_X_WEBSITE: '#8b5cf6',
    WHATSAPP: '#10b981',
    FIELD_SOURCED: '#f59e0b',
    WALK_IN: '#ec4899'
  };

  const leadOriginMatrix = originRaw.map(item => ({
    name: item.source.replace('_', ' '),
    value: item._count._all,
    fill: originColors[item.source] || '#cbd5e1'
  }));

  // 3. Field Roster
  const fieldRepsRaw = await prisma.user.findMany({
    where: { 
      role: "FIELD_SALES",
      ...(role === "FIELD_SALES_ADMIN" ? { managerId: userId } : {})
    },
    include: {
      ownedLeads: {
        select: {
          id: true,
          status: true,
          invoices: {
            select: {
              totalAmount: true,
              payments: {
                select: { amount: true }
              }
            }
          }
        }
      },
      branch: true
    }
  });

  const fieldReps = fieldRepsRaw.map(rep => {
    let totalRevenue = 0;
    rep.ownedLeads.forEach(lead => {
      lead.invoices.forEach(inv => {
        inv.payments.forEach(p => totalRevenue += p.amount);
      });
    });

    const convertedCount = rep.ownedLeads.filter(l => l.status === "WON").length;
    const conversionRate = rep.ownedLeads.length > 0 
      ? Math.round((convertedCount / rep.ownedLeads.length) * 100) 
      : 0;

    return {
      name: rep.name || "Unknown Rep",
      center: rep.branch?.name || "Global",
      leads: rep.ownedLeads.length,
      revenue: `₹${(totalRevenue / 100000).toFixed(1)}L`,
      conversion: `${conversionRate}%`,
      centers: [rep.branch?.name].filter(Boolean) as string[]
    };
  });

  // 4. Tele-Sales Leaderboard
  const teleSalesRaw = await prisma.user.findMany({
    where: { role: "TELE_SALES" },
    include: {
      ownedLeads: {
        select: {
          status: true
        }
      }
    }
  });

  const teleSales = teleSalesRaw.map((agent, i) => {
    const assigned = agent.ownedLeads.length;
    const booked = agent.ownedLeads.filter(l => l.status === "APPOINTMENT_SCHEDULED").length;
    const visited = agent.ownedLeads.filter(l => l.status === "VISITED").length;
    const converted = agent.ownedLeads.filter(l => l.status === "WON").length;
    
    const colors = ["#6366f1", "#818cf8", "#10b981", "#f59e0b"];

    return {
      name: agent.name || "Agent",
      assigned,
      booked,
      visited,
      converted,
      color: colors[i % colors.length]
    };
  });

  // 5. Center-Wise Performance
  const branchesRaw = await prisma.branch.findMany({
    include: {
      leads: {
        select: {
          source: true,
          invoices: {
            select: { totalAmount: true }
          }
        }
      }
    }
  });

  const centerPerformance = branchesRaw.map(branch => {
    const digitalCount = branch.leads.filter(l => ["META_ADS", "GOOGLE_ADS", "WEBSITE_FORM", "META_MESSAGING"].includes(l.source)).length;
    const fieldCount = branch.leads.filter(l => l.source === "FIELD_SOURCED").length;
    const organicCount = branch.leads.filter(l => l.source === "WALK_IN" || l.source === "REFERRAL").length;

    return {
      name: branch.name,
      field: fieldCount,
      digital: digitalCount,
      organic: organicCount
    };
  });

  return {
    overallStats: [
      { label: "Total Pipeline Value", value: `₹${((totalPipeline._sum.totalAmount || 0) / 10000000).toFixed(2)} Cr`, growth: "+0%", icon: "TrendingUp", color: "indigo" },
      { label: "Patient Check-Ins", value: checkIns.toString(), growth: "+0%", icon: "MapPin", color: "emerald" },
      { label: "Revenue Realized", value: `₹${((revenueRealized._sum.amount || 0) / 1000000).toFixed(1)}L`, growth: "+0%", icon: "Award", color: "amber" },
      { label: "Mean Conversion Velocity", value: "14 Days", growth: "0%", icon: "Activity", color: "rose" },
    ],
    funnelData,
    leadOriginMatrix,
    fieldReps,
    teleSales,
    centerPerformance
  };
}
