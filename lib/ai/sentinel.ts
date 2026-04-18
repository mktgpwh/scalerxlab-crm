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
}

export async function analyzeClinicalConversation(
  messageText: string,
  history?: string,
  currentCategory?: string
): Promise<SentinelResult> {
  const systemPrompt = `[AGENTX CLINICAL SENTINEL — LEAD INTELLIGENCE ENGINE]
Identity: Chief of Patient Intelligence for Pahlajanis' Women's Hospital.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL RULE — INBOUND ONLY ANALYSIS:
You will receive the lead's messages ONLY. All classification, intent scoring, and sentiment analysis MUST be based solely on what the LEAD has said. Do NOT infer, assume, or factor in any clinic-side responses, AI suggestions, or outgoing messages. Your analysis reflects the lead's actual clinical need, expressed in their own words.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Core Tasks: 
1. TRIAGE leads into: INFERTILITY, GYNECOLOGY, MATERNITY, PEDIATRICS, or OTHER — based only on what the lead has communicated.
2. Determine Intent & Urgency from the lead's messages.
3. Assess Sentiment based on the lead's tone.

Brand Voice: Empathetic & Professional. Suggested replies should be in Hindi/English/Hinglish, mirroring the lead's language.

Safety Protocol: If the lead's messages contain markers of heavy bleeding, acute abdominal pain, or other emergency red-flags, suggest coming to hospital or calling the Raipur Emergency Line: 091091 14641.

Restrictions: 
- DO NOT give a final medical diagnosis.
- DO NOT factor in any outgoing / clinic-side messages when classifying or scoring.
- You are purely reflecting the lead's expressed need.

INTENT SCORING (based only on lead's messages):
- SCORE > 70 → HOT (Ready to visit, emergency signals, urgent appointment request).
- SCORE 50-70 → WARM (Asking pricing, success rates, general inquiry).
- SCORE < 50 → COLD (Generic greeting, non-clinical).

Current Known Category: ${currentCategory || "Unknown"}

RETURN ONLY VALID JSON — NO PREAMBLE:
{
  "category": "INFERTILITY" | "MATERNITY" | "GYNECOLOGY" | "PEDIATRICS" | "OTHER",
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "intentScore": number,
  "intentLevel": "HOT" | "WARM" | "COLD",
  "isAppointmentConfirmed": boolean,
  "suggestedReply": "string",
  "reasoning": "string — explain your classification based on the lead's words only"
}`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: `LEAD'S LATEST MESSAGE:\n"${messageText}"\n\nLEAD'S PREVIOUS MESSAGES (chronological, inbound only):\n${history && history !== "None" ? history : "No prior messages."}`
      }
    ],
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" }
  });

  const raw = JSON.parse(completion.choices[0].message.content || "{}");
  
  // Enforce User Mapping
  let intentLevel: "HOT" | "WARM" | "COLD" = "COLD";
  if (raw.intentScore > 70) intentLevel = "HOT";
  else if (raw.intentScore >= 50) intentLevel = "WARM";

  return {
    ...raw,
    intentLevel
  };
}
