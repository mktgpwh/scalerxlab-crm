"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Groq from "groq-sdk";

// Initialize Groq Client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

/**
 * Fetch Inbox Threads
 * Retrieves Leads (Patients) who have arrived via META_MESSAGING or WHATSAPP.
 * Filters for leads with at least one communication log and sorts by recency.
 */
export async function fetchInboxThreads() {
    try {
        const leads = await prisma.lead.findMany({
            where: {
                OR: [
                    { source: 'META_MESSAGING' },
                    { source: 'WHATSAPP' }
                ],
                // Ensure we only show threads with message history
                activityLogs: { some: {} }
            },
            include: {
                activityLogs: {
                    where: {
                        action: {
                            in: [
                                "MESSAGE_RECEIVED", 
                                "CLINIC_MESSAGE_SENT", 
                                "AGENTX_REPLY",
                                "AGENTX_FOLLOWUP_SENT",
                                "WHATSAPP_MESSAGE_SENT",
                                "WHATSAPP_MESSAGE_RECEIVED",
                                "INSTAGRAM_DM_RECEIVED",
                                "FACEBOOK_MSG_RECEIVED"
                            ]
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 50 // Fetch recent chat history
                }
            },
            orderBy: {
                updatedAt: 'desc' // Leads are updated whenever a new message log is added
            }
        });

        // Format for UI consumption
        return { 
            success: true, 
            threads: leads.map(lead => ({
                id: lead.id,
                name: lead.name,
                platform: (lead.metadata as any)?.platform || "messenger",
                status: lead.status,
                aiStatus: lead.aiChatStatus,
                isEscalated: lead.isEscalated,
                isAd: (lead.metadata as any)?.isAd === true,
                lastMessage: lead.activityLogs[0]?.description || "No message context",
                lastTime: lead.activityLogs[0]?.createdAt || lead.updatedAt,
                history: lead.activityLogs
            }))
        };
    } catch (error) {
        console.error("Failed to fetch inbox threads:", error);
        return { success: false, error: "Database fetch failed" };
    }
}

/**
 * Generate AI Draft Action
 * Orchestrates Groq to create a context-aware clinical reply.
 */
export async function generateDraftAction(leadId: string) {
    console.log(`🤖 [AGENTX_DRAFT_START] Processing Lead: ${leadId}`);
    try {
        // 1. Context Gathering: Full Bi-directional History
        const RELEVANT_ACTIONS = [
            "MESSAGE_RECEIVED", 
            "WHATSAPP_MESSAGE_RECEIVED", 
            "INSTAGRAM_DM_RECEIVED", 
            "FACEBOOK_MSG_RECEIVED",
            "CLINIC_MESSAGE_SENT",
            "AGENTX_REPLY",
            "WHATSAPP_MESSAGE_SENT"
        ];

        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            include: {
                activityLogs: {
                    where: { 
                        action: { in: RELEVANT_ACTIONS }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 15 
                }
            }
        });

        if (!lead) {
            console.error(`🛑 [AGENTX_DRAFT_ERROR] Lead ${leadId} not found`);
            return { success: false, error: "Lead not found" };
        }

        // Map logs to a conversational format for the LLM
        const historyContext = lead.activityLogs
            .map(log => {
                const isPatient = log.action.includes("RECEIVED");
                return `${isPatient ? 'Patient' : 'Clinic'}: ${log.description}`;
            })
            .reverse()
            .join("\n");

        // Identify the last patient message to reply to
        const lastPatientLog = lead.activityLogs.find(log => log.action.includes("RECEIVED"));
        const lastMessage = lastPatientLog?.description || "Hello";

        console.log(`📝 [AGENTX_DRAFT_CONTEXT] History Size: ${lead.activityLogs.length} | Target: "${lastMessage.slice(0, 30)}..."`);

        // 2. System Prompt with Mirroring & Emergency Rules
        const systemPrompt = `You are AgentX, a highly empathetic clinical counseling assistant at Pahlajani's Women's Hospital & IVF Center.
        
        GOAL: Comfort the patient and guide them to book a consultation for ${lead.category || 'Clinical Care'}.
        
        IDENTITY: You are NOT a doctor. You must NEVER diagnose, prescribe, or give medical advice.
        
        STYLE: warm, human-like, and strictly UNDER 3 sentences.
        
        LANGUAGE MIRRORING: Analyze the language and script of the patient's last message: "${lastMessage}".
        You MUST generate the draft in the EXACT same language (English, Hindi, or Hinglish) and script.
        
        EMERGENCY PROTOCOL: If you detect severe medical urgency (e.g. intense pain, bleeding, emergency), your response must be an JSON object: { "isEmergency": true, "draft": "URGENT_DRAFT" }.
        Otherwise, return: { "isEmergency": false, "draft": "YOUR_DRAFT" }.
        
        IMPORTANT: Return ONLY the JSON object. No preamble.`;

        // 3. LLM Orchestration
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Conversation History:\n${historyContext || "No history yet."}\n\nDraft a reply to the latest patient message: "${lastMessage}"` }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const rawContent = completion.choices[0]?.message?.content || "{}";
        console.log(`✨ [AGENTX_DRAFT_AI_RESPONSE] Raw: ${rawContent}`);
        
        const result = JSON.parse(rawContent);
        const { isEmergency, draft } = result;

        if (!draft) {
             throw new Error("AI returned an empty draft. Please try again.");
        }

        // 4. Autonomous Handoff Logic
        if (isEmergency) {
            await prisma.lead.update({
                where: { id: leadId },
                data: { 
                    aiChatStatus: 'HUMAN_OVERRIDE',
                    isEscalated: true 
                }
            });
            console.log(`🚨 [AGENTX_DRAFT_EMERGENCY] Escalated Lead ${leadId}`);
            revalidatePath("/inbox");
        }

        return { success: true, draft, isEmergency };

    } catch (error: any) {
        console.error("🛑 [AGENTX_DRAFT_FATAL] Error:", error.message);
        return { success: false, error: error.message };
    }
}

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

import { sendMetaMessage, sendWhatsAppMessage, sendWatiMessage } from "@/lib/ai/dispatch";

/**
 * Send Manual Message
 * Sends a message from the clinic and automatically triggers HUMAN_OVERRIDE.
 */
export async function sendMessage(leadId: string, text: string) {
    try {
        // 1. Fetch Lead context for routing
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) return { success: false, error: "Lead not found" };

        const metadata = (lead.metadata as any) || {};
        const recipientId = metadata.externalId;
        const isWati = metadata.isWati === true;
        const platform = metadata.platform || (lead.source === 'WHATSAPP' ? 'whatsapp' : 'facebook');

        if (!recipientId) throw new Error("Recipient ID (PSID/WAID) missing in lead metadata.");

        // 2. Dispatch to External Platform
        console.log(`📡 [OUTBOUND] Routing message to ${platform} (WATI: ${isWati}) for ${lead.name}...`);
        
        let dispatchResult;
        if (isWati) {
            dispatchResult = await sendWatiMessage({ leadId, platform: 'whatsapp', recipientId, text });
        } else if (platform === 'whatsapp') {
            dispatchResult = await sendWhatsAppMessage({ leadId, platform, recipientId, text });
        } else {
            dispatchResult = await sendMetaMessage({ leadId, platform: platform as 'facebook' | 'instagram', recipientId, text });
        }

        if (!dispatchResult.success) {
            throw new Error(`Platform Dispatch Failed: ${dispatchResult.error}`);
        }

        // 3. Log the message in ActivityLog (Success Path)
        await prisma.activityLog.create({
            data: {
                leadId,
                action: "CLINIC_MESSAGE_SENT",
                description: text,
                metadata: {
                    sender: "CLINIC_AGENT",
                    platform,
                    messageId: dispatchResult.messageId,
                    timestamp: new Date().toISOString()
                }
            }
        });

        // 4. Automatically pause AgentX on human intervention & bump updatedAt
        await prisma.lead.update({
            where: { id: leadId },
            data: { aiChatStatus: 'HUMAN_OVERRIDE', updatedAt: new Date() }
        });

        revalidatePath("/inbox");
        return { success: true };
    } catch (error: any) {
        console.error("🛑 [SEND_FAILURE] Failed to deliver message:", error.message);
        return { success: false, error: error.message };
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
