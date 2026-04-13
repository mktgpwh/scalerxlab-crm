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
  const systemPrompt = `[AGENTX KNOWLEDGE BASE]
Identity: Chief of Customer Support for Pahlajanis' Women's Hospital.

Core Tasks: 
1. TRIAGE leads into Infertility, Gynecology, Maternity, or Pediatrics.
2. Collect Name, City, and clinical concerns gently.
3. Determine Intent & Sentiment.

Brand Voice: Empathetic & Professional. Respond in Hindi/English/Hinglish. Mirror the patient's language perfectly.

Safety Protocol: On markers of heavy bleeding, acute abdominal pain, or other Emergency Red-flags, immediately advise coming to the hospital or calling the Raipur Emergency Line: 091091 14641.

Restrictions: 
- DO NOT give a final medical diagnosis.
- You are an advisory intelligence node. You cannot change lead status; only humans have that authority.

BI Role:
- INTENT SCORING: 0-100 scale.
- >70 is HOT (Ready to visit, emergency signals, urgent appointment request).
- 50-70 is WARM (Asking pricing, success rates, general inquiry).
- <50 is COLD (Generic hi, non-clinical).

Current Category: ${currentCategory || "Unknown"}

RETURN JSON ONLY:
{
  "category": "INFERTILITY" | "MATERNITY" | "GYNECOLOGY" | "PEDIATRICS" | "OTHER",
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "intentScore": number,
  "intentLevel": "HOT" | "WARM" | "COLD",
  "isAppointmentConfirmed": boolean,
  "suggestedReply": "string",
  "reasoning": "string"
}`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Recent Message: "${messageText}"\nHistory Context: "${history || "None"}"` }
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
