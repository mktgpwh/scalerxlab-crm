import * as dotenv from "dotenv";
dotenv.config();

import { prisma } from "../lib/prisma";
import { generateProactiveDraft } from "../lib/ai/proactive";
import { assignIncomingLead } from "../lib/routing/lead-assignment";

async function debugLeadProcessing() {
    console.log("🚀 Starting Optimized Debug Lead Processing...");
    
    try {
        // 1. Create a dummy lead
        const lead = await prisma.lead.create({
            data: {
                name: "Optimized Debug Lead",
                phone: "8888888888",
                whatsappNumber: "918888888888",
                source: "WHATSAPP",
                status: "RAW",
                intent: "COLD",
                category: "OTHER"
            }
        });
        console.log(`✅ Created Test Lead: ${lead.id}`);

        const messageText = "I need to book a delivery at your hospital. What are the charges?";
        console.log(`📝 Test Message: "${messageText}"`);

        // 2. CONSOLIDATED Phase: Calling generateProactiveDraft (One call for everything)
        console.log("\n📡 Phase 2: Calling consolidated generateProactiveDraft...");
        const proactiveResult = await generateProactiveDraft({ leadId: lead.id, messageText });
        console.log("✅ result from generateProactiveDraft:", proactiveResult.success ? "SUCCESS" : "FAILED");

        // 3. Test assignIncomingLead (Routing)
        console.log("\n📡 Phase 3: Calling assignIncomingLead...");
        const routeResult = await assignIncomingLead(lead.id);
        console.log("✅ result from assignIncomingLead:", routeResult ? `Routed to ${routeResult.email}` : "No agent assigned (Offline/AI Triage)");

        // 4. Final Verification
        const finalLead = await prisma.lead.findUnique({ where: { id: lead.id } });
        console.log("\n🏆 Final State Verification:");
        console.log(`- LEGACY Status: ${finalLead?.status}`);
        console.log(`- LEGACY Intent: ${finalLead?.intent}`);
        console.log(`- LEGACY Category: ${finalLead?.category}`);
        console.log(`- LEGACY AI Score: ${finalLead?.aiLeadScore}`);
        console.log(`- METADATA Heat Level: ${finalLead?.metadata?.intentLevel}`);
        console.log(`- METADATA Score: ${finalLead?.metadata?.intentScore}`);
        console.log(`- METADATA Reasoning: ${finalLead?.metadata?.sentinelReasoning?.slice(0, 60)}...`);

    } catch (error) {
        console.error("\n💥 FATAL DEBUG ERROR:", error);
    } finally {
        process.exit();
    }
}

debugLeadProcessing();
