import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { generateProactiveDraft } from "@/lib/ai/proactive";

/**
 * META WEBHOOK ENGINE
 * Hardened with HMAC-SHA256 and Proactive Drafting.
 */

// 1. VERIFICATION HANDSHAKE (GET)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    // Important: Name must exactly match Vercel Environment Variable
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

        // 🛡️ SECURITY: HMAC-SHA256 Authenticated Encryption Check
        if (process.env.META_APP_SECRET) {
            if (!signature) {
                console.warn("❌ AUTH_FAILURE: Missing signature header");
                return new Response("Unauthorized", { status: 401 });
            }

            const hmac = crypto.createHmac("sha256", process.env.META_APP_SECRET);
            const digest = "sha256=" + hmac.update(rawBody).digest("hex");

            if (signature !== digest) {
                console.error("❌ AUTH_FAILURE: HMAC match failed.");
                return new Response("Unauthorized", { status: 401 });
            }
        }

        const body = JSON.parse(rawBody);

        // Meta webhooks can contain multiple entries/messages
        if (body.object === "page" || body.object === "instagram") {
            const entries = body.entry || [];

            for (const entry of entries) {
                const messaging = entry.messaging || [];

                for (const messageObj of messaging) {
                    if (messageObj.message && messageObj.message.text) {
                        const senderId = messageObj.sender.id;
                        const recipientId = messageObj.recipient.id;
                        const messageText = messageObj.message.text;

                        // Identify Source
                        const isInstagram = body.object === "instagram";
                        const sourceLabel = isInstagram ? "INSTAGRAM_DM" : "FACEBOOK_MSG";
                        const actionLabel = isInstagram ? "INSTAGRAM_DM_RECEIVED" : "FACEBOOK_MSG_RECEIVED";
                        const defaultName = isInstagram ? "Meta Lead - Instagram" : "Meta Lead - Facebook";

                        // Fire-and-forget processing to ensure 200 OK is sent immediately
                        processMetaMessage(senderId, messageText, sourceLabel, actionLabel, defaultName, {
                            recipientId,
                            rawPayload: messageObj
                        }).catch(err => console.error("Error processing Meta message:", err));
                    }
                }
            }

            // Always return 200 OK within 20s to Meta
            return new Response("EVENT_RECEIVED", { status: 200 });
        }

        return new Response("Not Found", { status: 404 });
    } catch (error) {
        console.error("💥 META_WEBHOOK_CRASH:", error);
        // Still return 200 to prevent webhook suspension
        return new Response("INTERNAL_HANDLED", { status: 200 });
    }
}

/**
 * Internal Lead & Activity Logic
 */
async function processMetaMessage(
    senderId: string, 
    text: string, 
    sourceLabel: string, 
    actionLabel: string,
    defaultName: string,
    metadata: any
) {
    try {
        // 1. Lookup Lead by Metadata PSID/IGSID
        let lead = await prisma.lead.findFirst({
            where: {
                metadata: {
                    path: ["externalId"],
                    equals: senderId
                }
            }
        });

        // 2. Create Lead if New
        if (!lead) {
            lead = await prisma.lead.create({
                data: {
                    name: defaultName,
                    source: "META_MESSAGING",
                    status: "RAW",
                    metadata: {
                        externalId: senderId,
                        platform: sourceLabel,
                        pageSource: metadata.recipientId, // Page Attribution
                        lastInteraction: new Date().toISOString()
                    }
                }
            });
            console.log(`🆕 NEW_LEAD_CREATED from ${sourceLabel}: ${lead.id}`);
        }

        // 3. Log Activity
        await prisma.activityLog.create({
            data: {
                leadId: lead.id,
                action: actionLabel,
                description: text,
                metadata: {
                    senderId,
                    timestamp: new Date().toISOString()
                }
            }
        });

        // 🚀 PROACTIVE DRAFTING & EMERGENCY DETECTION
        // Prepared AgentX draft the microsecond a message arrives.
        await generateProactiveDraft({
            leadId: lead.id,
            messageText: text,
            category: lead.category,
            pageId: metadata.recipientId
        });

        console.log(`📝 PROACTIVE_SENTINEL_COMPLETE for lead ${lead.id}`);

    } catch (error) {
        console.error("Prisma processing failed for Meta message:", error);
    }
}
