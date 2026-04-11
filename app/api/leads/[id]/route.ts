import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        branch: true,
        owner: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[LEAD_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        ownerId: body.ownerId,
        assignedAt: body.ownerId ? new Date() : null,
        status: body.status,
        category: body.category,
        intent: body.intent
      }
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("[LEAD_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
