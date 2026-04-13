import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWatiMessage } from "@/lib/ai/dispatch";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { text } = await req.json();
        if (!text) return new Response("Text required", { status: 400 });

        const lead = await prisma.lead.findUnique({ where: { id: params.id } });
        if (!lead) return new Response("Lead not found", { status: 404 });

        const recipientId = lead.whatsappNumber || lead.phone;
        if (!recipientId) return new Response("Lead has no phone number", { status: 400 });

        const result = await sendWatiMessage({
            leadId: lead.id,
            platform: 'whatsapp',
            recipientId: recipientId,
            text
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        // Log the activity
        await prisma.activityLog.create({
            data: {
                leadId: lead.id,
                action: "WHATSAPP_MESSAGE_SENT",
                description: `Sent via WATI: ${text}`,
                metadata: { source: "WATI_MANUAL_DISPATCH" }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
