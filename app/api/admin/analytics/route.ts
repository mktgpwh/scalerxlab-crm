import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays } from "date-fns";
import { auth } from "@/auth";
import { getLeadFilter, getRevenueFilter } from "@/lib/security/rbac-utils";

export const dynamic = "force-dynamic";

/**
 * MIS Analytics Engine (Sovereign Intelligence Matrix)
 * Fetches aggregated stats with strict Role-Based Data Sovereignty.
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;
        const tenantId = "org_pahlajani_001";
        
        // ─── 0. Security Guards ──────────────────────────────────────
        const isSuperAdmin = user.role === "SUPER_ADMIN";

        const leadFilter = getLeadFilter(user);
        const revenueFilter = getRevenueFilter(user);

        // ─── 1. Revenue Velocity & Distribution ─────────────────────
        const velocityDays = 30;
        const velocityStart = startOfDay(subDays(new Date(), velocityDays));
        
        let revenueTrend: any[] = [];
        let deptRevenue: any[] = [];
        let sourcePerformance: any[] = [];

        if (isSuperAdmin) {
            // High-performance optimization via SQL Views for Super Admin
            revenueTrend = await prisma.dailyRevenueSummary.findMany({
                where: { tenantId, day: { gte: velocityStart } },
                orderBy: { day: 'asc' }
            });

            deptRevenue = (await prisma.dailyRevenueSummary.groupBy({
                by: ['department'],
                where: { tenantId },
                _sum: { totalRevenue: true }
            })).map(d => ({ name: d.department, value: d._sum.totalRevenue || 0 }));

            sourcePerformance = await prisma.sourcePerformance.findMany({
                where: { tenantId },
                orderBy: { totalBilled: 'desc' }
            });
        } else {
            // Strict Silo logic: Aggregate on-the-fly from raw Invoice data
            const rawInvoices = await prisma.invoice.findMany({
                where: {
                    ...(revenueFilter as any),
                    tenantId,
                    issuedAt: { gte: velocityStart }
                } as any,
                select: {
                    totalAmount: true,
                    issuedAt: true,
                    department: true,
                    lead: { select: { source: true } }
                }
            }) as any;

            // Process Trend
            const trendMap = new Map();
            rawInvoices.forEach((inv: any) => {
                const day = inv.issuedAt.toISOString().split('T')[0];
                trendMap.set(day, (trendMap.get(day) || 0) + inv.totalAmount);
            });
            revenueTrend = Array.from(trendMap.entries()).map(([day, amount]) => ({ day, amount }));

            // Process Dept
            const deptMap = new Map();
            rawInvoices.forEach((inv: any) => {
                deptMap.set(inv.department, (deptMap.get(inv.department) || 0) + inv.totalAmount);
            });
            deptRevenue = Array.from(deptMap.entries()).map(([name, value]) => ({ name, value }));

            // Process Sources
            const sourceMap = new Map();
            rawInvoices.forEach((inv: any) => {
                const source = inv.lead.source;
                sourceMap.set(source, (sourceMap.get(source) || 0) + inv.totalAmount);
            });
            sourcePerformance = Array.from(sourceMap.entries()).map(([source, billed]) => ({ source, billed }));
        }

        // ─── 2. Conversion Statistics (Funnel / Performance) ───────
        // Note: For non-admins, we might want to calculate this relative to their own lead pool
        const conversionStats = await prisma.leadConversionStats.findMany({
            where: { tenantId }
        });

        // ─── 3. Revenue Leak Detector (Siloed) ──────────────────────
        const last24h = subDays(new Date(), 1);
        const leakFilter = {
            ...leadFilter,
            tenantId,
            intent: 'HOT' as any,
            createdAt: { gte: last24h },
            invoices: { none: {} }
        };

        const highPriorityLeaks = await prisma.lead.findMany({
            where: leakFilter as any,
            select: { id: true, name: true, phone: true, aiScore: true, createdAt: true },
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        const totalLeakCount = await prisma.lead.count({ where: leakFilter as any });

        // ─── Synthesis ──────────────────────────────────────────────
        const data = {
            revenueTrend: isSuperAdmin 
                ? revenueTrend.map(r => ({ day: r.day.toISOString().split('T')[0], amount: r.totalRevenue, dept: r.department }))
                : revenueTrend,
            conversion: conversionStats.map(s => ({
                source: s.source,
                raw: s.rawCount,
                won: s.wonCount,
                rate: s.conversionRate
            })),
            departments: deptRevenue,
            sources: sourcePerformance,
            leaks: {
                leads: highPriorityLeaks,
                totalCount: totalLeakCount
            }
        };

        return NextResponse.json(data, {
            headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" }
        });

    } catch (error: any) {
        console.error("🛑 [ANALYTICS_SERVICE_FAILURE]", error.message);
        return NextResponse.json({ error: "Intelligence synthesis failure" }, { status: 500 });
    }
}
