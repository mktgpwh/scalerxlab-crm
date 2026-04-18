import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";

/**
 * MIS Analytics Engine (Sovereign Intelligence Matrix)
 * Fetches aggregated stats from SQL Views with SWR caching
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const range = searchParams.get("range") || "last30"; // defaults to 30 days for trend
        const tenantId = "org_pahlajani_001"; // default as per requirement

        // ─── 1. Revenue Velocity (Line Chart Data) ───────────────────
        // We always fetch the last 30 days for the macro-trend
        const velocityDays = 30;
        const velocityStart = startOfDay(subDays(new Date(), velocityDays));
        
        const revenueTrend = await prisma.dailyRevenueSummary.findMany({
            where: {
                tenantId,
                day: { gte: velocityStart }
            },
            orderBy: { day: 'asc' }
        });

        // ─── 2. Conversion Statistics (Funnel / Performance) ───────
        const conversionStats = await prisma.leadConversionStats.findMany({
            where: { tenantId }
        });

        // ─── 3. Departmental Distribution (Pie Chart) ──────────────
        // Aggregate by department across the total view
        const deptRevenue = await prisma.dailyRevenueSummary.groupBy({
            by: ['department'],
            where: { tenantId },
            _sum: { totalRevenue: true }
        });

        // ─── 4. Source Performance (Billed Amount) ──────────────────
        const sourcePerformance = await prisma.sourcePerformance.findMany({
            where: { tenantId },
            orderBy: { totalBilled: 'desc' }
        });

        // ─── 5. Revenue Leak Detector (HOT leads without invoices) ───
        const last24h = subDays(new Date(), 1);
        const highPriorityLeaks = await prisma.lead.findMany({
            where: {
                tenantId,
                intent: 'HOT',
                createdAt: { gte: last24h },
                invoices: { none: {} }
            },
            select: {
                id: true,
                name: true,
                phone: true, 
                aiScore: true,
                createdAt: true
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        const totalLeakCount = await prisma.lead.count({
            where: {
                tenantId,
                intent: 'HOT',
                createdAt: { gte: last24h },
                invoices: { none: {} }
            }
        });

        // ─── Synthesis ──────────────────────────────────────────────
        const data = {
            revenueTrend: revenueTrend.map(r => ({
                day: r.day.toISOString().split('T')[0],
                amount: r.totalRevenue,
                dept: r.department
            })),
            conversion: conversionStats.map(s => ({
                source: s.source,
                raw: s.rawCount,
                won: s.wonCount,
                rate: s.conversionRate
            })),
            departments: deptRevenue.map(d => ({
                name: d.department,
                value: d._sum.totalRevenue || 0
            })),
            sources: sourcePerformance.map(s => ({
                source: s.source,
                billed: s.totalBilled
            })),
            leaks: {
                leads: highPriorityLeaks,
                totalCount: totalLeakCount
            }
        };

        return NextResponse.json(data, {
            headers: {
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
            }
        });

    } catch (error: any) {
        console.error("🛑 [ANALYTICS_SERVICE_FAILURE]", error.message);
        return NextResponse.json({ error: "Intelligence synthesis failure" }, { status: 500 });
    }
}
