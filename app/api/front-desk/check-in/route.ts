import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session?.user?.id || (userRole !== "FRONT_DESK" && userRole !== "SUPER_ADMIN" && userRole !== "TELE_SALES_ADMIN" && userRole !== "FIELD_SALES_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized: Front Desk clearance required" }, { status: 401 });
    }

    const { leadId } = await req.json();

    // 1. Fetch Lead to get tenantId
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: "VISITED",
        activityLogs: {
          create: {
            userId: session.user.id,
            action: "CHECKED_IN",
            description: "Patient arrived and check-in successfully nodes at front desk console.",
            tenantId: lead.tenantId
          }
        }
      }
    });

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error: any) {
    console.error("[CHECKIN_ERROR]", error.message);
    return NextResponse.json({ error: "Check-in processing identity node failure" }, { status: 500 });
  }
}
