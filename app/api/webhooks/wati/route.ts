import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateProactiveDraft } from "@/lib/ai/proactive";
import { fetchMetaUserProfile } from "@/lib/ai/dispatch";

/**
 * WATI WEBHOOK GATEWAY
 * Captures WhatsApp messages and mirrors CTWA Ad Referral Data.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    console.log("🚀 [WATI_WEBHOOK] PAYLOAD_RECEIVED");
    try {
        const body = await req.json();
        console.log("📦 [WATI_PAYLOAD]", JSON.stringify(body, null, 2));

        // 1. Core Data Extraction
        // WATI payloads vary, but typically: waId (phone), text, senderName, referral
        const senderId = body.waId || body.from;
        const text = body.text || body.message?.text || "";
        const senderName = body.senderName || body.contactName || "WhatsApp Patient";
        const referral = body.referral || body.message?.referral || null;

        if (!senderId) {
            console.error("🚨 [WATI] Missing Sender ID (waId)");
            return new Response("Missing Sender ID", { status: 400 });
        }

        // 2. Lead Orchestration
        let lead = await prisma.lead.findFirst({
            where: {
                OR: [
                    { whatsappNumber: senderId },
                    { phone: senderId },
                    { metadata: { path: ['externalId'], equals: senderId } }
                ]
            }
        });

        if (!lead) {
            console.log(`🌱 [WATI] New Clinical Lead: ${senderId}`);
            
            // Initial Fallback Name
            const suffix = senderId.slice(-4);
            const defaultName = `Pahlajani Patient - ${suffix}`;

            lead = await prisma.lead.create({
                data: {
                    name: senderName === "WhatsApp Patient" ? defaultName : senderName,
                    source: "WHATSAPP",
                    status: "RAW",
                    whatsappNumber: senderId,
                    metadata: {
                        externalId: senderId,
                        platform: "whatsapp",
                        isWati: true,
                        referral: referral, // CTWA Ad Data
                        lastInteraction: new Date().toISOString()
                    }
                }
            });

            // Identity Enrichment attempt (Meta API might not have WAIDs, but we check)
            const enrichment = await fetchMetaUserProfile(senderId, 'facebook');
            if (enrichment.success && !enrichment.name.includes('Pahlajani Patient')) {
                lead = await prisma.lead.update({
                    where: { id: lead.id },
                    data: { name: enrichment.name }
                });
            }
        } else {
            console.log(`🎯 [WATI] Existing Lead Found: ${lead.id}`);
            // Update metadata with latest referral if present
            if (referral) {
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: {
                        metadata: {
                            ...(lead.metadata as any || {}),
                            referral: referral
                        }
                    }
                });
            }
        }

        // 3. Log Clinical Activity
        await prisma.activityLog.create({
            data: {
                leadId: lead.id,
                action: "WHATSAPP_MSG_RECEIVED",
                description: text,
                metadata: { source: "WATI", raw: body }
            }
        });

        // 4. Trigger AgentX Synthesis
        await generateProactiveDraft({
            leadId: lead.id,
            messageText: text,
            category: lead.category
        });

        return new Response("WATI_PROCESSED", { status: 200 });
    } catch (error) {
        console.error("💥 [WATI_WEBHOOK_FATAL]", error);
        return new Response("Internal Error", { status: 500 });
    }
}
