import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import Groq from "groq-sdk";
import { fetchIntelligenceAggregates } from "@/lib/ai/intelligence-data";

export async function GET() {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const data = await fetchIntelligenceAggregates();

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are AgentX, the Sovereign Intelligence Analyst for ScalerX Clinical CRM. 
          Analyze the provided clinical business data and generate a high-level executive health summary.
          RULES:
          1. Use a professional, slightly futuristic, mission-command tone.
          2. Compare performance between clinical nodes (centers).
          3. Critique lead quality and conversion velocity.
          4. Format with clean sections: health pulse, center comparison, and urgent alerts.
          5. DO NOT mention any PII (no names, emails, phones).`
        },
        {
          role: "user",
          content: JSON.stringify(data)
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    return NextResponse.json({
      narrative: completion.choices[0]?.message?.content || null,
      data
    });

  } catch (error) {
    console.error("[AI_HEALTH_ERROR]", error);
    return NextResponse.json({ error: "Mission control linkage failure." }, { status: 500 });
  }
}
