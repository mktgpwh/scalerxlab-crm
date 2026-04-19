import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateLead } from "@/lib/ai/scoring";
import { assignIncomingLead } from "@/lib/routing/lead-assignment";

export const dynamic = 'force-dynamic';

/**
 * STRATEGIC BACKFILL ENGINE
 * Retroactively applies AI Scoring and Routing to legacy or unscored leads.
 */
export async function POST(req: Request) {
    console.log("🚀 [BACKFILL] Starting retroactive intelligence sweep...");

    try {
        // 1. Identify Target Population: UNSCORED leads
        const unScoredLeads = await prisma.lead.findMany({
            where: {
                aiLeadScore: null, // Strictly leads that haven't been touched by AgentX yet
                OR: [
                    { status: "RAW" },
                    { status: "CONTACTED" }
                ]
            },
            take: 100 // Process in chunks to avoid timeouts
        });

        console.log(`🎯 [BACKFILL] Found ${unScoredLeads.length} leads for processing.`);

        const results = [];

        for (const lead of unScoredLeads) {
            // Determine best context for scoring
            // We use the last activity log description if available, otherwise generic
            const lastLog = await prisma.activityLog.findFirst({
                where: { leadId: lead.id, action: { contains: 'RECEIVED' } },
                orderBy: { createdAt: 'desc' }
            });

            const contextText = lastLog?.description || "Inquiry via platform (Direct)";

            console.log(`⌛ [BACKFILL] Scoring Lead ${lead.id}...`);
            const evaluation = await evaluateLead(lead.id, contextText);

            if (evaluation && !lead.ownerId) {
                console.log(`📡 [BACKFILL] Re-routing Lead ${lead.id} based on score: ${evaluation.score}`);
                await assignIncomingLead(lead.id);
            }

            results.push({ leadId: lead.id, score: evaluation?.score || "FAILED" });
        }

        return NextResponse.json({ 
            success: true, 
            processed: unScoredLeads.length,
            details: results
        });

    } catch (error: any) {
        console.error("💥 [BACKFILL_ERROR]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
