import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { subDays, startOfDay, format } from "date-fns";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    const org = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const baseWhere: any = { organizationId: org.id };
    if (branchId && branchId !== "all") {
      baseWhere.branchId = branchId;
    }

    // 1. Core KPIs
    const [totalLeads, hotLeads, convertedLeads] = await Promise.all([
      prisma.lead.count({ where: baseWhere }),
      prisma.lead.count({ where: { ...baseWhere, intent: "HOT" } }),
      prisma.lead.count({ where: { ...baseWhere, status: "WON" } }),
    ]);

    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    // 2. Intake Data (Last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const intakeRaw = await prisma.lead.findMany({
      where: { ...baseWhere, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true }
    });

    const intakeMap = new Map();
    for (let i = 0; i < 30; i++) {
        const dateKey = format(subDays(new Date(), i), "yyyy-MM-dd");
        intakeMap.set(dateKey, 0);
    }

    intakeRaw.forEach(lead => {
        const dateKey = format(lead.createdAt, "yyyy-MM-dd");
        if (intakeMap.has(dateKey)) {
            intakeMap.set(dateKey, intakeMap.get(dateKey) + 1);
        }
    });

    const intakeData = Array.from(intakeMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // 3. Source Distribution
    const sourceDistribution = await prisma.lead.groupBy({
      by: ["source"],
      where: baseWhere,
      _count: true
    });

    const sourceData = sourceDistribution.map(item => ({
      name: item.source.replace('_', ' '),
      value: item._count
    }));

    // 4. Staff Leaderboard (Sample)
    const staffStats = await prisma.user.findMany({
       where: { memberships: { some: { organizationId: org.id } } },
       select: {
          name: true,
          assignedLeads: {
             where: baseWhere,
             select: { status: true }
          }
       },
       take: 5
    });

    const staffLeaderboard = staffStats.map(user => {
       const total = user.assignedLeads.length;
       const converted = user.assignedLeads.filter(l => l.status === "WON").length;
       return {
          name: user.name || "Anonymous",
          role: "Sales Agent",
          conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0
       };
    }).sort((a, b) => b.conversionRate - a.conversionRate);

    return NextResponse.json({
      totalLeads,
      hotLeads,
      conversionRate,
      avgResponseTime: "1.4h", // Mock for now
      intakeData,
      sourceData,
      staffLeaderboard
    });

  } catch (error) {
    console.error("[STATS_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
