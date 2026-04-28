import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";
import { sendWatiMessage } from "./dispatch";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function processWithAgentX(leadId: string, messageText: string, whatsappNumber: string) {
    try {
        console.log(`[AGENTX_START] Processing Lead: ${leadId} | Number: ${whatsappNumber}`);

        // 1. Fetch Lead Context for Triage
        const lead = await prisma.lead.findUnique({
            where: { id: leadId }
        });

        if (!lead) {
            console.error(`[AGENTX_ERROR] Lead ${leadId} not found.`);
            return;
        }

        const isTriageMode = lead.isUnderAITriage || false;

        // 2. Generate AI Reply with Context-Aware Persona
        const systemPrompt = isTriageMode 
            ? `You are AgentX, the Autonomous Triage Officer for Pahlajani's Women's Hospital. 
               The clinical human team is currently OFFLINE. 
               Your Goal: 
               1. Warmly greet the user.
               2. Ask qualifying questions to understand their concern (Maternity, Infertility, Gynae, etc.).
               3. Classify their urgency.
               4. At the end of your response, you MUST include a hidden JSON block for system parsing: 
                  ###SYSTEM_DATA### {"intent": "HOT|WARM|COLD", "department": "MATERNITY|INFERTILITY|GYNECOLOGY|PEDIATRICS", "score": "A|B|C"} ###END_SYSTEM_DATA###
               Never give medical diagnoses. Advise emergency line for pain/bleeding.`
            : `You are AgentX, the empathetic Chief of Customer Support for Pahlajani's Women's Hospital (पहलजानी विमेंस हॉस्पिटल). Reply briefly, professionally, and warmly in the user's language (Hindi/English/Hinglish). Never give medical diagnoses. If you detect emergency words (pain, bleeding), advise them to call the emergency line.`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: messageText }
            ],
            model: "llama-3.3-70b-versatile",
        });

        const fullContent = completion.choices[0]?.message?.content || "";
        
        // Extract System Data if present
        let replyContent = fullContent;
        let aiMetadata: any = null;
        
        const systemDataMatch = fullContent.match(/###SYSTEM_DATA### ([\s\S]*?) ###END_SYSTEM_DATA###/);
        if (systemDataMatch) {
            try {
                aiMetadata = JSON.parse(systemDataMatch[1]);
                replyContent = fullContent.replace(/###SYSTEM_DATA### [\s\S]*? ###END_SYSTEM_DATA###/, "").trim();
            } catch (e) {
                console.error("[AGENTX_PARSE_ERROR]", e);
            }
        }

        if (!replyContent) {
            replyContent = "I apologize, but I am unable to process your request at this moment. Please call our clinic directly.";
        }

        // 3. Send via Unified Dispatcher
        console.log(`[AGENTX_DISPATCH] Handoff to WATI for ${whatsappNumber}`);
        const dispatchResult = await sendWatiMessage({
            leadId,
            platform: 'whatsapp',
            recipientId: whatsappNumber,
            text: replyContent
        });

        if (!dispatchResult.success) {
            console.error(`[AGENTX_DISPATCH_FAILED] ${dispatchResult.error}`);
            // Log failure to activity log
            await prisma.activityLog.create({
                data: {
                    leadId,
                    action: "AGENTX_DISPATCH_FAILURE",
                    description: `Failed to send AI response: ${dispatchResult.error}`,
                }
            });
            return;
        }

        // 4. Update Lead Intelligence (Triage Sync)
        const updateData: any = { updatedAt: new Date() };
        if (isTriageMode && aiMetadata) {
            updateData.intent = aiMetadata.intent;
            updateData.aiLeadScore = aiMetadata.score;
            updateData.aiSuggestedDepartment = aiMetadata.department;
            
            await prisma.activityLog.create({
                data: {
                    leadId,
                    action: "AI_QUALIFICATION_UPDATE",
                    description: `AgentX qualified lead as ${aiMetadata.intent} for ${aiMetadata.department}.`,
                    metadata: aiMetadata
                }
            });
        }

        await prisma.lead.update({
            where: { id: leadId },
            data: updateData
        });

        // 5. Log Success
        await prisma.activityLog.create({
            data: {
                leadId,
                action: "AGENTX_REPLY_SENT",
                description: replyContent,
                metadata: { triage: isTriageMode, provider: "WATI" }
            }
        });

        console.log(`[AGENTX_SUCCESS] Autonomous response delivered to ${whatsappNumber}`);

    } catch (error: any) {
        console.error("[AGENTX_FATAL_ERROR] Failed to process message via AgentX:", error.message);
    }
}
