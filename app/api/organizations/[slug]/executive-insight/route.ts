import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // 1. Validate Org
    const organization = await prisma.organization.findUnique({
      where: { slug: slug },
      select: { id: true, name: true }
    });

    if (!organization) {
       return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // 2. Fetch Aggregated Metrics
    const [totalLeads, ivfLeads, wonLeads] = await Promise.all([
      prisma.lead.count({ where: { organizationId: organization.id } }),
      prisma.lead.count({ where: { organizationId: organization.id, category: 'INFERTILITY' } }),
      prisma.lead.count({ where: { organizationId: organization.id, status: 'WON' } })
    ]);

    const contextPayload = {
       totalCaptured: totalLeads,
       ivfPipeline: ivfLeads,
       enrolled: wonLeads,
       conversionRate: totalLeads > 0 ? (wonLeads / totalLeads * 100).toFixed(1) + '%' : '0%',
       target: "50 IVF procedures monthly"
    };

    // 3. Request Groq Strategic Output
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a strict, highly analytical Fractional CMO for ${organization.name}. 
          Analyze the live data given and provide an aggressive, succinct, 2-line strategic recommendation for the executive board. Focus on IVF scaling and conversion gaps. Do not use pleasantries. Output ONLY the 2 sentences.`
        },
        {
          role: "user",
          content: JSON.stringify(contextPayload)
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 150,
    });

    const insight = chatCompletion.choices[0]?.message?.content || "Pipeline processing. Awaiting sufficient data vectorization for strategic analysis.";

    return NextResponse.json({ insight, contextPayload });

  } catch (error) {
    console.error("[EXECUTIVE_INSIGHT_ERROR]", error);
    return NextResponse.json({ error: "Failed to generate AI Insight" }, { status: 500 });
  }
}
