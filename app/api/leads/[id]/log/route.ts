import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, description, metadata } = body;
    
    // Fetch lead to get organizationId
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { organizationId: true }
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const log = await logActivity({
      organizationId: lead.organizationId,
      leadId: id,
      action,
      description,
      metadata
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error("[LEAD_LOG_POST_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
