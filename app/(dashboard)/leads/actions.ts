"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { LeadStatus, LeadIntent, LeadSource, TreatmentCategory } from "@prisma/client";
import { generateProactiveDraft } from "@/lib/ai/proactive";
import { findLeadByContact } from "@/lib/leads/collision";

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

    // Standard Tactical Collision Guard: Search across all contact nodes
    const existing = await findLeadByContact({ phone: data.phone, email: data.email });

    if (existing) {
        return { error: `Collision Detected: A lead with this identity already exists in the matrix (ID: ${existing.id.slice(-6)}).` };
    }

    // RBAC: If not Admin, force ownership to current user
    // FIELD_SALES explicitly own what they hunt
    let finalOwnerId = (profile?.role === "TELE_SALES_ADMIN" || profile?.role === "FIELD_SALES_ADMIN" || profile?.role === "SUPER_ADMIN") 
        ? data.ownerId 
        : profile?.id;

    let finalStatus: LeadStatus = "RAW";
    let finalSource: LeadSource = data.source as LeadSource;

    // Operational Protocol: Walk-In Capture Automation (Super-Admin Proof)
    // If explicitly tagged as WALK_IN, force status and Super-Admin ownership
    if (data.source === "WALK_IN") {
      finalStatus = "VISITED";
      finalSource = "WALK_IN";
      
      const admin = await prisma.user.findFirst({ 
        where: { role: "SUPER_ADMIN" } 
      });
      if (admin) finalOwnerId = admin.id;
    }

    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        category: data.category as TreatmentCategory,
        source: finalSource,
        ownerId: finalOwnerId,
        branchId: data.branchId,
        status: finalStatus,
        intent: "UNSCORED" as LeadIntent,
      },
    });

    // 🚀 Strategic AI Pipeline: Initial Intelligence Sweep
    // Even for manual leads, we trigger the sentinel to ensure heat-mapping and audit logs are generated.
    try {
        await generateProactiveDraft({ 
            leadId: lead.id, 
            messageText: `Manual entry for ${data.category} department.`,
            category: data.category
        });
    } catch (aiError) {
        console.error("⚠️ [AGENTX_SCORER] Delayed scoring for manual lead:", aiError);
    }

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

        const isAdmin = profile?.role === "TELE_SALES_ADMIN" || profile?.role === "FIELD_SALES_ADMIN" || profile?.role === "SUPER_ADMIN";

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

        // 🚀 Bulk Intelligence Sweep: Post-ingestion scoring
        // We trigger AI scoring for newly created leads to populate the heat-map instantly.
        // Limited to 20 most recent to prevent timeout, others will be picked up by the backfill sweep.
        if (toCreate.length > 0) {
            const newLeads = await prisma.lead.findMany({
                where: { phone: { in: toCreate.map(l => l.phone) } },
                take: 20,
                orderBy: { createdAt: 'desc' }
            });

            // Parallel scoring execution
            await Promise.allSettled(newLeads.map(l => 
                generateProactiveDraft({ 
                    leadId: l.id, 
                    messageText: `Bulk imported lead for ${l.category}.`,
                    category: l.category
                })
            ));
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
    
    // Explicit session validation for production debugging
    if (!session?.user?.id) {
      console.warn("[COMPLIANCE_SYNC] Unauthorized access attempt", { leadId });
      return { error: "Authentication required. Please refresh your session." };
    }

    // Step 1: Update Lead record
    try {
      await prisma.lead.update({
        where: { id: leadId },
        data: { 
          consentFlag,
          consentTimestamp: consentFlag ? new Date() : null,
          consentMethod: consentFlag ? "MANUAL_AGENT_OVERRIDE" : null,
        }
      });
    } catch (dbError: any) {
      console.error("[COMPLIANCE_SYNC] Lead Table Update Failed:", dbError);
      return { error: "Database rejected the compliance update. Schema mismatch or record missing." };
    }

    // Step 2: Audit Logging
    try {
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
    } catch (auditError: any) {
      // We don't block the UI for audit failures, but we log them heavily
      console.error("[COMPLIANCE_SYNC] Audit Log Creation Failed:", auditError);
    }

    revalidatePath("/leads");
    return { success: true };
  } catch (error: any) {
    console.error("[COMPLIANCE_SYNC] Fatal Execution Error:", error);
    return { error: error.message || "An unexpected system error occurred." };
  }
}

export async function getBranchesAction() {
  try {
    return await prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true, city: true }
    });
  } catch (error) {
    console.error("[GET_BRANCHES_ERROR]", error);
    return [];
  }
}
