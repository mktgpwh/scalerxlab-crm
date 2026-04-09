import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const org = await prisma.organization.findUnique({
      where: { slug },
      include: {
        branches: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json(org.branches);
  } catch (error) {
    console.error("[ORG_BRANCHES_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
