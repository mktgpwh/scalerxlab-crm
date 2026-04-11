"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const profile = await prisma.user.findUnique({
        where: { id: user.id },
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
    const finalOwnerId = (profile?.role === "ORG_ADMIN" || profile?.role === "SUPER_ADMIN") 
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
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        const profile = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true }
        });

        // Filter out existing phone numbers
        const phoneNumbers = leads.map(l => l.phone).filter(Boolean);
        const existingLeads = await prisma.lead.findMany({
            where: { phone: { in: phoneNumbers } },
            select: { phone: true }
        });
        const existingPhones = new Set(existingLeads.map(l => l.phone));

        const uniqueLeads = leads.filter(l => l.phone && !existingPhones.has(l.phone));

        if (uniqueLeads.length === 0) {
            return { error: "All leads in this batch already exist in the system." };
        }

        const data = uniqueLeads.map(l => {
            const finalBranchId = l.branchId || globalBranchId;
            if (!finalBranchId) {
                throw new Error("Missing center attribution for lead signal.");
            }

            return {
                name: l.name || "Unknown Lead",
                phone: l.phone,
                email: l.email || null,
                category: (l.category as TreatmentCategory) || "OTHER",
                source: (l.source as LeadSource) || "BULK_IMPORT",
                branchId: finalBranchId,
                ownerId: (profile?.role === "ORG_ADMIN" || profile?.role === "SUPER_ADMIN") ? (l.ownerId || null) : profile?.id,
                status: "RAW" as LeadStatus,
                intent: "UNSCORED" as LeadIntent,
            };
        });

        const result = await prisma.lead.createMany({
            data,
            skipDuplicates: true,
        });

        revalidatePath("/leads");
        return { success: true, count: result.count };
    } catch (error: any) {
        console.error("Bulk Import Error:", error);
        return { error: error.message || "Bulk ingestion failed." };
    }
}
