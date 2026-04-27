import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateProactiveDraft } from "@/lib/ai/proactive";
import { assignIncomingLead } from "@/lib/routing/lead-assignment";

export const dynamic = 'force-dynamic';

function cleanPhone(phone?: string) {
    if (!phone) return null;
    return phone.replace(/\D/g, "");
}

export async function POST(req: Request) {
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

    const cPhone = cleanPhone(phone);
    const cWhatsapp = cleanPhone(whatsappNumber);

    // 🛡️ Collision Guard: Prevent Duplicate Lead Capture
    let lead = await prisma.lead.findFirst({
        where: {
            OR: [
                ...(cPhone ? [{ phone: cPhone }] : []),
                ...(cWhatsapp ? [{ whatsappNumber: cWhatsapp }] : []),
                ...(email ? [{ email }] : [])
            ]
        }
    });

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

    if (lead) {
        // Update existing lead instead of creating duplicate
        lead = await prisma.lead.update({
            where: { id: lead.id },
            data: {
                metadata: {
                    ...(lead.metadata as any || {}),
                    ...enrichedMetadata
                },
                source: lead.source === "OTHER" ? safeSource : lead.source
            }
        });
        console.log(`♻️ [COLLISION_HANDLED] Updated existing lead: ${lead.id}`);
    } else {
        // Create new lead signal
        lead = await prisma.lead.create({
            data: {
                name,
                email,
                phone: cPhone,
                whatsappNumber: cWhatsapp,
                source: safeSource,
                metadata: enrichedMetadata,
                consentFlag: Boolean(consentFlag),
                consentTimestamp: consentFlag ? new Date() : null,
                consentMethod: consentFlag ? consentMethod : null,
                dataRetentionExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 3)),
            },
        });
        console.log(`🌱 [NEW_LEAD] Captured via ${safeSource}: ${lead.id}`);
        
        // 🚀 Trigger Autonomous Distribution for NEW leads
        await assignIncomingLead(lead.id);
    }

    // 🚀 Strategic AI Pipeline (Unified Gatekeeper)
    // Extracts message context from metadata if available (e.g. from a form 'requirement' field)
    const contextMessage = (payload.message || payload.requirement || payload.notes || "New inquiry via platform form.");
    
    try {
        await generateProactiveDraft({ 
            leadId: lead.id, 
            messageText: contextMessage 
        });
    } catch (aiError) {
        console.error("🛑 [LEAD_WEBHOOK_AI_ERROR]", aiError);
    }

    return NextResponse.json({ success: true, leadId: lead.id }, { status: lead ? 200 : 201 });

  } catch (error) {
    console.error("[WEBHOOK_LEADS_ERROR]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
