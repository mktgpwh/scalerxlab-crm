import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

/**
 * Tata Smartflo Telephony Webhook
 * Handles incoming call events, logs them, and broadcasts for the live UI.
 */
export async function POST(req: Request) {
  // Initialize Supabase inside handler to avoid build-time env errors
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const body = await req.json();
    console.log("[TATA_WEBHOOK] Incoming Payload:", JSON.stringify(body, null, 2));

    // 1. Identify organization and settings
    // Tata identifies the destination_number (VN). We map this to an organization.
    const virtualNumber = body.destination_number;
    const settings = await prisma.telephonySettings.findFirst({
      where: { tataVirtualNumber: virtualNumber },
      include: { organization: true }
    });

    if (!settings) {
        // Fallback for demo if precise VNS mapping isn't set up
        console.warn("[TATA_WEBHOOK] No settings found for VN:", virtualNumber);
        return NextResponse.json({ status: "ignored" });
    }

    const orgId = settings.organizationId;

    // 2. Identify the Lead
    const callerNumber = body.caller_number;
    let lead = await prisma.lead.findFirst({
      where: { 
        OR: [{ phone: callerNumber }, { whatsappNumber: callerNumber }],
        organizationId: orgId
      }
    });

    if (!lead && body.direction === "inbound") {
        lead = await prisma.lead.create({
            data: {
                name: `Caller ${callerNumber.slice(-4)}`,
                phone: callerNumber,
                organizationId: orgId,
                source: "REFERRAL", // Placeholder
                status: "RAW"
            }
        });
    }

    // 3. Check for AI Routing Toggle
    let routingAction = "AGENT_BRIDGE";
    if (settings.aiRoutingEnabled && body.direction === "inbound" && body.event === "call_initiated") {
        routingAction = "AI_FLOW";
        // Here you would respond with XML/JSON instructions for Tata to route to a SIP/AI bot
    }

    // 4. Log the Call
    const callLog = await prisma.callLog.create({
        data: {
            organizationId: orgId,
            leadId: lead?.id,
            callerId: callerNumber,
            receiverId: virtualNumber,
            direction: body.direction.toUpperCase() === "INBOUND" ? "INBOUND" : "OUTBOUND",
            status: body.status === "answered" ? "CONNECTED" : (body.status === "missed" ? "MISSED" : "CONNECTED"),
            duration: parseInt(body.duration || "0"),
            recordingUrl: body.recording_url,
            isAiHandled: routingAction === "AI_FLOW",
            isQualified: lead?.intent === "HOT" // Basic qualification logic
        }
    });

    // 5. Broadcast to LIVE UI via Supabase Realtime
    if (body.event === "call_initiated") {
        await supabaseAdmin.channel('global_notifications').send({
            type: 'broadcast',
            event: 'CALL_INCOMING',
            payload: {
                orgId: orgId,
                leadName: lead?.name || "New Patient",
                callerId: callerNumber,
                intent: lead?.intent || "WARM",
                score: lead?.aiScore || 0,
                callId: callLog.id
            }
        });
    }

    // 6. Respond to Tata (Mock XML/JSON response pattern)
    return NextResponse.json({
        status: "success",
        routing: routingAction,
        call_id: callLog.id
    });

  } catch (error) {
    console.error("[TATA_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
