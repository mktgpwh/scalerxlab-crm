import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Access Denied" }, { status: 401 });
    }

    const { id } = params;
    const { appointmentDate, appointmentCenter, assignedCounselor, status } = await req.json();

    // 1. Fetch Lead to get tenantId
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        status,
        appointmentDate: new Date(appointmentDate),
        appointmentCenter,
        assignedCounselor,
        activityLogs: {
          create: {
            userId: session.user.id,
            action: "APPOINTMENT_SCHEDULED",
            description: `Appointment scheduled for ${new Date(appointmentDate).toLocaleDateString()} at ${appointmentCenter}. Assigned to ${assignedCounselor || 'unassigned'}.`,
            metadata: {
                appointmentDate,
                appointmentCenter,
                assignedCounselor
            },
            tenantId: lead.tenantId
          }
        }
      }
    });

    return NextResponse.json(updatedLead);
  } catch (error: any) {
    console.error("[SCHEDULING_ERROR]", error.message);
    return NextResponse.json({ error: "Failed to schedule appointment" }, { status: 500 });
  }
}
