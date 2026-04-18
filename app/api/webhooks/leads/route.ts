import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreLead } from "@/lib/ai/intent-scorer";
import { createClient } from "@supabase/supabase-js";
import { assignIncomingLead } from "@/lib/routing/lead-assignment";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const payload = await req.json();

    const {
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

    if (!name || (!email && !phone && !whatsappNumber)) {
      return NextResponse.json(
        { error: "Missing required fields: name and at least one contact method" },
        { status: 400 }
      );
    }

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

    // Create lead directly — no tenant lookup needed
    const lead = await prisma.lead.create({
      data: {
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

    // 🚀 Trigger Autonomous Distribution
    await assignIncomingLead(lead.id);

    // AI Scoring
    try {
      const scoringResult = await scoreLead({
        name: lead.name,
        source: lead.source,
        metadata: lead.metadata,
      });

      if (scoringResult?.score !== undefined) {
        let mappedIntent: "HOT" | "WARM" | "COLD" | "UNSCORED" = "UNSCORED";
        if (scoringResult.intent === 'HIGH') mappedIntent = 'HOT';
        else if (scoringResult.intent === 'MEDIUM') mappedIntent = 'WARM';
        else if (scoringResult.intent === 'LOW') mappedIntent = 'COLD';
        else mappedIntent = scoringResult.intent as "HOT" | "WARM" | "COLD";

        const mappedCategory = ["MATERNITY", "GYNECOLOGY", "INFERTILITY", "OTHER"].includes(scoringResult.category)
          ? scoringResult.category : "OTHER";

        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            aiScore: scoringResult.score,
            intent: mappedIntent,
            category: mappedCategory,
            aiNotes: scoringResult.reasoning,
            aiScoredAt: new Date(),
          }
        });

        if (mappedIntent === 'HOT') {
          await supabase.channel('global_notifications').send({
            type: 'broadcast',
            event: 'HOT_LEAD',
            payload: { name: lead.name, score: scoringResult.score },
          });
        }

        if (mappedIntent === 'WARM') {
          await prisma.autoNurtureQueue.create({
            data: {
              leadId: lead.id,
              scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
            }
          });
        }
      }
    } catch (scoringError) {
      console.error("[GROQ_SCORING_ERROR]", scoringError);
    }

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });

  } catch (error) {
    console.error("[WEBHOOK_LEADS_ERROR]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
