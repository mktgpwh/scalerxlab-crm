import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { generateProactiveDraft } from "@/lib/ai/proactive";
import { assignIncomingLead } from "@/lib/routing/lead-assignment";
import { findLeadByContact } from "@/lib/leads/collision";

/**
 * META WEBHOOK ENGINE
 * Hardened with HMAC-SHA256 and Proactive Drafting.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 1. VERIFICATION HANDSHAKE (GET)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const SERVER_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;

    if (mode === "subscribe" && token === SERVER_TOKEN) {
        console.log("✅ META_WEBHOOK_VERIFIED");
        return new Response(challenge, { status: 200 });
    } else {
        console.error("❌ META_WEBHOOK_VERIFY_FAILED: Token mismatch.");
        return new Response("Forbidden", { status: 403 });
    }
}

// 2. MESSAGE RECEIVER (POST)
export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get("x-hub-signature-256");

        if (process.env.META_APP_SECRET) {
            const hmac = crypto.createHmac("sha256", process.env.META_APP_SECRET);
            const digest = "sha256=" + hmac.update(rawBody).digest("hex");

            if (signature !== digest) {
                console.error("⚠️ [META_AUTH_WARN] Signature mismatch detected.");
            }
        }

        const body = JSON.parse(rawBody);

        if (body.object === "page" || body.object === "instagram") {
            const entries = body.entry || [];
            for (const entry of entries) {
                const messaging = entry.messaging || [];
                for (const messageObj of messaging) {
                    if (messageObj.message && messageObj.message.text) {
                        const senderId = messageObj.sender.id;
                        const recipientId = messageObj.recipient.id;
                        const messageText = messageObj.message.text;

                        const isInstagram = body.object === "instagram";
                        const sourceLabel = isInstagram ? "INSTAGRAM_DM" : "FACEBOOK_MSG";
                        const actionLabel = isInstagram ? "INSTAGRAM_DM_RECEIVED" : "FACEBOOK_MSG_RECEIVED";
                        
                        const idSuffix = senderId.slice(-4);
                        const defaultName = `Pahlajani Patient - ${idSuffix}`;

                        processMetaMessage(senderId, messageText, sourceLabel, actionLabel, defaultName, {
                            recipientId,
                            rawPayload: messageObj
                        }).catch(err => console.error("🛑 [META_PROCESS_CRASH]", err));
                    }
                }
            }
            return new Response("EVENT_RECEIVED", { status: 200 });
        }

        return new Response("Not Found", { status: 404 });
    } catch (error) {
        console.error("💥 [META_WEBHOOK_FATAL]", error);
        return new Response("INTERNAL_HANDLED", { status: 200 });
    }
}

async function processMetaMessage(
    senderId: string, 
    text: string, 
    sourceLabel: string, 
    actionLabel: string,
    defaultName: string,
    metadata: any
) {
    try {
        // 1. Tactical Collision Guard
        const existingLeads: any[] = await prisma.$queryRaw`
            SELECT * FROM leads 
            WHERE metadata->>'externalId' = ${senderId} 
            LIMIT 1
        `;
        
        let lead = existingLeads.length > 0 ? existingLeads[0] : null;

        if (!lead) {
            lead = await prisma.lead.create({
                data: {
                    name: defaultName,
                    source: "META_MESSAGING",
                    status: "RAW",
                    metadata: {
                        externalId: senderId,
                        platform: sourceLabel.includes('INSTAGRAM') ? 'instagram' : 'facebook',
                        pageSource: metadata.recipientId,
                        lastInteraction: new Date().toISOString()
                    }
                }
            });
            await assignIncomingLead(lead.id);
        }

        // 2. Log Activity
        await prisma.activityLog.create({
            data: {
                leadId: lead.id,
                action: actionLabel,
                description: text,
                metadata: { senderId, timestamp: new Date().toISOString() }
            }
        });

        // 3. Strategic AI Pipeline
        await generateProactiveDraft({
            leadId: lead.id,
            messageText: text,
            category: lead.category,
            pageId: metadata.recipientId
        });

    } catch (error) {
        console.error("🛑 [META_PROCESS_ERROR]", error);
    }
}
