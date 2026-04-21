"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { LeadStatus, LeadIntent, LeadSource, TreatmentCategory } from "@prisma/client";

const leadSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  category: z.enum(["MATERNITY", "GYNECOLOGY", "INFERTILITY", "OTHER"]),
  source: z.enum([
    "META_ADS", "GOOGLE_ADS", "WEBSITE_FORM", "WHATSAPP", "WALK_IN", 
    "REFERRAL", "OTHER", "INSTAGRAM_ADS", "TIKTOK_ADS", "LINKEDIN_ADS",
    "MANUAL_ENTRY", "BULK_IMPORT"
  ]).default("MANUAL_ENTRY"),
  ownerId: z.string().optional().nullable(),
  branchId: z.string().min(1, "Clinical Center is required"),
});

export async function createLeadAction(data: z.infer<typeof leadSchema>) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const profile = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true }
    });

    // Standard Collision Check: Phone Number
    const existing = await prisma.lead.findFirst({
        where: { phone: data.phone }
    });

    if (existing) {
        return { error: "A lead with this phone number already exists in the matrix." };
    }

    // RBAC: If not Admin, force ownership to current user
    const finalOwnerId = (profile?.role === "SALES_ADMIN" || profile?.role === "SUPER_ADMIN") 
        ? data.ownerId 
        : profile?.id;

    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        category: data.category as TreatmentCategory,
        source: data.source as LeadSource,
        ownerId: finalOwnerId,
        branchId: data.branchId,
        status: "RAW" as LeadStatus,
        intent: "UNSCORED" as LeadIntent,
      },
    });

    revalidatePath("/leads");
    return { success: true, lead };
  } catch (error: any) {
    console.error("Lead Creation Error:", error);
    return { error: error.message || "Failed to create lead signal." };
  }
}

export async function bulkImportLeadsAction(leads: any[], globalBranchId?: string) {
    try {
        const session = await auth();
        if (!session?.user) throw new Error("Unauthorized");

        const profile = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, role: true }
        });

        const isAdmin = profile?.role === "SALES_ADMIN" || profile?.role === "SUPER_ADMIN";

        // 1. Filter out invalid rows (missing phone)
        const validLeads = leads.filter(l => l.phone && l.phone.length >= 10);
        const phoneNumbers = validLeads.map(l => l.phone);

        // 2. Identify existing leads in the matrix
        const existingLeads = await prisma.lead.findMany({
            where: { phone: { in: phoneNumbers } },
            select: { id: true, phone: true }
        });
        const existingPhonesMap = new Map(existingLeads.map(l => [l.phone, l.id]));

        const toCreate: any[] = [];
        const toUpdate: { id: string, data: any }[] = [];

        validLeads.forEach(l => {
            const finalBranchId = l.branchId || globalBranchId;
            if (!finalBranchId) throw new Error("Missing center attribution for lead signal.");

            const leadData = {
                name: l.name || "Unknown Lead",
                phone: l.phone,
                email: l.email || null,
                category: (l.category as TreatmentCategory) || "OTHER",
                source: (l.source as LeadSource) || "BULK_IMPORT",
                branchId: finalBranchId,
                ownerId: (isAdmin) ? (l.ownerId || null) : profile?.id,
                status: "RAW" as LeadStatus,
                intent: "UNSCORED" as LeadIntent,
            };

            const existingId = existingPhonesMap.get(l.phone);
            if (existingId) {
                // If lead exists and user is Admin, we update it
                if (isAdmin) {
                    toUpdate.push({ id: existingId, data: leadData });
                }
            } else {
                toCreate.push(leadData);
            }
        });

        // 3. Execute Operations
        let insertedCount = 0;
        let updatedCount = 0;

        if (toCreate.length > 0) {
            const result = await prisma.lead.createMany({
                data: toCreate,
                skipDuplicates: true,
            });
            insertedCount = result.count;
        }

        if (toUpdate.length > 0) {
            // Processing updates in chunks to avoid overwhelming the connection pool
            const chunks = [];
            for (let i = 0; i < toUpdate.length; i += 50) {
                chunks.push(toUpdate.slice(i, i + 50));
            }

            for (const chunk of chunks) {
                await Promise.all(
                    chunk.map(item => 
                        prisma.lead.update({
                            where: { id: item.id },
                            data: {
                                name: item.data.name,
                                email: item.data.email,
                                category: item.data.category,
                                branchId: item.data.branchId,
                                // We don't change owner or source during upsert usually
                            }
                        })
                    )
                );
                updatedCount += chunk.length;
            }
        }

        revalidatePath("/leads");
        return { 
            success: true, 
            insertedCount, 
            updatedCount, 
            totalProcessed: validLeads.length 
        };
    } catch (error: any) {
        console.error("Bulk Import Error:", error);
        return { error: error.message || "Bulk ingestion failed." };
    }
}

export async function updateLeadConsentAction(leadId: string, consentFlag: boolean) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: { 
        consentFlag,
        consentTimestamp: consentFlag ? new Date() : null,
        consentMethod: consentFlag ? "MANUAL_AGENT_OVERRIDE" : null,
      }
    });

    // Create Audit Entry for DPDPA traceability
    await prisma.activityLog.create({
      data: {
        leadId,
        userId: session.user.id,
        action: "CONSENT_UPDATED",
        description: `DPDPA Outreach Consent ${consentFlag ? "GRANTED" : "REVOKED"} by agent.`,
        metadata: { 
          timestamp: new Date().toISOString(),
          method: "MANUAL_OVERRIDE",
          status: consentFlag
        }
      }
    });

    revalidatePath("/leads");
    return { success: true, lead };
  } catch (error: any) {
    console.error("Consent Update Fatal:", error);
    return { error: "Failed to sync compliance state." };
  }
}
