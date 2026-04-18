import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { tataClient } from "@/lib/telephony/tata-client";

/**
 * Click-to-Call API — Single-Tenant
 * Reads virtual number from env, no org lookup needed.
 */
export async function POST(req: Request) {
  try {
    const { leadId } = await req.json();

    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const targetPhone = lead.phone || lead.whatsappNumber;

    if (!targetPhone) {
      return NextResponse.json({ error: "Lead has no phone or whatsapp number" }, { status: 404 });
    }

    // DPDPA Consent Check
    if (!lead.consentFlag) {
      return NextResponse.json({ error: "DPDPA Consent Required" }, { status: 403 });
    }

    const virtualNumber = process.env.TATA_SMARTFLO_VIRTUAL_NUMBER || "DEFAULT_VNS";

    // Trigger Tata Smartflo
    const callResponse = await tataClient.makeCall({
      to: targetPhone,
      from: virtualNumber,
      organizationId: "singleton",
      agentId: "AGENT_001"
    });

    // Log Outgoing Call
    await prisma.callLog.create({
      data: {
        leadId: lead.id,
        callerId: virtualNumber,
        receiverId: targetPhone,
        direction: "OUTBOUND",
        status: "CONNECTED",
        duration: 0,
        isQualified: lead.intent === "HOT"
      }
    });

    return NextResponse.json(callResponse);

  } catch (error) {
    console.error("[MAKE_CALL_ERROR]", error);
    return NextResponse.json({ error: "Communication Failure" }, { status: 500 });
  }
}
