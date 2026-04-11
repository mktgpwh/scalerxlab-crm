import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import Groq from "groq-sdk";
import { fetchIntelligenceAggregates } from "@/lib/ai/intelligence-data";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const data = await fetchIntelligenceAggregates();

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are AgentX, the clinical intelligence console. 
          The user is an executive asking questions about the hospital's lead matrix and business health.
          
          ANALYTICS CONTEXT:
          ${JSON.stringify(data)}
          
          RULES:
          1. Answer questions ONLY based on the provided aggregate statistics.
          2. NEVER reveal patient names or contact info (none is provided in context for safety).
          3. If the user asks for center comparisons, use the data to provide objective insights.
          4. Keep responses concise and data-driven.`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.1, // low temperature for analytical precision
      max_tokens: 500
    });

    return NextResponse.json({
      answer: completion.choices[0]?.message?.content || null
    });

  } catch (error) {
    console.error("[AI_ASK_ERROR]", error);
    return NextResponse.json({ error: "AgentX offline. Matrix connection failure." }, { status: 500 });
  }
}
