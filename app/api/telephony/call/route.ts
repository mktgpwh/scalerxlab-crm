import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { tataClient } from "@/lib/telephony/tata-client";

export const dynamic = "force-dynamic";

/**
 * POST /api/telephony/call
 * Triggers a Bridge Call via Tata Smartflo
 * Payload: { leadId: string }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Session & Auth Check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { leadId } = await req.json();
    if (!leadId) {
      return NextResponse.json({ error: "Lead identifier required" }, { status: 400 });
    }

    // 2. Data Retrieval (Lead & Agent)
    const [lead, agent] = await Promise.all([
      prisma.lead.findUnique({ where: { id: leadId } }),
      prisma.user.findUnique({ where: { id: session.user.id } })
    ]);

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (!agent) return NextResponse.json({ error: "Agent profile unreachable" }, { status: 404 });

    // 3. Validation
    const targetPhone = lead.phone || lead.whatsappNumber;
    if (!targetPhone) return NextResponse.json({ error: "Customer has no registered phone number" }, { status: 400 });

    if (!agent.phone) {
      return NextResponse.json({ 
        error: "Hardware missing", 
        description: "Your physical phone number is not registered in the system. Update your profile first." 
      }, { status: 403 });
    }

    if (!lead.consentFlag) {
      return NextResponse.json({ 
        error: "Compliance Block", 
        description: "No DPDPA consent found for this record." 
      }, { status: 403 });
    }

    // 4. Initiate Tata Bridge
    const virtualNumber = process.env.TATA_SMARTFLO_VIRTUAL_NUMBER || "DEFAULT_VNS";
    
    const tataResponse = await tataClient.makeCall({
      to: targetPhone,
      from: virtualNumber,
      agentId: agent.phone, // Leg A
      organizationId: lead.tenantId,
      uui: `lead_${lead.id}` // Pass lead ID as context
    });

    // 5. Persist Call Log (State: PENDING CDR)
    const callLog = await prisma.callLog.create({
      data: {
        leadId: lead.id,
        agentId: agent.id,
        tataCallId: tataResponse.callId,
        callerId: virtualNumber,
        receiverId: targetPhone,
        direction: "OUTBOUND",
        status: "CONNECTED", // Initial state until webhook updates
        metadata: {
            initiatedAt: new Date().toISOString(),
            provider: "TATA_SMARTFLO"
        }
      }
    });

    return NextResponse.json({
      success: true,
      callId: callLog.id,
      message: "Dialing Leg A (Your Phone)... Please answer to connect to Lead."
    });

  } catch (error: any) {
    console.error("[TELEPHONY_CALL_ERROR]", error.message);
    return NextResponse.json({ 
      error: "Telephony Handshake Failed", 
      details: error.message 
    }, { status: 500 });
  }
}
