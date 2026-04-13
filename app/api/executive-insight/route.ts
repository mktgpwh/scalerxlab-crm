import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";

export async function GET() {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const [totalLeads, ivfLeads, wonLeads] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { category: 'INFERTILITY' } }),
      prisma.lead.count({ where: { status: 'WON' } }),
    ]);

    const recentLeads = await prisma.lead.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: { source: true, intent: true, category: true, status: true }
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an executive medical intelligence analyst for ScalerX Business Suite. Analyze this data and provide a 2-sentence clinical insight about lead quality, conversion opportunities, or operational alerts. Be direct and actionable.`
        },
        {
          role: "user",
          content: JSON.stringify({ totalLeads, ivfLeads, wonLeads, recentLeads })
        }
      ],
      max_tokens: 150
    });

    return NextResponse.json({
      insight: completion.choices[0]?.message?.content || null,
      stats: { totalLeads, ivfLeads, wonLeads }
    });

  } catch (error) {
    console.error("[EXECUTIVE_INSIGHT_ERROR]", error);
    return NextResponse.json({ error: "Failed to generate insight" }, { status: 500 });
  }
}
