import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processWithAgentX } from "@/lib/ai/agentx";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("[WATI_WEBHOOK] Incoming Payload:", JSON.stringify(payload, null, 2));

    // WATI payload format: typically includes sender/waId and text/message
    const waId = payload.waId || payload.sender || payload.from;
    const messageText = payload.text || payload.message || payload.body;

    if (!waId || !messageText) {
      return NextResponse.json({ error: "Missing sender or message in payload" }, { status: 400 });
    }

    // Ensure waId is numeric
    const cleanWaId = waId.replace(/\D/g, ''); 

    // 1. Find or create the lead by whatsappNumber
    let lead = await prisma.lead.findFirst({
      where: { whatsappNumber: cleanWaId },
    });

    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          name: `WhatsApp User (${cleanWaId.slice(-4)})`,
          whatsappNumber: cleanWaId,
          source: "WHATSAPP",
          status: "RAW",
          aiChatStatus: "AGENTX_ACTIVE",
        },
      });
    }

    // 2. Log Activity
    await prisma.activityLog.create({
      data: {
        leadId: lead.id,
        action: "MESSAGE_RECEIVED",
        description: "Received incoming WhatsApp message via WATI",
        metadata: {
          messageText,
          rawPayload: payload,
        },
      },
    });

    // 3. AgentX Handoff
    if (lead.aiChatStatus === "AGENTX_ACTIVE") {
      console.log(`[AGENTX_HANDOFF] Processing message for Lead ${lead.id}: "${messageText}"`);
      // Awaiting here is usually safe for short AI calls, Next.js serverless limits allow up to 10s or 60s
      await processWithAgentX(lead.id, messageText, cleanWaId);
    }

    return NextResponse.json({ success: true, leadId: lead.id });

  } catch (error) {
    console.error("[WATI_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

