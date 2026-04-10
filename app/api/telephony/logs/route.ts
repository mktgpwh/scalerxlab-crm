import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const logs = await prisma.callLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { lead: { select: { name: true, intent: true } } }
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
