import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface SentinelResult {
  category: "INFERTILITY" | "MATERNITY" | "GYNECOLOGY" | "PEDIATRICS" | "OTHER";
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  intentScore: number; // 0-100
  intentLevel: "HOT" | "WARM" | "COLD";
  isAppointmentConfirmed: boolean;
  suggestedReply: string;
  reasoning: string;
  // Legacy mappings for backward compatibility
  legacyScore: "HOT" | "WARM" | "COLD";
  legacyReasoning: string;
}

export async function analyzeClinicalConversation(
  messageText: string,
  history?: string,
  currentCategory?: string
): Promise<SentinelResult> {
  const systemPrompt = `[AGENTX CLINICAL SENTINEL — CONSOLIDATED INTELLIGENCE ENGINE]
Identity: Chief of Patient Intelligence for Pahlajanis' Women's Hospital.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL RULE — INBOUND ONLY ANALYSIS:
You will receive the lead's messages ONLY. Base all analysis solely on what the LEAD has said.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Core Tasks: 
1. TRIAGE leads into: INFERTILITY, GYNECOLOGY, MATERNITY, PEDIATRICS, or OTHER.
2. Determine Intent & Urgency.
3. Assess Sentiment.
4. Legacy Integration: Assign a legacy score (HOT | WARM | COLD) for historical reporting.

INTENT SCORING:
- SCORE > 70 → HOT (Immediate medical need, clear treatment intent, or emergency).
- SCORE 50-70 → WARM (General inquiry, seeking information, cost requests).
- SCORE < 50 → COLD (Greeting, non-clinical, or spam).

Brand Voice: Empathetic & Professional (RAIPUR-LOCAL context).

RETURN ONLY VALID JSON:
{
  "category": "INFERTILITY" | "MATERNITY" | "GYNECOLOGY" | "PEDIATRICS" | "OTHER",
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "intentScore": number,
  "intentLevel": "HOT" | "WARM" | "COLD",
  "legacyScore": "HOT" | "WARM" | "COLD",
  "isAppointmentConfirmed": boolean,
  "suggestedReply": "Draft for human agent",
  "reasoning": "Clinical justification for this classification",
  "legacyReasoning": "1-sentence legacy reasoning"
}`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: `LEAD'S LATEST MESSAGE:\n"${messageText}"\n\nLEAD'S PREVIOUS MESSAGES:\n${history && history !== "None" ? history : "No prior messages."}`
      }
    ],
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" }
  });

  const raw = JSON.parse(completion.choices[0].message?.content || "{}");
  
  // Enforce Consistency between Sentinel and Legacy
  let intentLevel: "HOT" | "WARM" | "COLD" = raw.intentLevel || "COLD";
  if (raw.intentScore > 70) intentLevel = "HOT";
  else if (raw.intentScore >= 50) intentLevel = "WARM";
  else intentLevel = "COLD";

  return {
    ...raw,
    intentLevel,
    legacyScore: raw.legacyScore || intentLevel,
    legacyReasoning: raw.legacyReasoning || raw.reasoning
  };
}
