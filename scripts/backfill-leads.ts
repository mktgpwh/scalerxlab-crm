import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { evaluateLead } from "../lib/ai/scoring";
import { assignIncomingLead } from "../lib/routing/lead-assignment";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL or DIRECT_URL is not set.");
    process.exit(1);
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function backfillLeads() {
    console.log("🚀 [BACKFILL] Starting strategic intelligence sweep...");
    
    try {
        // 1. Identify Target Population: UNSCORED leads
        const unScoredLeads = await prisma.lead.findMany({
            where: {
                aiLeadScore: null,
                OR: [
                    { status: "RAW" },
                    { status: "CONTACTED" }
                ]
            }
        });

        const totalLeads = unScoredLeads.length;
        console.log(`🎯 [BACKFILL] Found ${totalLeads} leads for processing.`);

        for (let i = 0; i < totalLeads; i++) {
            const lead = unScoredLeads[i];
            
            // Determine context
            const lastLog = await prisma.activityLog.findFirst({
                where: { leadId: lead.id, action: { contains: 'RECEIVED' } },
                orderBy: { createdAt: 'desc' }
            });

            const contextText = lastLog?.description || "Inquiry via platform (Direct)";

            console.log(`⌛ [${i + 1}/${totalLeads}] Scoring Lead ${lead.id}...`);
            const evaluation = await evaluateLead(lead.id, contextText);

            if (evaluation && !lead.ownerId) {
                console.log(`📡 [${i + 1}/${totalLeads}] Re-routing Lead ${lead.id} | Score: ${evaluation.score}`);
                await assignIncomingLead(lead.id);
            }

            // [CRITICAL] 12-SECOND DELAY (Rate Limit Shield)
            if (i < totalLeads - 1) {
                console.log(`⏸️  Pausing for 12 seconds to respect AI TPM limits...`);
                await new Promise(resolve => setTimeout(resolve, 12000));
            }
        }

        console.log("✅ [BACKFILL_COMPLETE] All leads processed successfully.");

    } catch (error) {
        console.error("💥 [BACKFILL_FATAL_ERROR]", error);
    } finally {
        await prisma.$disconnect();
    }
}

backfillLeads();
