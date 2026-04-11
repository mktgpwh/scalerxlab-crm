import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export interface BusinessHealthProfile {
  globalStats: {
    totalLeads: number;
    hotRatio: number;
    conversionRate: number;
    velocityAvg: number; // Avg time to contact/qualified
  };
  centerPerformance: Array<{
    name: string;
    leadVolume: number;
    conversionRate: number;
    avgVelocity: number;
    categorySplit: Record<string, number>;
  }>;
  categoryDeepDive: Array<{
    category: string;
    totalLeads: number;
    conversionRate: number;
    roiScore: number;
  }>;
}

export async function fetchIntelligenceAggregates(): Promise<BusinessHealthProfile> {
  const [branches, leads, totalLeads] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true } }),
    prisma.lead.findMany({
      select: {
        status: true,
        intent: true,
        category: true,
        branchId: true,
        createdAt: true,
        assignedAt: true,
        // STRICT: No Name, Phone, or Email
      }
    }),
    prisma.lead.count()
  ]);

  // Global calculations
  const wonLeads = leads.filter(l => l.status === 'WON').length;
  const hotLeads = leads.filter(l => l.intent === 'HOT').length;
  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
  
  // Center Performance
  const centerPerformance = branches.map(branch => {
    const branchLeads = leads.filter(l => l.branchId === branch.id);
    const bTotal = branchLeads.length;
    const bWon = branchLeads.filter(l => l.status === 'WON').length;
    
    return {
      name: branch.name,
      leadVolume: bTotal,
      conversionRate: bTotal > 0 ? (bWon / bTotal) * 100 : 0,
      avgVelocity: 1.5, // Mocked for now until we have detailed activity logs
      categorySplit: branchLeads.reduce((acc, lead) => {
        acc[lead.category] = (acc[lead.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  });

  // Category Deep Dive
  const categories: any[] = ['INFERTILITY', 'MATERNITY', 'GYNECOLOGY', 'OTHER'];
  const categoryDeepDive = categories.map(cat => {
    const catLeads = leads.filter(l => l.category === cat);
    const cTotal = catLeads.length;
    const cWon = catLeads.filter(l => l.status === 'WON').length;
    
    return {
      category: cat,
      totalLeads: cTotal,
      conversionRate: cTotal > 0 ? (cWon / cTotal) * 100 : 0,
      roiScore: cTotal > 0 ? (cWon / cTotal) * 10 : 0
    };
  });

  return {
    globalStats: {
      totalLeads,
      hotRatio: totalLeads > 0 ? (hotLeads / totalLeads) * 100 : 0,
      conversionRate,
      velocityAvg: 2.1,
    },
    centerPerformance,
    categoryDeepDive
  };
}
