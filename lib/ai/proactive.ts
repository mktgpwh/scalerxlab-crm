import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

/**
 * AgentX Proactive Sentinel
 * Orchestrates clinical drafts, emergency detect, and branch attribution.
 */

export interface ProactiveDraftParams {
    leadId: string;
    messageText: string;
    category?: string;
    pageId?: string;
}

export async function generateProactiveDraft({ leadId, messageText, category = "Clinical Consultation", pageId }: ProactiveDraftParams) {
    try {
        // 🛡️ LAZY INITIALIZATION (Build Safety)
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) throw new Error("Lead not found");

        const systemPrompt = `You are AgentX, a highly empathetic clinical counselor at Pahlajani's Women's Hospital.
        You are orchestrating the "Elite Parenthood Journey."
        Patient Message: "${messageText}"
        Treatment Category: "${category || 'General Infertility'}"

        TASKS:
        1. EMERGENCY DETECTION: Analyze if the patient mentions severe physical distress, heavy bleeding, acute pain, or a medical emergency. 
           If YES, start your response with [EMERGENCY:TRUE].
        2. LINGUISTIC MIRRORING: Analyze their language/script and mirror it perfectly.
        3. CLINICAL DRAFT: Draft a warm, 1-3 sentence reply. Mirror their language. Focus on empathy. Guide them to a consultation. Do NOT diagnose.
        
        FORMAT:
        [EMERGENCY:TRUE/FALSE]
        [DRAFT]
        Your reply here...`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: systemPrompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
        });

        const rawResult = completion.choices[0]?.message?.content || "";
        const isEmergency = rawResult.includes("[EMERGENCY:TRUE]");
        const draft = rawResult.split("[DRAFT]")[1]?.trim() || "Thank you for reaching out to Pahlajani's. Our counselor will assist you shortly.";

        if (isEmergency) {
            await prisma.lead.update({
                where: { id: leadId },
                data: {
                    isEscalated: true,
                    aiChatStatus: 'HUMAN_OVERRIDE',
                    status: 'CONTACTED'
                }
            });

            // 📢 BROADCAST EMERGENCY SIGNAL
            await supabaseAdmin.channel('global_notifications').send({
                type: 'broadcast',
                event: 'CLINICAL_EMERGENCY',
                payload: { name: lead.name, leadId: lead.id, concern: messageText }
            });
            
            console.log(`⚠️ EMERGENCY_SIGNAL_BROADCAST for lead ${leadId}`);
        }

        const currentMetadata = (lead.metadata as any) || {};

        await prisma.lead.update({
            where: { id: leadId },
            data: {
                metadata: {
                    ...currentMetadata,
                    latestAiSuggestion: draft,
                    isEmergencyDetected: isEmergency,
                    pageSource: pageId || currentMetadata.pageSource,
                    lastInteraction: new Date().toISOString()
                }
            }
        });

        return { success: true, isEmergency, draft };
    } catch (error) {
        console.error("Proactive drafting failed:", error);
        return { success: false, error };
    }
}
