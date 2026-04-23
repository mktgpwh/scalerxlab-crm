import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
// Each batch is ~1000 rows; max DB insert time should be well within 30s
export const maxDuration = 30;

const VALID_CATEGORIES = ["MATERNITY", "GYNECOLOGY", "INFERTILITY", "PEDIATRICS", "OTHER"];
const VALID_SOURCES = [
  "META_ADS", "GOOGLE_ADS", "WEBSITE_FORM", "WHATSAPP", "WALK_IN",
  "REFERRAL", "OTHER", "INSTAGRAM_ADS", "TIKTOK_ADS", "LINKEDIN_ADS",
  "MANUAL_ENTRY", "BULK_IMPORT"
];

/**
 * POST /api/admin/bulk-import
 * Accepts a JSON batch of up to 1000 lead rows. Uses createMany + skipDuplicates
 * for high-throughput inserts without server action payload limits.
 */
export async function POST(req: NextRequest) {
  try {
    // ── Auth guard ─────────────────────────────────────────────
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true }
    });
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = profile.role === "SUPER_ADMIN" || profile.role === "TELE_SALES_ADMIN" || profile.role === "FIELD_SALES_ADMIN";

    // ── Parse body ─────────────────────────────────────────────
    const { rows, defaultBranchId } = await req.json() as {
      rows: Array<{
        name: string;
        phone: string;
        email?: string;
        category?: string;
        branchId?: string;
        source?: string;
      }>;
      defaultBranchId?: string;
    };

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Empty batch" }, { status: 400 });
    }
    if (rows.length > 1500) {
      return NextResponse.json({ error: "Batch too large. Max 1500 rows per request." }, { status: 400 });
    }

    // ── Normalise & validate rows ──────────────────────────────
    const validRows = rows
      .filter(r => r.phone && String(r.phone).replace(/[^0-9]/g, "").length >= 10)
      .map(r => ({
        name: (r.name || "Unknown Lead").slice(0, 255),
        phone: String(r.phone).replace(/[^0-9]/g, "").slice(0, 20),
        email: r.email ? String(r.email).slice(0, 255) : null,
        category: VALID_CATEGORIES.includes((r.category || "").toUpperCase())
          ? (r.category!.toUpperCase() as any)
          : "OTHER",
        source: VALID_SOURCES.includes((r.source || "BULK_IMPORT").toUpperCase())
          ? ((r.source || "BULK_IMPORT").toUpperCase() as any)
          : "BULK_IMPORT",
        branchId: r.branchId || defaultBranchId || null,
        ownerId: isAdmin ? null : profile.id,
        status: "RAW" as const,
        intent: "UNSCORED" as const,
      }));

    if (validRows.length === 0) {
      return NextResponse.json({ inserted: 0, skipped: rows.length });
    }

    // ── Deduplicate by phone within this batch (DB does the rest) ──
    const seen = new Set<string>();
    const deduped = validRows.filter(r => {
      if (seen.has(r.phone)) return false;
      seen.add(r.phone);
      return true;
    });

    // ── Fast bulk insert — DB handles phone-level dedup via skipDuplicates ───
    const result = await prisma.lead.createMany({
      data: deduped,
      skipDuplicates: true,
    });

    return NextResponse.json({
      inserted: result.count,
      skipped: rows.length - result.count,
      batchSize: rows.length,
    });

  } catch (error: any) {
    console.error("[BULK_IMPORT_ERROR]", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
