"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function submitConsultationAction(leadId: string, notes: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized Access Identity denied.");

    // 1. Fetch Lead for Context
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { tenantId: true, name: true }
    });

    if (!lead) throw new Error("Patient Node not found in matrix.");

    // 2. Atomic Mutation: Update Status & Log Clinical Handoff
    await prisma.$transaction([
      prisma.lead.update({
        where: { id: leadId },
        data: { 
          status: "CONSULTED",
          // Temporarily storing notes in a specific metadata field as well for billing visibility
          metadata: {
            ...(lead as any).metadata,
            lastConsultationNotes: notes,
            consultedAt: new Date().toISOString(),
            consultedBy: session.user.id
          }
        }
      }),
      prisma.activityLog.create({
        data: {
          leadId,
          userId: session.user.id,
          action: "PATIENT_CONSULTED",
          description: `Consultation Complete. Notes: ${notes}`,
          metadata: {
            clinicalNotes: notes,
            stage: "COUNSELLING_NODE"
          },
          tenantId: lead.tenantId
        }
      })
    ]);

    revalidatePath("/counsellor/queue");
    revalidatePath("/leads");
    return { success: true };
  } catch (error: any) {
    console.error("[CONSULTATION_SUBMIT_ERROR]", error);
    return { error: error.message || "Matrix synchronization failure." };
  }
}
