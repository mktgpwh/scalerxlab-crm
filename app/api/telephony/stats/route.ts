import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const today = { gte: new Date(new Date().setHours(0, 0, 0, 0)) };
    const [totalCalls, inbound, outbound, missed, qualified] = await Promise.all([
      prisma.callLog.count(),
      prisma.callLog.count({ where: { direction: "INBOUND", createdAt: today } }),
      prisma.callLog.count({ where: { direction: "OUTBOUND", createdAt: today } }),
      prisma.callLog.count({ where: { status: "MISSED", createdAt: today } }),
      prisma.callLog.count({ where: { isQualified: true, createdAt: today } }),
    ]);
    return NextResponse.json({ totalCalls, inbound, outbound, missed, qualified });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
