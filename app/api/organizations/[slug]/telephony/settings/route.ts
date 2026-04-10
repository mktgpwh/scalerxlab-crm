import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Organization Telephony Settings API
 * Manages AI Routing Toggle and Virtual Numbers.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const org = await prisma.organization.findUnique({
      where: { slug },
      include: { telephonySettings: true }
    });

    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

    return NextResponse.json(org.telephonySettings || { aiRoutingEnabled: false });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { aiRoutingEnabled, tataVirtualNumber } = await req.json();
    const org = await prisma.organization.findUnique({
      where: { slug }
    });

    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

    const settings = await prisma.telephonySettings.upsert({
      where: { organizationId: org.id },
      update: { 
        aiRoutingEnabled: aiRoutingEnabled ?? undefined,
        tataVirtualNumber: tataVirtualNumber ?? undefined
      },
      create: {
        organizationId: org.id,
        aiRoutingEnabled: aiRoutingEnabled ?? false,
        tataVirtualNumber: tataVirtualNumber ?? "DEFAULT_VNS"
      }
    });

    // Log the configuration change
    await prisma.activityLog.create({
      data: {
        organizationId: org.id,
        action: "TELEPHONY_CONFIG_UPDATED",
        description: `AI Routing set to ${aiRoutingEnabled ? "ENABLED" : "DISABLED"}`,
        metadata: { aiRoutingEnabled }
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[SETTINGS_UPDATE_ERROR]", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
