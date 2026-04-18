import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeClinicalConversation } from "@/lib/ai/sentinel";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
// Increase max duration for long-running batch jobs (Vercel Pro allows up to 300s)
export const maxDuration = 300;

const INBOUND_ACTIONS = [
  "MESSAGE_RECEIVED",
  "WHATSAPP_MESSAGE_RECEIVED",
  "INSTAGRAM_DM_RECEIVED",
  "FACEBOOK_MSG_RECEIVED",
];

const BATCH_SIZE = 5; // Process 5 leads concurrently to avoid rate-limiting Groq

/**
 * POST /api/admin/reclassify-leads
 * Admin-only: Re-score all existing leads using INBOUND messages only.
 * Returns a summary of how many leads were updated and what changed.
 */
export async function POST(req: NextRequest) {
  try {
    // ── Auth guard: Super Admin only ───────────────────────────
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (profile?.role !== "SUPER_ADMIN" && profile?.role !== "SALES_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // ── Fetch all leads with their inbound activity logs ───────
    const leads = await prisma.lead.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        intent: true,
        aiScore: true,
        activityLogs: {
          where: { action: { in: INBOUND_ACTIONS } },
          orderBy: { createdAt: "asc" },
          take: 15,
          select: { description: true }
        }
      }
    });

    // Only process leads that have at least one inbound message
    const leadsWithMessages = leads.filter(l => l.activityLogs.length > 0);

    console.log(`[RECLASSIFY] Total leads: ${leads.length} | With inbound messages: ${leadsWithMessages.length}`);

    const results = {
      total: leads.length,
      processed: 0,
      updated: 0,
      skipped: leads.length - leadsWithMessages.length,
      errors: 0,
      changes: [] as Array<{ id: string; name: string; oldCategory: string; newCategory: string; oldIntent: string; newIntent: string; }>
    };

    // Process in batches to avoid overwhelming Groq API rate limits
    for (let i = 0; i < leadsWithMessages.length; i += BATCH_SIZE) {
      const batch = leadsWithMessages.slice(i, i + BATCH_SIZE);

      await Promise.all(batch.map(async (lead) => {
        try {
          // Build inbound-only history string
          const inboundHistory = lead.activityLogs
            .map(log => `[LEAD]: ${log.description}`)
            .join("\n");

          // Use the last message as the "current" message, rest as history
          const messages = lead.activityLogs;
          const latestMessage = messages[messages.length - 1]?.description || "";
          const priorHistory = messages.slice(0, -1).map(l => `[LEAD]: ${l.description}`).join("\n");

          const analysis = await analyzeClinicalConversation(
            latestMessage,
            priorHistory || "None",
            lead.category || undefined
          );

          // Map intentLevel to DB enum
          let mappedIntent: "HOT" | "WARM" | "COLD" | "UNSCORED" = "UNSCORED";
          if (analysis.intentLevel === "HOT") mappedIntent = "HOT";
          else if (analysis.intentLevel === "WARM") mappedIntent = "WARM";
          else if (analysis.intentLevel === "COLD") mappedIntent = "COLD";

          const validCategories = ["MATERNITY", "GYNECOLOGY", "INFERTILITY", "PEDIATRICS", "OTHER"];
          const newCategory = validCategories.includes(analysis.category) ? analysis.category : "OTHER";

          // Track changes for the response
          const hasChanged = newCategory !== lead.category || mappedIntent !== lead.intent;

          if (hasChanged) {
            results.changes.push({
              id: lead.id,
              name: lead.name,
              oldCategory: lead.category || "OTHER",
              newCategory,
              oldIntent: lead.intent || "UNSCORED",
              newIntent: mappedIntent
            });
          }

          // Always update aiScore and aiNotes; only update category if changed
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              category: newCategory as any,
              intent: mappedIntent,
              aiScore: analysis.intentScore,
              aiNotes: analysis.reasoning,
              aiScoredAt: new Date(),
              metadata: {
                ...(lead as any).metadata || {},
                reclassifiedAt: new Date().toISOString(),
                reclassifiedBy: "BATCH_SENTINEL_V2",
                sentiment: analysis.sentiment,
                intentScore: analysis.intentScore,
                intentLevel: analysis.intentLevel,
              }
            }
          });

          results.processed++;
          if (hasChanged) results.updated++;

        } catch (e) {
          console.error(`[RECLASSIFY_ERROR] Lead ${lead.id}:`, e);
          results.errors++;
        }
      }));

      // Small delay between batches to respect Groq rate limits
      if (i + BATCH_SIZE < leadsWithMessages.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`[RECLASSIFY_DONE] Processed: ${results.processed} | Updated: ${results.updated} | Errors: ${results.errors}`);

    return NextResponse.json({
      success: true,
      summary: {
        totalLeads: results.total,
        processedLeads: results.processed,
        updatedLeads: results.updated,
        skippedLeads: results.skipped,
        errorCount: results.errors,
      },
      changes: results.changes
    });

  } catch (error) {
    console.error("[RECLASSIFY_FATAL]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
