import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

/**
 * Call Metrics Dashboard API
 * Aggregates live and historical call KPIs.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const org = await prisma.organization.findUnique({
      where: { slug }
    });

    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

    const today = {
      gte: startOfDay(new Date()),
      lte: endOfDay(new Date())
    };

    // Aggregate Stats
    const [stats, inboundCount, outboundCount, missedCount, qualifiedCount] = await Promise.all([
      prisma.callLog.count({ where: { organizationId: org.id } }),
      prisma.callLog.count({ where: { organizationId: org.id, direction: "INBOUND", createdAt: today } }),
      prisma.callLog.count({ where: { organizationId: org.id, direction: "OUTBOUND", createdAt: today } }),
      prisma.callLog.count({ where: { organizationId: org.id, status: "MISSED", createdAt: today } }),
      prisma.callLog.count({ where: { organizationId: org.id, isQualified: true, createdAt: today } })
    ]);

    return NextResponse.json({
      qualified: qualifiedCount,
      missed: missedCount,
      inbound: inboundCount,
      outbound: outboundCount,
      totalLifetime: stats
    });
  } catch (error) {
    console.error("[TELEPHONY_STATS_ERROR]", error);
    return NextResponse.json({ error: "Failed to aggregate metrics" }, { status: 500 });
  }
}
