import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tataClient } from "@/lib/telephony/tata-client";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/smartflo
 * CDR (Call Detail Record) Ingestion Node
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("☎️ [SMARTFLO_WEBHOOK] CDR Payload Received:", payload.call_id);

    const cdr = tataClient.parseWebhook(payload);

    // 1. Attempt to match with an existing Outbound Trigger
    let existingLog = await prisma.callLog.findUnique({
      where: { tataCallId: cdr.tataCallId }
    });

    if (existingLog) {
      console.log(`✅ [SMARTFLO_WEBHOOK] Mapping CDR to existing log: ${existingLog.id}`);
      
      await prisma.callLog.update({
        where: { id: existingLog.id },
        data: {
          status: cdr.status,
          duration: cdr.duration,
          recordingUrl: cdr.recordingUrl,
          metadata: {
            ...(existingLog.metadata as any || {}),
            cdr_processed_at: new Date().toISOString(),
            raw_cdr: payload
          }
        }
      });
    } else {
      // 2. Discover Lead for Unsolicited/Inbound Call
      console.log(`📡 [SMARTFLO_WEBHOOK] Unrecognized Tata ID. Searching for lead by phone: ${cdr.from}`);
      
      // Clean phone numbers for lookup
      const cleanPhone = cdr.from.replace(/[^0-9]/g, "").slice(-10);
      
      let lead = await prisma.lead.findFirst({
        where: {
          OR: [
            { phone: { contains: cleanPhone } },
            { whatsappNumber: { contains: cleanPhone } }
          ]
        },
        orderBy: { updatedAt: "desc" }
      });

      // 3. Create fresh Record for the Timeline
      await prisma.callLog.create({
        data: {
          leadId: lead?.id || null,
          tataCallId: cdr.tataCallId,
          direction: cdr.direction as any,
          status: cdr.status,
          duration: cdr.duration,
          recordingUrl: cdr.recordingUrl,
          callerId: cdr.from,
          receiverId: cdr.to,
          metadata: {
            discovery: lead ? "PHONE_MATCH" : "ORPHAN_CALL",
            raw_cdr: payload
          }
        }
      });

      if (lead) {
          // Log as Activity for Visibility
          await prisma.activityLog.create({
              data: {
                  leadId: lead.id,
                  action: cdr.direction === "INBOUND" ? "INBOUND_CALL_RECEIVED" : "OUTBOUND_CALL_END",
                  description: `${cdr.direction} call ${cdr.status === 'CONNECTED' ? 'Answered' : 'Missed'}. Duration: ${cdr.duration}s.`,
                  metadata: { callId: cdr.tataCallId }
              }
          });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("💥 [SMARTFLO_WEBHOOK_ERROR]", error.message);
    return NextResponse.json({ error: "Webhook ingestion failed" }, { status: 500 });
  }
}
