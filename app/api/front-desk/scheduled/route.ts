import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getLeadFilter } from "@/lib/security/rbac-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = session.user;
    const rlsFilter = getLeadFilter(session.user as any);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const leads = await prisma.lead.findMany({
      where: {
        status: "APPOINTMENT_SCHEDULED",
        appointmentDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        ...rlsFilter,
      },
      include: {
        owner: {
          select: { name: true }
        },
        branch: {
          select: { name: true }
        }
      },
      orderBy: {
        appointmentDate: "asc"
      }
    });

    return NextResponse.json({
      leads: leads.map(l => ({
        id: l.id,
        name: l.name,
        appointmentDate: l.appointmentDate?.toISOString(),
        appointmentCenter: l.branch?.name || l.appointmentCenter || "Main Center",
        assignedCounselor: l.owner?.name || "Unassigned",
        status: l.status
      }))
    });

  } catch (error: any) {
    console.error("💥 [SCHEDULED_FETCH_FATAL]", error);
    return NextResponse.json({ error: "Failed to sync scheduling matrix." }, { status: 500 });
  }
}
