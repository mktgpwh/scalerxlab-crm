import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { tataClient } from "@/lib/telephony/tata-client";

export const dynamic = "force-dynamic";

/**
 * Sanitizes phone numbers for Tata Smartflo (Strict 91 prefix, no +, no spaces)
 */
function sanitizePhoneNumber(phone: string): string {
  // Strip all non-numeric characters
  const clean = phone.replace(/\D/g, "");
  
  // If exactly 10 digits, assume India and prefix with 91
  if (clean.length === 10) {
    return `91${clean}`;
  }
  
  return clean;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Session & Auth Check
    const session = await auth();
    if (!session?.user?.id) {
      console.error("[TELEPHONY_SECURITY_BLOCK] No session found");
      return NextResponse.json({ 
        error: "Access Denied", 
        description: "Your session node is inactive. Please re-authenticate." 
      }, { status: 401 });
    }

    const { leadId } = await req.json();
    if (!leadId) {
      return NextResponse.json({ 
        error: "Target Missing", 
        description: "Lead ID is required for bridge initiation." 
      }, { status: 400 });
    }

    // 2. Data Retrieval (Lead & Agent)
    const [lead, agent] = await Promise.all([
      prisma.lead.findUnique({ where: { id: leadId }, include: { branch: true } }),
      prisma.user.findUnique({ where: { id: session.user.id } })
    ]);

    if (!lead) {
      console.error(`[TELEPHONY_DATA_ERROR] Lead ${leadId} not found`);
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    if (!agent) {
      console.error(`[TELEPHONY_DATA_ERROR] Agent ${session.user.id} profile unreachable`);
      return NextResponse.json({ error: "Agent profile unreachable" }, { status: 404 });
    }

    // 3. Validation & Sanitization
    const rawTarget = lead.phone || lead.whatsappNumber;
    if (!rawTarget) {
      return NextResponse.json({ 
        error: "Target Offline", 
        description: "Lead has no registered phone or backup WhatsApp node." 
      }, { status: 400 });
    }

    if (!agent.phone) {
      return NextResponse.json({ 
        error: "Hardware Missing", 
        description: "Your physical phone number is not registered. Update your identity matrix profile." 
      }, { status: 403 });
    }

    const targetPhone = sanitizePhoneNumber(rawTarget);
    const agentPhone = sanitizePhoneNumber(agent.phone);

    if (!lead.consentFlag) {
      return NextResponse.json({ 
        error: "Compliance Lock", 
        description: "DPDPA Sovereignty Protocol is ACTIVE. Override required." 
      }, { status: 403 });
    }

    // 4. Initiate Tata Bridge
    const virtualNumber = process.env.TATA_SMARTFLO_VIRTUAL_NUMBER || "DEFAULT_VNS";
    
    console.log(`[TELEPHONY_HANDSHAKE_INIT] Agent:${agentPhone} -> Lead:${targetPhone} via VNS:${virtualNumber}`);

    try {
      const tataResponse = await tataClient.makeCall({
        to: targetPhone,
        from: virtualNumber,
        agentId: agentPhone, 
        organizationId: lead.tenantId || "default",
        uui: `lead_${lead.id}`
      });

      // 5. Persist Call Log
      const callLog = await prisma.callLog.create({
        data: {
          leadId: lead.id,
          agentId: agent.id,
          tataCallId: tataResponse.callId,
          callerId: virtualNumber,
          receiverId: targetPhone,
          direction: "OUTBOUND",
          status: "CONNECTED",
          metadata: {
              initiatedAt: new Date().toISOString(),
              provider: "TATA_SMARTFLO",
              branch: lead.branch?.name || "Global"
          }
        }
      });

      return NextResponse.json({
        success: true,
        callId: callLog.id,
        message: "Handshake Successful. Dialing your device (Leg A)..."
      });
    } catch (tataError: any) {
        console.error(`[TELEPHONY_HANDSHAKE_FAILED] ${tataError.message}`);
        
        await prisma.activityLog.create({
            data: {
                leadId: lead.id,
                userId: agent.id,
                action: "TELEPHONY_FAILURE",
                description: `Handshake rejected by provider: ${tataError.message}`,
                metadata: { error: tataError.message }
            }
        });

        return NextResponse.json({ 
          error: "Protocol Bridge Failure", 
          description: tataError.message 
        }, { status: 502 });
    }

  } catch (error: any) {
    console.error("[TELEPHONY_HANDSHAKE_FATAL]", error.message);
    return NextResponse.json({ 
      error: "Telephony Handshake Failed", 
      description: error.message 
    }, { status: 500 });
  }
}
