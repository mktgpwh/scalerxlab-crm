import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processWithAgentX } from "@/lib/ai/agentx";
import { generateProactiveDraft } from "@/lib/ai/proactive";
import { distributeLead } from "@/lib/leads/distributor";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("[WATI_WEBHOOK] Incoming Payload:", JSON.stringify(payload, null, 2));

    // WATI payload format: typically includes sender/waId and text/message
    const waId = payload.waId || payload.sender || payload.from;
    const messageText = payload.text || payload.message || payload.body || payload.customText;
    const eventType = payload.eventType || payload.event_type || payload.type || "message";

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
      const extractedName = payload.senderName || payload.pushName || payload.contact?.name || payload.profileName || `WhatsApp User (${cleanWaId.slice(-4)})`;
      
      lead = await prisma.lead.create({
        data: {
          name: extractedName,
          whatsappNumber: cleanWaId,
          source: "WHATSAPP",
          status: "RAW",
          aiChatStatus: "AGENTX_ACTIVE",
        },
      });

      // Distribute lead immediately after creation
      await distributeLead(lead.id);
    }

    // WATI Direction detection
    const isOutgoing = eventType === "sentMessage" || eventType === "repliedMessage" || eventType === "sent" || payload.direction === "outbound";
    const actionType = isOutgoing ? "CLINIC_MESSAGE_SENT" : "MESSAGE_RECEIVED";

    // Deduplication check: ignore if the exact same message was logged within the last 30 seconds
    const timeThreshold = new Date(Date.now() - 30000);
    const duplicate = await prisma.activityLog.findFirst({
      where: {
        leadId: lead.id,
        description: messageText,
        createdAt: { gte: timeThreshold }
      }
    });

    if (duplicate) {
      console.log(`[WATI_WEBHOOK] Suppressed duplicate message for lead ${lead.id}`);
      return NextResponse.json({ success: true, detail: "Duplicate suppressed" });
    }

    // 2. Log Activity
    await prisma.activityLog.create({
      data: {
        leadId: lead.id,
        action: actionType,
        description: messageText,
        metadata: {
          messageText,
          rawPayload: payload,
          eventType,
          isOutgoing
        },
      },
    });

    // 3. Auto-manage AI Status & Bump updatedAt for Sorting
    let aiStatusToSet = lead.aiChatStatus;
    if (isOutgoing && aiStatusToSet === "AGENTX_ACTIVE") {
        aiStatusToSet = "HUMAN_OVERRIDE"; // Pause AI naturally if human replies via WATI app
    }

    await prisma.lead.update({
        where: { id: lead.id },
        data: { 
            updatedAt: new Date(), 
            aiChatStatus: aiStatusToSet,
            ...(isOutgoing ? { isEscalated: false } : {}) // Clear escalation if human responds
        }
    });

    // 4. AgentX Handoff (Only for incoming messages)
    if (!isOutgoing) {
      // Run Proactive Scoring (Heat Mapping)
      await generateProactiveDraft({ leadId: lead.id, messageText });

      if (lead.aiChatStatus === "AGENTX_ACTIVE") {
          console.log(`[AGENTX_HANDOFF] Processing message for Lead ${lead.id}: "${messageText}"`);
          // Awaiting here is usually safe for short AI calls, Next.js serverless limits allow up to 10s or 60s
          await processWithAgentX(lead.id, messageText, cleanWaId);
      }
    }

    return NextResponse.json({ success: true, leadId: lead.id });

  } catch (error) {
    console.error("[WATI_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

