import { prisma } from "./prisma";

interface LogActivityOptions {
  leadId?: string;
  userId?: string;
  action: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Logs an activity to the database for auditing and DPDPA compliance.
 */
export async function logActivity({
  leadId,
  userId,
  action,
  description,
  metadata,
}: LogActivityOptions) {
  try {
    return await prisma.activityLog.create({
      data: {
        leadId,
        userId,
        action,
        description,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch (error) {
    console.error("[LOG_ACTIVITY_ERROR]", error);
  }
}
