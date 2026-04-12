"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Update AI Chat Status
 * Pauses or reactivates AgentX for a specific lead.
 */
export async function updateAiStatus(leadId: string, status: 'AGENTX_ACTIVE' | 'HUMAN_OVERRIDE') {
    try {
        await prisma.lead.update({
            where: { id: leadId },
            data: { 
                aiChatStatus: status,
                // If handing back to AI, we assume escalation is resolved
                ...(status === 'AGENTX_ACTIVE' ? { isEscalated: false } : {})
            }
        });
        
        revalidatePath("/inbox");
        return { success: true };
    } catch (error) {
        console.error("Failed to update AI status:", error);
        return { success: false, error: "Status update failed" };
    }
}

/**
 * Send Manual Message
 * Sends a message from the clinic and automatically triggers HUMAN_OVERRIDE.
 */
export async function sendMessage(leadId: string, text: string) {
    try {
        // 1. Log the message in ActivityLog
        await prisma.activityLog.create({
            data: {
                leadId,
                action: "CLINIC_MESSAGE_SENT",
                description: text,
                metadata: {
                    sender: "CLINIC_AGENT",
                    timestamp: new Date().toISOString()
                }
            }
        });

        // 2. Automatically pause AgentX on human intervention
        await prisma.lead.update({
            where: { id: leadId },
            data: { aiChatStatus: 'HUMAN_OVERRIDE' }
        });

        revalidatePath("/inbox");
        return { success: true };
    } catch (error) {
        console.error("Failed to send message:", error);
        return { success: false, error: "Transmission failed" };
    }
}

/**
 * Resolve Escalation
 * Manually clear the emergency flag on a chat.
 */
export async function resolveEscalation(leadId: string) {
    try {
        await prisma.lead.update({
            where: { id: leadId },
            data: { isEscalated: false }
        });
        revalidatePath("/inbox");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
