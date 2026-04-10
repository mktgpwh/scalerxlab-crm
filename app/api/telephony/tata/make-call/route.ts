import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tataClient } from "@/lib/telephony/tata-client";

/**
 * Click-to-Call API
 * Initiates an outbound call via Tata Smartflo and logs the event.
 */
export async function POST(req: Request) {
  try {
    const { leadId, organizationId } = await req.json();

    if (!leadId || !organizationId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // 1. Fetch lead and organization settings
    const [lead, settings] = await Promise.all([
      prisma.lead.findUnique({ where: { id: leadId } }),
      prisma.telephonySettings.findUnique({ where: { organizationId } })
    ]);

    if (!lead || !lead.phone) {
      return NextResponse.json({ error: "Lead not found or has no phone" }, { status: 404 });
    }

    // 2. DPDPA Consent Check (Enforced at API Level)
    if (!lead.consentFlag) {
      return NextResponse.json({ error: "DPDPA Consent Required" }, { status: 403 });
    }

    // 3. Trigger Tata Smartflo
    const callResponse = await tataClient.makeCall({
      to: lead.phone,
      from: settings?.tataVirtualNumber || "DEFAULT_VNS",
      organizationId: organizationId,
      agentId: "AGENT_001" // In production, get from session
    });

    // 4. Log Outgoing Call
    await prisma.callLog.create({
      data: {
        organizationId: organizationId,
        leadId: lead.id,
        callerId: settings?.tataVirtualNumber || "DEFAULT_VNS",
        receiverId: lead.phone,
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
