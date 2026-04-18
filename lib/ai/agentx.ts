import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function processWithAgentX(leadId: string, messageText: string, whatsappNumber: string) {
    try {
        console.log(`[AGENTX_START] Processing Lead: ${leadId} | Number: ${whatsappNumber}`);

        // 1. Generate AI Reply
        const systemPrompt = `You are AgentX, the empathetic Chief of Customer Support for Pahlajani's Women's Hospital (पहलजानी विमेंस हॉस्पिटल). Reply briefly, professionally, and warmly in the user's language (Hindi/English/Hinglish). Never give medical diagnoses. If you detect emergency words (pain, bleeding), advise them to call the emergency line.`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: messageText }
            ],
            model: "llama-3.3-70b-versatile",
        });

        const replyContent = completion.choices[0]?.message?.content || "I apologize, but I am unable to process your request at this moment. Please call our clinic directly.";

        // 2. Send via WATI API
        const watiEndpoint = process.env.WATI_API_ENDPOINT;
        const watiToken = process.env.WATI_ACCESS_TOKEN;

        if (!watiEndpoint || !watiToken) {
            console.error("[AGENTX_ERROR] WATI credentials missing in environment variables!");
            return;
        }

        // WATI sendSessionMessage typically accepts messageText in the query string
        const url = `${watiEndpoint}/api/v1/sendSessionMessage/${whatsappNumber}?messageText=${encodeURIComponent(replyContent)}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${watiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`WATI API failed with status ${response.status}: ${errorData}`);
        }

        // 3. Log Activity
        await prisma.activityLog.create({
            data: {
                leadId: leadId,
                action: "AGENTX_REPLY_SENT",
                description: replyContent,
                metadata: {
                    model: "llama-3.3-70b-versatile"
                }
            }
        });

        console.log(`[AGENTX_SUCCESS] Reply sent successfully to ${whatsappNumber}`);

    } catch (error) {
        console.error("[AGENTX_FATAL_ERROR] Failed to process message via AgentX:", error);
    }
}
