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

        // 1. Neural Analysis via Clinical Sentinel
        const analysis = await analyzeClinicalConversation(
            messageText,
            "", // Future: Pass history here
            lead.category || category
        );

        console.log(`📊 [SENTINEL_INSIGHT] Intent: ${analysis.intentLevel} | Score: ${analysis.intentScore}%`);

        // 2. Auto-Triage: Categorize Lead (Autonomous)
        // Note: We only update if it was unknown or changed significantly
        await prisma.lead.update({
            where: { id: leadId },
            data: {
                category: analysis.category,
                // AI signals (Metadata only, NO STATUS CHANGE as per instruction)
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
