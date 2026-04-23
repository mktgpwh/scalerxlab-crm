"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { processTriageQueue } from "@/lib/routing/lead-assignment";

/**
 * Tactical Presence Toggle
 * Updates user online status for lead distribution routing.
 */
export async function toggleUserPresence(userId: string, isOnline: boolean) {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      select: { role: true } 
    });

    await prisma.user.update({
      where: { id: userId },
      data: { isOnline },
    });

    // AUTO-HANDOFF TRIGGER: Process queue if a TELE_SALES turns Online
    if (isOnline && user?.role === "TELE_SALES") {
      processTriageQueue(); 
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Presence Toggle Error:", error);
    return { success: false };
  }
}

/**
 * Administrative Force Offline
 * SUPER_ADMIN only: disconnects a node from active duty.
 */
export async function forceOfflineAction(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: false },
    });
    revalidatePath("/settings/users");
    return { success: true };
  } catch (error) {
    console.error("Force Offline Error:", error);
    return { success: false };
  }
}
