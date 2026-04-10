import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";

/**
 * Meta WhatsApp Webhook Receiver
 * Handles incoming messages and triggers AI "Smart Draft" generation.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Use an environment variable for actual verification
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "scalerx_whatsapp_secure_2024";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[WHATSAPP_WEBHOOK] Verified successfully.");
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const body = await req.json();
    console.log("[WHATSAPP_WEBHOOK] Received Payload:", JSON.stringify(body, null, 2));

    // 1. Extract message details (Standard Meta Payload Structure)
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ status: "ignored" });
    }

    const fromNumber = message.from;
    const textBody = message.text?.body;
    const contactName = value?.contacts?.[0]?.profile?.name || "Unknown Patient";

    // 2. Locate or create lead in DB
    // Note: We search by phone number. 
    // In a multi-tenant world, we'd use the virtual number in 'value.metadata' to find the organization.
    const organization = await prisma.organization.findFirst(); // Fallback for demo
    if (!organization) return NextResponse.json({ error: "Org not found" }, { status: 404 });

    let lead = await prisma.lead.findFirst({
      where: { 
        OR: [
          { phone: fromNumber },
          { whatsappNumber: fromNumber }
        ],
        organizationId: organization.id
      }
    });

    if (!lead) {
      // Create new lead from WhatsApp if not exists
      lead = await prisma.lead.create({
        data: {
          name: contactName,
          phone: fromNumber,
          whatsappNumber: fromNumber,
          organizationId: organization.id,
          source: "WHATSAPP",
          status: "RAW"
        }
      });
    }

    // 3. Log the activity
    await prisma.activityLog.create({
      data: {
        organizationId: organization.id,
        leadId: lead.id,
        action: "WHATSAPP_MESSAGE_RECEIVED",
        description: `Incoming WhatsApp: "${textBody}"`,
        metadata: { rawPayload: body }
      }
    });

    // 4. Trigger Groq for "Smart Draft"
    // We store the draft in lead metadata or a dedicated messaging table if available.
    if (textBody) {
      const completion = await groq.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: `You are an AI Sales Assistant for ${organization.name}. 
            Generate a concise, professional, and empathetic reply to the patient's message. 
            Patient Message: "${textBody}"
             Tone: Clinically precise but warm.`
          }
        ],
        model: "llama-3.3-70b-versatile",
      });

      const draft = completion.choices[0].message.content;

      // Update lead metadata with the latest smart draft
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          metadata: {
            ...(lead.metadata as object || {}),
            latestDraft: draft,
            lastInboundMessage: textBody,
            draftTimestamp: new Date().toISOString()
          }
        }
      });
    }

    return NextResponse.json({ status: "success" });

  } catch (error) {
    console.error("[WHATSAPP_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
