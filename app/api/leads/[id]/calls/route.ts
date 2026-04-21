import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/leads/[id]/calls
 * Returns telephony records for a specific lead.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const calls = await prisma.callLog.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "desc" },
      include: {
          agent: {
              select: { name: true }
          }
      }
    });

    return NextResponse.json(calls);
  } catch (error) {
    console.error("[LEAD_CALLS_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
