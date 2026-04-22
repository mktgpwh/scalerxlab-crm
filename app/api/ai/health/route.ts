import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";

export async function GET() {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.error("[AI_HEALTH_ERROR] Missing GROQ_API_KEY");
      return NextResponse.json({ 
        error: "Configuration Incomplete", 
        description: "The GROQ_API_KEY is missing from the environment nodes." 
      }, { status: 500 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const [totalLeads, hotLeads, convertedLeads, callStats] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { intent: 'HOT' } }),
      prisma.lead.count({ where: { status: 'WON' } }),
      prisma.callLog.groupBy({
        by: ['status'],
        _count: { _all: true }
      })
    ]);

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are AgentX, a Sovereign Business Intelligence Core for ScalerX Hub. Develop a "Mission Narrative" summary based on the provided stats. Use a professional, slightly futuristic, and analytical tone. Format your response in clean Markdown. Include insights on conversion velocity, lead intent ratios, and specialized funnel pressure. Keep it under 250 words.`
        },
        {
          role: "user",
          content: JSON.stringify({ totalLeads, hotLeads, convertedLeads, callStats })
        }
      ],
      max_tokens: 600
    });

    return NextResponse.json({
      narrative: completion.choices[0]?.message?.content || "Intelligence stream stabilized. Matrix initialized.",
      status: hotLeads > totalLeads * 0.2 ? "GOOD" : "MODERATE"
    });

  } catch (error: any) {
    console.error("[AI_HEALTH_ERROR]", error);
    return NextResponse.json({ 
      error: "Synaptic Failure", 
      description: error.message || "Unknown error during intelligence stream aggregation."
    }, { status: 500 });
  }
}
