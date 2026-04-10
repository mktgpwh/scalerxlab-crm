import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || "scalerx_whatsapp_secure_2024";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const body = await req.json();

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

    let lead = await prisma.lead.findFirst({
      where: {
        OR: [
          { phone: fromNumber },
          { whatsappNumber: fromNumber }
        ]
      }
    });

    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          name: contactName,
          phone: fromNumber,
          whatsappNumber: fromNumber,
          source: "WHATSAPP",
          status: "RAW"
        }
      });
    }

    await prisma.activityLog.create({
      data: {
        leadId: lead.id,
        action: "WHATSAPP_MESSAGE_RECEIVED",
        description: `Incoming WhatsApp: "${textBody}"`,
        metadata: { rawPayload: body }
      }
    });

    if (textBody) {
      const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || "ScalerX Lab";
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an AI Sales Assistant for ${clinicName}. 
            Generate a concise, professional, and empathetic reply to the patient's message. 
            Patient Message: "${textBody}"
             Tone: Clinically precise but warm.`
          }
        ],
        model: "llama-3.3-70b-versatile",
      });

      const draft = completion.choices[0].message.content;

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
