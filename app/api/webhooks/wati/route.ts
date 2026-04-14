import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateProactiveDraft } from "@/lib/ai/proactive";
import { distributeLead } from "@/lib/leads/distributor";

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
        const wamiId = body.whatsappMessageId || body.id || "";
        
        if (!senderId) {
            console.warn("⚠️ [WATI] Skipping payload without ID");
            return new Response("No ID", { status: 200 });
        }

        // 🚀 [PHASE 5]: Intelligence - Check for Duplicates
        if (wamiId) {
            const existingLog = await prisma.activityLog.findFirst({
                where: { metadata: { path: ['raw', 'whatsappMessageId'], equals: wamiId } }
            });
            if (existingLog) {
                console.log(`⏭️ [WATI] Skipping duplicate signal: ${wamiId}`);
                return new Response("DUPLICATE_ACK", { status: 200 });
            }
        }

        // 2. Logic: Auto-Classification & Branch Mapping
        const adContext = `${body.referral?.headline || ""} ${body.referral?.body || ""} ${body.referral?.ad_name || ""}`.toLowerCase();
        
        const classifyCategory = (): any => {
           if (/ivf|infertility|test tube|egg donor|donor|laparoscopy/i.test(adContext)) return "INFERTILITY";
           if (/pregnancy|delivery|maternity|obstetrics|baby|labor/i.test(adContext)) return "MATERNITY";
           if (/pcos|period|gynae|menstrual|hymen|uterus/i.test(adContext)) return "GYNECOLOGY";
           if (/pedi|vaccination|child|neonatal|newborn/i.test(adContext)) return "PEDIATRICS";
           return "OTHER";
        };

        const detectEmergency = (msg: string) => {
           return /pain|bleeding|emergency|urgency|severe|help|accident/i.test(msg.toLowerCase());
        };

        // 3. Lead Discovery
        let lead = await prisma.lead.findFirst({
            where: {
                OR: [{ whatsappNumber: senderId }, { phone: senderId }]
            },
            include: { branch: true }
        });

        // 4. Branch Resolution
        const detectedCity = ["Raipur", "Bhilai", "Bilaspur"].find(city => adContext.includes(city.toLowerCase()));
        let detectedBranchId = lead?.branchId || null;

        if (!detectedBranchId && detectedCity) {
            const branch = await prisma.branch.findFirst({ where: { city: { contains: detectedCity, mode: 'insensitive' } } });
            if (branch) detectedBranchId = branch.id;
        }

        // 5. Routing by Event (Status Updates)
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
            console.warn(`🚨 [WATI_STATUS] Failure for ${senderId}: ${errorReason}`);
            return new Response("EVENT_ACK", { status: 200 });
        }

        // 6. Handle Inbound vs Outbound logic
        const isOutbound = eventType.includes("sessionMessageSent") || eventType.includes("templateMessageSent");
        const action = isOutbound ? "CLINIC_MESSAGE_SENT" : "WHATSAPP_MSG_RECEIVED";
        
        const isEmergency = !isOutbound && detectEmergency(text);
        const category = classifyCategory();
        const incomingName = body.senderName || body.contactName || body.name || "";

        if (!lead) {
            const idSuffix = senderId.slice(-4);
            const fallbackName = `Pahlajani Patient - ${idSuffix}`;

            console.log(`🆕 [WATI] Creating New Clinical Lead: ${senderId} | Category: ${category}`);
            lead = await prisma.lead.create({
                data: {
                    name: incomingName || fallbackName,
                    source: "WHATSAPP", 
                    status: "RAW",
                    category: category,
                    branchId: detectedBranchId,
                    whatsappNumber: senderId,
                    isEscalated: isEmergency,
                    aiChatStatus: isEmergency ? "HUMAN_OVERRIDE" : "AGENTX_ACTIVE",
                    metadata: {
                        externalId: senderId,
                        platform: "whatsapp",
                        isWati: true,
                        isAd: !!body.referral,
                        referral: body.referral,
                        lastInteraction: new Date().toISOString()
                    }
                },
                include: { branch: true }
            });

            // 🚀 Trigger Intelligent Distribution
            await distributeLead(lead.id);
        } else {
             console.log(`🔄 [WATI] Syncing Lead: ${lead.id} | Action: ${action}`);
             
             // Update logic: Resolve placeholder names and update interaction
             const needsNameUpdate = lead.name.startsWith("Pahlajani Patient") && incomingName && incomingName !== "WhatsApp Patient";
             
             await prisma.lead.update({
                 where: { id: lead.id },
                 data: {
                     source: "WHATSAPP",
                     ...(needsNameUpdate ? { name: incomingName } : {}),
                     ...(lead.category === 'OTHER' && category !== 'OTHER' ? { category } : {}),
                     ...(isEmergency ? { isEscalated: true, aiChatStatus: "HUMAN_OVERRIDE" } : {}),
                     metadata: {
                         ...(lead.metadata as any || {}),
                         isActive: true,
                         isWati: true,
                         lastInteraction: new Date().toISOString()
                     }
                 }
             });
        }

        // 7. Finalize Signal Entry & AI Synthesis
        if (text) {
            await prisma.activityLog.create({
                data: {
                    leadId: lead.id,
                    action: action,
                    description: text,
                    metadata: { source: "WATI", raw: body }
                }
            });

            // Only trigger AI drafts for INBOUND messages
            if (!isOutbound) {
                try {
                    await generateProactiveDraft({
                        leadId: lead.id,
                        messageText: text,
                        category: lead.category
                    });
                } catch (aiErr) {
                    console.warn(`⚠️ [WATI] AI draft skipped:`, aiErr);
                }
            }
        }

        return new Response("WATI_PROCESSED", { status: 200 });
    } catch (error) {
        console.error("💥 [WATI_WEBHOOK_FATAL]", error);
        return new Response("Internal Error", { status: 500 });
    }
}
