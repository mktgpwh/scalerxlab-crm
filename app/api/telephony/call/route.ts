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

    // 3. Validation & Sanitization
    const rawTarget = lead.phone || lead.whatsappNumber;
    if (!rawTarget) {
      return NextResponse.json({ error: "Customer has no registered phone number" }, { status: 400 });
    }

    if (!agent.phone) {
      return NextResponse.json({ 
        error: "Hardware missing", 
        description: "Your physical phone number is not registered in the system. Update your profile first." 
      }, { status: 403 });
    }

    const targetPhone = sanitizePhoneNumber(rawTarget);
    const agentPhone = sanitizePhoneNumber(agent.phone);

    if (!lead.consentFlag) {
      return NextResponse.json({ 
        error: "Compliance Block", 
        description: "No DPDPA consent found for this record." 
      }, { status: 403 });
    }

    // 4. Initiate Tata Bridge
    const virtualNumber = process.env.TATA_SMARTFLO_VIRTUAL_NUMBER || "DEFAULT_VNS";
    
    // Log the sanitized handshake attempt (Internal)
    console.log(`[HANDSHAKE_START] ${agentPhone} -> ${targetPhone} via ${virtualNumber}`);

    try {
      const tataResponse = await tataClient.makeCall({
        to: targetPhone,
        from: virtualNumber,
        agentId: agentPhone, // Leg A (Sanitized)
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
    } catch (tataError: any) {
        // Log the specific Tata API failure to activity log for transparency
        await prisma.activityLog.create({
            data: {
                leadId: lead.id,
                userId: agent.id,
                action: "TELEPHONY_FAILURE",
                description: `Handshake failed: ${tataError.message}`,
                metadata: {
                    error: tataError.message,
                    agentPhone,
                    targetPhone
                }
            }
        });
        throw tataError; // Let outer catch format it
    }

  } catch (error: any) {
    console.error("[TELEPHONY_HANDSHAKE_FATAL]", error.message);
    return NextResponse.json({ 
      error: "Telephony Handshake Failed", 
      description: error.message 
    }, { status: 500 });
  }
}
