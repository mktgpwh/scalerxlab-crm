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
        const senderId = body.waId || body.from;
        const text = body.text || body.message?.text || "";
        const senderName = body.senderName || body.contactName || "WhatsApp Patient";
        const referral = body.referral || body.message?.referral || null;

        if (!senderId) {
            console.error("🚨 [WATI] Missing Sender ID (waId)");
            return new Response("Missing Sender ID", { status: 400 });
        }

        // 🛡️ [CLINICAL_IDENTITY]: Avoid "Meta Lead" naming
        const idSuffix = senderId.slice(-4);
        const fallbackName = `Pahlajani Patient - ${idSuffix}`;

        // 2. Lead Orchestration
        let lead = await prisma.lead.findFirst({
            where: {
                OR: [
                    { whatsappNumber: senderId },
                    { phone: senderId }
                ]
            }
        });

        if (!lead) {
            console.log(`🌱 [WATI] New Clinical Lead: ${senderId}`);
            
            lead = await prisma.lead.create({
                data: {
                    name: senderName === "WhatsApp Patient" ? fallbackName : senderName,
                    source: referral?.ad_name ? `AD: ${referral.ad_name}` : "WHATSAPP",
                    status: "RAW",
                    whatsappNumber: senderId,
                    metadata: {
                        externalId: senderId,
                        platform: "whatsapp",
                        isWati: true,
                        referral: referral, // Mirror Ad Data
                        lastInteraction: new Date().toISOString()
                    }
                }
            });

            // 🚀 [ENRICHMENT]: Trigger Identity Sequence
            const enrichment = await fetchMetaUserProfile(senderId, 'whatsapp');
            if (enrichment.success && enrichment.name !== fallbackName) {
                lead = await prisma.lead.update({
                    where: { id: lead.id },
                    data: { name: enrichment.name }
                });
            }
        } else {
            console.log(`🎯 [WATI] Existing Lead Found: ${lead.id}`);
            // Update metadata with latest referral & Ensure source is accurate if ad
            await prisma.lead.update({
                where: { id: lead.id },
                data: {
                    source: referral?.ad_name ? `AD: ${referral.ad_name}` : lead.source,
                    metadata: {
                        ...(lead.metadata as any || {}),
                        referral: referral || (lead.metadata as any)?.referral,
                        lastInteraction: new Date().toISOString()
                    }
                }
            });
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
