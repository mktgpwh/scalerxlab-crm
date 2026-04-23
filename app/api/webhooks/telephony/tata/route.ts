import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { assignIncomingLead } from "@/lib/routing/lead-assignment";
import { createClient } from "@supabase/supabase-js";

/**
 * Tata Smartflo Telephony Webhook — Single-Tenant
 * No tenant routing needed. Any payload hitting this endpoint belongs to this CRM instance.
 */
export async function POST(req: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const body = await req.json();
    console.log("[TATA_WEBHOOK] Incoming Payload:", JSON.stringify(body, null, 2));

    const callerNumber = body.caller_number;
    const virtualNumber = body.destination_number || process.env.TATA_SMARTFLO_VIRTUAL_NUMBER;

    // Identify or auto-create the Lead
    let lead = await prisma.lead.findFirst({
      where: {
        OR: [{ phone: callerNumber }, { whatsappNumber: callerNumber }]
      }
    });

    if (!lead && body.direction === "inbound") {
      lead = await prisma.lead.create({
        data: {
          name: `Caller ${callerNumber.slice(-4)}`,
          phone: callerNumber,
          source: "SMARTFLO_CALL",
          status: "RAW"
        }
      });
      // Auto-distribute the lead
      await assignIncomingLead(lead.id);
    }

    // AI Routing check
    const aiRoutingEnabled = process.env.TATA_AI_ROUTING_ENABLED === "true";
    const routingAction = aiRoutingEnabled && body.direction === "inbound" && body.event === "call_initiated"
      ? "AI_FLOW" : "AGENT_BRIDGE";

    // Log the call
    const callLog = await prisma.callLog.create({
      data: {
        leadId: lead?.id,
        callerId: callerNumber,
        receiverId: virtualNumber || "UNKNOWN",
        direction: body.direction?.toUpperCase() === "INBOUND" ? "INBOUND" : "OUTBOUND",
        status: body.status === "answered" ? "CONNECTED" : body.status === "missed" ? "MISSED" : "CONNECTED",
        duration: parseInt(body.duration || "0"),
        recordingUrl: body.recording_url,
        isAiHandled: routingAction === "AI_FLOW",
        isQualified: lead?.intent === "HOT"
      }
    });

    // Broadcast to Live UI
    if (body.event === "call_initiated") {
      await supabaseAdmin.channel('global_notifications').send({
        type: 'broadcast',
        event: 'CALL_INCOMING',
        payload: {
          leadName: lead?.name || "New Patient",
          callerId: callerNumber,
          intent: lead?.intent || "WARM",
          score: lead?.aiScore || 0,
          callId: callLog.id
        }
      });
    }

    return NextResponse.json({ status: "success", routing: routingAction, call_id: callLog.id });

  } catch (error) {
    console.error("[TATA_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
