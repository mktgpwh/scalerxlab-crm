import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function scoreLead(leadData: Record<string, unknown>) {
  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: "Analyze the lead data provided. Return a JSON: { score: 0-100, intent: 'HIGH'|'MEDIUM'|'LOW', reasoning: 'string', category: 'MATERNITY'|'GYNECOLOGY'|'INFERTILITY'|'OTHER' }. Focus on medical urgency and accurate departmental mapping." },
      { role: "user", content: JSON.stringify(leadData) }
    ],
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" }
  });
  return JSON.parse(completion.choices[0].message.content || "{}");
}
