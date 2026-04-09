"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { LeadStatus } from "@prisma/client";

export async function updateLeadStatusAction(
  leadId: string, 
  newStatus: string, 
  organizationId: string
) {
  try {
    // 1. Get current lead to log the transition
    const oldLead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { status: true, name: true }
    });

    if (!oldLead) return { error: "Lead not found" };

    // 2. Perform Update
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: newStatus as LeadStatus,
      },
    });

    // 3. Log Activity for Auditing (DPDPA)
    await logActivity({
      organizationId,
      leadId,
      action: "STATUS_CHANGE",
      description: `Lead status updated from ${oldLead.status} to ${newStatus}`,
      metadata: {
        oldStatus: oldLead.status,
        newStatus: newStatus,
        leadName: oldLead.name,
      }
    });

    return { success: true, lead: updatedLead };

  } catch (error) {
    console.error("[UPDATE_LEAD_STATUS_ACTION_ERROR]", error);
    return { error: "Failed to update lead status" };
  }
}
