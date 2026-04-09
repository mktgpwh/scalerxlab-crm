import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreLead } from "@/lib/ai/intent-scorer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    const { 
      organizationId,
      name, 
      email, 
      phone, 
      whatsappNumber,
      source = "WEBSITE_FORM", 
      metadata = {},
      consentFlag = false,
      consentMethod = "Webhook",
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content
    } = payload;

    const validSources = ["META_ADS", "GOOGLE_ADS", "INSTAGRAM_ADS", "TIKTOK_ADS", "LINKEDIN_ADS", "WEBSITE_FORM", "WHATSAPP", "WALK_IN", "REFERRAL", "OTHER"];
    const safeSource = validSources.includes(source) ? source : "OTHER";

    if (!organizationId || !name || (!email && !phone && !whatsappNumber)) {
      return NextResponse.json(
        { error: "Missing required fields (organizationId, name, and at least one contact method)" },
        { status: 400 }
      );
    }

    // Embed UTM parameters securely into metadata alongside any existing metadata
    const enrichedMetadata = {
      ...(typeof metadata === 'object' ? metadata : {}),
      utm: {
        source: utm_source || null,
        medium: utm_medium || null,
        campaign: utm_campaign || null,
        term: utm_term || null,
        content: utm_content || null,
      }
    };

    // 1. Create Lead in the Database immediately to return a fast 200 OK
    const lead = await prisma.lead.create({
      data: {
        organizationId,
        name,
        email,
        phone,
        whatsappNumber,
        source: safeSource,
        metadata: enrichedMetadata,
        consentFlag: Boolean(consentFlag),
        consentTimestamp: consentFlag ? new Date() : null,
        consentMethod: consentFlag ? consentMethod : null,
        dataRetentionExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 3)), 
      },
    });

    // 2. We resolve the AI trigger natively returning the payload instantly but 
    // technically if vercel deployments suspend after response we must await it.
    // For scaffolding robust integrations, we await mapping to keep data consistent initially.
    try {
      const scoringEngineResult = await scoreLead({
        name: lead.name,
        source: lead.source,
        metadata: lead.metadata,
      });

      if (scoringEngineResult && scoringEngineResult.score !== undefined) {
        
        let mappedIntent: "HOT" | "WARM" | "COLD" | "UNSCORED" = "UNSCORED";
        if (scoringEngineResult.intent === 'HIGH') mappedIntent = 'HOT';
        else if (scoringEngineResult.intent === 'MEDIUM') mappedIntent = 'WARM';
        else if (scoringEngineResult.intent === 'LOW') mappedIntent = 'COLD';
        else mappedIntent = scoringEngineResult.intent as "HOT"|"WARM"|"COLD";

        const mappedCategory = ["MATERNITY", "GYNECOLOGY", "INFERTILITY", "OTHER"].includes(scoringEngineResult.category) 
          ? scoringEngineResult.category 
          : "OTHER";

        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            aiScore: scoringEngineResult.score,
            intent: mappedIntent,
            category: mappedCategory,
            aiNotes: scoringEngineResult.reasoning,
            aiScoredAt: new Date(),
          }
        });

        // Broadcast if HOT lead
        if (mappedIntent === 'HOT') {
            await supabase
              .channel('global_notifications')
              .send({
                type: 'broadcast',
                event: 'HOT_LEAD',
                payload: { name: lead.name, score: scoringEngineResult.score, orgId: organizationId },
              });
        }

        // Auto Nurture Queue if WARM lead
        if (mappedIntent === 'WARM') {
            await prisma.autoNurtureQueue.create({
               data: {
                 leadId: lead.id,
                 organizationId: organizationId,
                 scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // Add to queue for next day
               }
            });
        }
      }
    } catch (scoringError) {
      console.error("[GROQ_SCORING_ERROR] Failed to score lead:", scoringError);
    }

    // Return the response
    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });

  } catch (error) {
    console.error("[WEBHOOK_LEADS_ERROR]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
