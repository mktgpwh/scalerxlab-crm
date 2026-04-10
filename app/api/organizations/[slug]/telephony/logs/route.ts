import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Call Registry Feed API
 * Provides the raw data for the Call Hub table.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const org = await prisma.organization.findUnique({
      where: { slug }
    });

    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

    const logs = await prisma.callLog.findMany({
      where: { organizationId: org.id },
      include: { lead: true },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("[TELEPHONY_LOGS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch registry" }, { status: 500 });
  }
}
