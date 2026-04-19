import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export type AILeadScore = "HOT" | "WARM" | "COLD" | "UNQUALIFIED";

/**
 * AGENTX STRATEGIC SCORING ENGINE
 * Evaluates lead signals and categorizes clinical potential.
 */
export async function evaluateLead(leadId: string, messageText: string) {
    console.log(`📡 [AGENTX_SCORER] Evaluating Lead ${leadId}...`);

    try {
        const systemPrompt = `You are a Senior Clinical Qualification Officer at Pahlajani's Women's Hospital.
        Evaluate the following patient inquiry and categorize the lead intent.
        
        CRITERIA:
        - HOT: Immediate medical need, clear treatment intent (e.g. "I want to book an IVF cycle", "Severe pain, need scan").
        - WARM: Seeking information, curious but not urgent (e.g. "What are the costs for delivery?", "Do you have female doctors?").
        - COLD: One-word greeting, spam, unrelated inquiry (e.g. "hi", "how are you", "sell me cars").
        
        OUTPUT FORMAT: Strictly JSON
        {
          "score": "HOT" | "WARM" | "COLD",
          "reasoning": "1 sentence explanation",
          "department": "MATERNITY" | "INFERTILITY" | "GYNECOLOGY" | "PEDIATRICS" | "OTHER"
        }`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: messageText }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
        const { score, reasoning, department } = result;

        // Update Lead with AI Evaluation
        await prisma.lead.update({
            where: { id: leadId },
            data: {
                aiLeadScore: score,
                aiNotes: reasoning,
                aiSuggestedDepartment: department,
                aiScoredAt: new Date(),
                // If it's HOT or WARM, we can consider it "QUALIFIED" in the pipeline
                status: (score === "HOT" || score === "WARM") ? "QUALIFIED" : "RAW",
                intent: score === "HOT" ? "HOT" : score === "WARM" ? "WARM" : "COLD"
            }
        });

        await prisma.activityLog.create({
            data: {
                leadId,
                action: "AI_SCORE_GENERATED",
                description: `AgentX assigned score: ${score}. Reasoning: ${reasoning}`,
                metadata: result
            }
        });

        console.log(`✅ [AGENTX_SCORER] Lead ${leadId} scored as ${score}`);
        return result;

    } catch (error) {
        console.error("💥 [AGENTX_SCORER_ERROR]", error);
        return null;
    }
}
