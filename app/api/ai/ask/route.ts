import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Fetch context for the AI
    const [totalLeads, branchStats, recentLeads] = await Promise.all([
      prisma.lead.count(),
      prisma.branch.findMany({
        where: { isActive: true },
        select: { name: true, _count: { select: { leads: true } } }
      }),
      prisma.lead.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { source: true, category: true, intent: true }
      })
    ]);

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are AgentX, the Sovereign AI interface for ScalerX Lab. You have access to real-time clinical and business data. Answer executive queries with precision, focusing on trends, center performance, and ROI. Do not reveal PII. Use a professional, futuristic, and helpful tone. 
          Current Matrix Context:
          - Total Active Signals: ${totalLeads}
          - Regional Distribution: ${JSON.stringify(branchStats)}
          - Recent Acquisitions: ${JSON.stringify(recentLeads)}`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 1000
    });

    return NextResponse.json({
      answer: completion.choices[0]?.message?.content || "AgentX synaptic misfire. Please re-query the matrix."
    });

  } catch (error) {
    console.error("[AI_ASK_ERROR]", error);
    return NextResponse.json({ error: "Intelligence sync interrupted" }, { status: 500 });
  }
}
