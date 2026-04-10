import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: [{ isHQ: 'desc' }, { name: 'asc' }]
    });
    return NextResponse.json(branches);
  } catch (error) {
    console.error("[BRANCHES_ERROR]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
