import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const activities = await prisma.activityLog.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("[LEAD_ACTIVITIES_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
