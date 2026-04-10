import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { subDays } from "date-fns";

/**
 * DPDPA Compliance Worker (Stub)
 * Masks PII for leads older than 180 days.
 * Can be triggered via a Cron job (Vercel/GitHub Actions).
 */
export async function GET(req: Request) {
  try {
    // Security check: Verify secret if provided
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const retentionLimit = subDays(new Date(), 180);

    // Identify leads for archival
    const leadsToArchive = await prisma.lead.findMany({
      where: {
        createdAt: { lt: retentionLimit },
        status: { not: "LOST" }
      },
      select: { id: true }
    });

    if (leadsToArchive.length === 0) {
      return NextResponse.json({ message: "No leads requiring archival at this time." });
    }

    let archievedCount = 0;

    for (const lead of leadsToArchive) {
      await prisma.$transaction([
        // 1. Mask PII in Lead table
        prisma.lead.update({
          where: { id: lead.id },
          data: {
            name: "[REDACTED]",
            email: "[REDACTED]",
            phone: "[REDACTED]",
            whatsappNumber: "[REDACTED]",
            status: "LOST", // Was ARCHIVED, but enum shifted to clinical FUNNEL
            metadata: {
              mask_reason: "DPDPA_180_DAYS_RETENTION",
              masked_at: new Date().toISOString()
            }
          }
        }),
        // 2. Log compliance action
        prisma.activityLog.create({
          data: {
             leadId: lead.id,
             action: "DPDPA_COMPLIANCE_ARCHIVED",
             description: "PII data masked due to 180-day retention policy.",
             metadata: { retention_days: 180 }
          }
        })
      ]);
      archievedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      processed: archievedCount,
      message: `${archievedCount} leads archived and PII masked.`
    });

  } catch (error) {
    console.error("[DPDPA_RETENTION_ERROR]", error);
    return NextResponse.json({ error: "Archival process failed" }, { status: 500 });
  }
}
