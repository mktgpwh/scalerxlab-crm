import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateProactiveDraft } from "@/lib/ai/proactive";

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

        // 1. Detection: Event vs Inbound
        const eventType = body.eventType || "message_received";
        const senderId = body.waId || body.from || body.senderId || body.to; // Normalize IDs
        const text = body.text || body.message?.text || body.messageText || "";
        
        if (!senderId) {
            console.warn("⚠️ [WATI] Skipping payload without ID");
            return new Response("No ID", { status: 200 });
        }

        // 2. Lead Discovery
        let lead = await prisma.lead.findFirst({
            where: {
                OR: [{ whatsappNumber: senderId }, { phone: senderId }]
            }
        });

        // 3. Routing by Event
        if (eventType === "sent_message_delivered" || eventType === "sent_message_delivered_v2") {
            console.log(`✅ [WATI_STATUS] Delivered to ${senderId}`);
            if (lead) {
                await prisma.activityLog.create({
                    data: {
                        leadId: lead.id,
                        action: "WHATSAPP_DELIVERED",
                        description: `Message successfully received by patient.`,
                        metadata: { source: "WATI", status: "DELIVERED", raw: body }
                    }
                });
            }
            return new Response("EVENT_ACK", { status: 200 });
        }

        if (eventType === "session_message_failed" || eventType === "template_message_failed") {
            const errorReason = body.data?.message || body.message || "Unknown Provider Error";
            console.error(`🚨 [WATI_STATUS] Failure for ${senderId}: ${errorReason}`);
            if (lead) {
                await prisma.activityLog.create({
                    data: {
                        leadId: lead.id,
                        action: "CLINICAL_DISPATCH_FAILED",
                        description: `DELIVERY ERROR: ${errorReason}`,
                        metadata: { source: "WATI", status: "FAILED", error: body }
                    }
                });
            }
            return new Response("EVENT_ACK", { status: 200 });
        }

        // 4. Handle Inbound Message (Source: WHATSAPP/WATI)
        if (!lead) {
            const idSuffix = senderId.slice(-4);
            const fallbackName = `Pahlajani Patient - ${idSuffix}`;
            const senderName = body.senderName || body.contactName || "WhatsApp Patient";

            console.log(`🆕 [WATI] Creating New Clinical Lead: ${senderId}`);
            lead = await prisma.lead.create({
                data: {
                    name: senderName === "WhatsApp Patient" ? fallbackName : senderName,
                    source: "WHATSAPP", // Strictly WHATSAPP for Lead Table filtering
                    status: "RAW",
                    whatsappNumber: senderId,
                    metadata: {
                        externalId: senderId,
                        platform: "whatsapp",
                        isWati: true,
                        isAd: !!body.referral,
                        adId: body.referral?.ad_id,
                        adHeadline: body.referral?.headline,
                        adBody: body.referral?.body,
                        adSource: body.referral?.ad_name || "Direct WhatsApp",
                        referral: body.referral,
                        lastInteraction: new Date().toISOString()
                    }
                }
            });

            // ✅ Lead created — log it
            console.log(`✅ [WATI] Lead created: ${lead.id} for ${senderId}`);
        } else {
             console.log(`🔄 [WATI] Updating Existing Clinical Lead: ${lead.id}`);
             // Ensure source is updated if it was previously something else or generic
             await prisma.lead.update({
                 where: { id: lead.id },
                 data: {
                     source: "WHATSAPP",
                     metadata: {
                         ...(lead.metadata as any || {}),
                         isActive: true,
                         isWati: true,
                         lastInteraction: new Date().toISOString()
                     }
                 }
             });
        }

        // 5. Finalize Inbound Log & AI Synthesis
        if (text) {
            await prisma.activityLog.create({
                data: {
                    leadId: lead.id,
                    action: "WHATSAPP_MSG_RECEIVED",
                    description: text,
                    metadata: { source: "WATI", raw: body }
                }
            });

            // Non-blocking AI Draft — failure here must NOT abort lead creation
            try {
                await generateProactiveDraft({
                    leadId: lead.id,
                    messageText: text,
                    category: lead.category
                });
            } catch (aiErr) {
                console.warn(`⚠️ [WATI] AI draft skipped for ${lead.id}:`, aiErr);
            }
        }

        return new Response("WATI_PROCESSED", { status: 200 });
    } catch (error) {
        console.error("💥 [WATI_WEBHOOK_FATAL]", error);
        return new Response("Internal Error", { status: 500 });
    }
}
