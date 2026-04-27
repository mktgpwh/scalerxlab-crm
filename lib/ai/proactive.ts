import { prisma } from "@/lib/prisma";
import { analyzeClinicalConversation } from "./sentinel";
import { createClient } from "@supabase/supabase-js";

/**
 * AgentX Proactive Sentinel
 * Orchestrates clinical drafts, auto-triage, and sentiment analysis.
 */

export interface ProactiveDraftParams {
    leadId: string;
    messageText: string;
    category?: string;
    pageId?: string;
}

export async function generateProactiveDraft({ leadId, messageText, category, pageId }: ProactiveDraftParams) {
    console.log(`🧠 [SENTINEL_START] Analyzing Lead: ${leadId}`);
    try {
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) throw new Error("Lead not found");

        // Fetch ONLY inbound messages from the lead — exclude anything outgoing.
        // This ensures classification is never influenced by our own replies.
        const INBOUND_ACTIONS = [
            "MESSAGE_RECEIVED",
            "WHATSAPP_MESSAGE_RECEIVED",
            "INSTAGRAM_DM_RECEIVED",
            "FACEBOOK_MSG_RECEIVED",
        ];

        const inboundLogs = await prisma.activityLog.findMany({
            where: {
                leadId,
                action: { in: INBOUND_ACTIONS }
            },
            orderBy: { createdAt: "desc" },
            take: 10, // last 10 inbound messages for context
            select: { description: true, createdAt: true }
        });

        // Build a clean history string from lead's messages only
        const inboundHistory = inboundLogs
            .reverse()
            .map(log => `[LEAD]: ${log.description}`)
            .join("\n");

        // 1. Neural Analysis via Clinical Sentinel — inbound messages ONLY
        const analysis = await analyzeClinicalConversation(
            messageText,
            inboundHistory || "None",
            lead.category || category
        );

        console.log(`📊 [SENTINEL_INSIGHT] Intent: ${analysis.intentLevel} | Score: ${analysis.intentScore}%`);

        // 2. Strategic Intelligence Synthesis (Strict Workflow Sequence)
        // Order: Specialty Assignment -> Scoring -> Heat Mapping -> Qualification
        await prisma.lead.update({
            where: { id: leadId },
            data: {
                // A. Specialty Assignment (Clinical Triage)
                category: analysis.category,
                
                // B. Numerical Scoring (Calculated Potential)
                aiScore: analysis.intentScore,
                aiScoredAt: new Date(),
                
                // C. Heat Mapping (Strategic Categorization)
                intent: analysis.legacyScore,
                aiLeadScore: analysis.legacyScore,
                aiNotes: analysis.legacyReasoning,
                
                // D. Qualification (Pipeline Automation)
                // If it's HOT or WARM, we automatically qualify the lead
                status: (analysis.legacyScore === "HOT" || analysis.legacyScore === "WARM") ? "QUALIFIED" : lead.status,
                
                metadata: {
                    ...(lead.metadata as any || {}),
                    sentiment: analysis.sentiment,
                    intentScore: analysis.intentScore,
                    intentLevel: analysis.intentLevel,
                    latestAiSuggestion: analysis.suggestedReply,
                    sentinelReasoning: analysis.reasoning,
                    isAppointmentConfirmed: analysis.isAppointmentConfirmed,
                    lastInteraction: new Date().toISOString()
                }
            }
        });

        // 3. Emergency & Confirmed Escalation (Signals, not status move)
        const isEmergency = analysis.sentiment === "NEGATIVE" && analysis.intentLevel === "HOT";
        if (isEmergency || analysis.isAppointmentConfirmed) {
            await prisma.lead.update({
                where: { id: leadId },
                data: { isEscalated: true }
            });

            // BROADCAST SIGNAL
            const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (hasSupabase) {
                const supabaseAdmin = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                );
                await supabaseAdmin.channel('global_notifications').send({
                    type: 'broadcast',
                    event: 'AGENTX_SIGNAL',
                    payload: { 
                        name: lead.name, 
                        leadId: lead.id, 
                        signal: analysis.isAppointmentConfirmed ? "APPOINTMENT_READY" : "HOT_INTENT",
                        score: analysis.intentScore
                    }
                });
            }
        }

        console.log(`🏆 [SENTINEL_SUCCESS] Intelligence synthesis complete for ${leadId}`);
        return { success: true, analysis };
    } catch (error) {
        console.error("🛑 [SENTINEL_FATAL] Analysis failed:", error);
        return { success: false, error };
    }
}
