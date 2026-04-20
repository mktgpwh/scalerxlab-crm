import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processWithAgentX } from "@/lib/ai/agentx";
import { generateProactiveDraft } from "@/lib/ai/proactive";
import { assignIncomingLead } from "@/lib/routing/lead-assignment";
import { evaluateLead } from "@/lib/ai/scoring";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("[WATI_WEBHOOK] Incoming Payload:", JSON.stringify(payload, null, 2));

    // WATI payload format: typically includes sender/waId and text/message
    // Robust extraction strategy for waId
    const waId = payload.waId || payload.sender || payload.from || payload.senderNumber;
    
    // Robust extraction strategy for messageText
    const messageText = payload.text || payload.message || payload.body || payload.customText || payload.answer || "";
    
    // Detection for event type
    const eventType = payload.eventType || payload.event_type || payload.type || "message";

    // WATI Direction detection
    const isOutgoing = eventType === "sentMessage" || eventType === "repliedMessage" || eventType === "sent" || payload.direction === "outbound";
    const actionType = isOutgoing ? "CLINIC_MESSAGE_SENT" : "MESSAGE_RECEIVED";

    if (!waId) {
      console.warn("[WATI_WEBHOOK] Payload missing waId or sender identifier.");
      return NextResponse.json({ error: "Missing identity identifier in payload" }, { status: 400 });
    }

    // Special handling for media and status updates
    const isMedia = ["image", "video", "audio", "document", "sticker", "location", "contact", "voice"].includes(eventType);
    
    // Status updates (read/delivered) should still be acknowledged silently
    if ((eventType === "read" || eventType === "delivered") && !isMedia) {
       return NextResponse.json({ success: true, detail: "Status update acknowledged" });
    }

    // If it's a valid message but has no text (e.g. captionless image), assign a placeholder for database safety
    let processedMessageText = messageText;
    if (!processedMessageText && (eventType === "message" || isMedia)) {
       processedMessageText = `[Patient sent an ${eventType === "message" ? "attachment" : eventType}]`;
    }

    // Final guard: If we still have no text and it's not a sentient event, return early
    if (!waId || (!processedMessageText && eventType !== "sentMessage")) {
      return NextResponse.json({ error: "No message context found" }, { status: 400 });
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
          },
      });
    }

    // 1b. Strategic AI Pipeline (Consolidated 24/7 Gatekeeper)
    // We now run a single unified pass for Scoring, Heat Mapping, and Speciality
    if (lead && !isOutgoing && !isMedia) {
        try {
            await generateProactiveDraft({ leadId: lead.id, messageText: processedMessageText });
            // Refresh lead state to get the new AI-driven signals
            lead = await prisma.lead.findUnique({ where: { id: lead.id } }) as any;
        } catch (aiError: any) {
            console.error("⚠️ [WATI_WEBHOOK] AI Analysis delayed or rate-limited:", aiError.message);
            // Non-blocking: continue with lead creation even if AI fails
        }
    }

    // 1c. Trigger Quality-Gated Assignment for Ownerless Leads
    if (lead && !lead.ownerId) {
      await assignIncomingLead(lead.id);
      // Refresh lead state after potential routing update
      lead = await prisma.lead.findUnique({ where: { id: lead.id } }) as any;
    }

    if (!lead) return NextResponse.json({ error: "Lead processing failure" }, { status: 500 });

    // Deduplication check: ignore if the exact same message was logged within the last 30 seconds
    const timeThreshold = new Date(Date.now() - 30000);
    const duplicate = await prisma.activityLog.findFirst({
      where: {
        leadId: lead.id,
        description: processedMessageText,
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
        description: processedMessageText,
        metadata: {
          messageText: processedMessageText,
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
    if (!isOutgoing && !isMedia) {
      if (lead.aiChatStatus === "AGENTX_ACTIVE") {
          console.log(`[AGENTX_HANDOFF] Processing message for Lead ${lead.id}: "${processedMessageText}"`);
          // Awaiting here is usually safe for short AI calls, Next.js serverless limits allow up to 10s or 60s
          await processWithAgentX(lead.id, processedMessageText, cleanWaId);
      }
    }
 else if (!isOutgoing && isMedia) {
      console.log(`[WATI_WEBHOOK] Media captured for Lead ${lead.id}. Skipping AI processing.`);
    }

    return NextResponse.json({ success: true, leadId: lead.id });

  } catch (error) {
    console.error("[WATI_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

