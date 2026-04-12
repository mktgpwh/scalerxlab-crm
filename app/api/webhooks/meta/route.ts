import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * META WEBHOOK ENGINE
 * Handles Facebook Messenger and Instagram Direct Messages.
 * 
 * Logic:
 * 1. GET: Handshake verification for Meta App setup.
 * 2. POST: Process incoming message objects, create/update leads, and log activities.
 */

// 1. VERIFICATION HANDSHAKE (GET)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    // Security check against environment variables
    if (mode && token) {
        if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
            console.log("✅ META_WEBHOOK_VERIFIED");
            return new Response(challenge, { status: 200 });
        } else {
            console.error("❌ META_WEBHOOK_VERIFY_FAILED: Token mismatch");
            return new Response("Forbidden", { status: 403 });
        }
    }

    return new Response("Bad Request", { status: 400 });
}

// 2. MESSAGE RECEIVER (POST)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

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
                        const timestamp = messageObj.timestamp;

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

        console.log(`📝 ACTIVITY_LOGGED for lead ${lead.id} via ${actionLabel}`);

    } catch (error) {
        console.error("Prisma processing failed for Meta message:", error);
    }
}
