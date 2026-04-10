import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.systemSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    });
    return NextResponse.json({
      aiRoutingEnabled: settings.aiRoutingEnabled,
      tataVirtualNumber: settings.tataVirtualNumber,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const updated = await prisma.systemSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", ...body },
      update: body,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
