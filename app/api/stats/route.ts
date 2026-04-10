import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId') || undefined;
    const baseWhere: any = branchId ? { branchId } : {};

    const today = { gte: new Date(new Date().setHours(0, 0, 0, 0)) };

    const [
      totalLeads, hotLeads, warmLeads, wonLeads,
      newToday, bySource, byStatus, byCategory, agents
    ] = await Promise.all([
      prisma.lead.count({ where: baseWhere }),
      prisma.lead.count({ where: { ...baseWhere, intent: "HOT" } }),
      prisma.lead.count({ where: { ...baseWhere, intent: "WARM" } }),
      prisma.lead.count({ where: { ...baseWhere, status: "WON" } }),
      prisma.lead.count({ where: { ...baseWhere, createdAt: today } }),
      prisma.lead.groupBy({ by: ['source'], where: baseWhere, _count: true }),
      prisma.lead.groupBy({ by: ['status'], where: baseWhere, _count: true }),
      prisma.lead.groupBy({ by: ['category'], where: baseWhere, _count: true }),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    return NextResponse.json({
      totalLeads, hotLeads, warmLeads, wonLeads,
      newToday, bySource, byStatus, byCategory, agents
    });
  } catch (error) {
    console.error("[STATS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
