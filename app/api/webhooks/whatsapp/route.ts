import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { generateProactiveDraft } from "@/lib/ai/proactive";
import { assignIncomingLead } from "@/lib/routing/lead-assignment";

/**
 * WHATSAPP WEBHOOK ENGINE
 * Hardened with HMAC-SHA256 and Proactive Drafting.
 */

export const dynamic = 'force-dynamic';

// 1. VERIFICATION HANDSHAKE (GET)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const SERVER_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;

    if (mode === "subscribe" && token === SERVER_TOKEN) {
        return new Response(challenge, { status: 200 });
    }

    return new Response("Forbidden", { status: 403 });
}

// 2. MESSAGE RECEIVER (POST)
export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get("x-hub-signature-256");

        // 🛡️ SECURITY: HMAC-SHA256 Verification
        if (process.env.META_APP_SECRET) {
            if (!signature) {
                return new Response("Unauthorized", { status: 401 });
            }

            const hmac = crypto.createHmac("sha256", process.env.META_APP_SECRET);
            const digest = "sha256=" + hmac.update(rawBody).digest("hex");

            if (signature !== digest) {
                return new Response("Unauthorized", { status: 401 });
            }
        }

        const body = JSON.parse(rawBody);
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (!message) {
            return NextResponse.json({ status: "ignored" });
        }

        const fromNumber = message.from;
        const textBody = message.text?.body;
        const contactName = value?.contacts?.[0]?.profile?.name || "WhatsApp Patient";
        const wabaId = value?.metadata?.display_phone_number; // Using phone number as Page Source for WhatsApp

        // 1. Lead Matching (External ID pattern)
        let lead = await prisma.lead.findFirst({
            where: {
                metadata: {
                    path: ["externalId"],
                    equals: fromNumber
                }
            }
        });

        if (!lead) {
            lead = await prisma.lead.create({
                data: {
                    name: contactName,
                    whatsappNumber: fromNumber,
                    source: "WHATSAPP",
                    status: "RAW",
                    metadata: {
                        externalId: fromNumber,
                        platform: "WHATSAPP",
                        pageSource: wabaId,
                        lastInteraction: new Date().toISOString()
                    }
                }
            });
        }

        // 2. Log Activity
        await prisma.activityLog.create({
            data: {
                leadId: lead.id,
                action: "WHATSAPP_MESSAGE_RECEIVED",
                description: textBody || "Received media/attachment",
                metadata: { fromNumber, timestamp: new Date().toISOString() }
            }
        });

        // 3. Proactive Intelligence
        if (textBody) {
            // Distribute lead immediately after creation
            await assignIncomingLead(lead.id);
            await generateProactiveDraft({
                leadId: lead.id,
                messageText: textBody,
                category: lead.category,
                pageId: wabaId
            });
        }

        return NextResponse.json({ status: "success" });

    } catch (error) {
        console.error("💥 WHATSAPP_WEBHOOK_CRASH:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
