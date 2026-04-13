"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Get Connections Config
 * Retrieves the centralized integrations JSONB from SystemSettings.
 */
export async function getConnectionsAction() {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "singleton" }
    });
    return { success: true, integrations: settings?.integrations || {} };
  } catch (error) {
    console.error("Failed to fetch connections:", error);
    return { success: false, error: "Database signal lost" };
  }
}

/**
 * Update Connection Config
 * Merges new service credentials into the singleton JSONB store.
 */
export async function updateConnectionAction(key: string, data: any) {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "singleton" }
    });

    const currentIntegrations = (settings?.integrations as any) || {};
    
    // 🛡️ Atomic Merge: Preserves other service keys
    const updatedIntegrations = {
      ...currentIntegrations,
      [key]: {
        ...(currentIntegrations[key] || {}),
        ...data,
        updatedAt: new Date().toISOString()
      }
    };

    await prisma.systemSettings.update({
      where: { id: "singleton" },
      data: { integrations: updatedIntegrations }
    });

    revalidatePath("/integrations");
    return { success: true };
  } catch (error) {
    console.error(`Failed to update connection [${key}]:`, error);
    return { success: false, error: "Cloud sync failed" };
  }
}

/**
 * Toggle Connection Status
 * Enables or disables a specific service without losing credentials.
 */
export async function toggleConnectionStatus(key: string, isEnabled: boolean) {
    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: "singleton" }
        });

        const currentIntegrations = (settings?.integrations as any) || {};
        if (!currentIntegrations[key]) return { success: false, error: "Connection not configured" };

        const updatedIntegrations = {
            ...currentIntegrations,
            [key]: {
                ...currentIntegrations[key],
                isEnabled
            }
        };

        await prisma.systemSettings.update({
            where: { id: "singleton" },
            data: { integrations: updatedIntegrations }
        });

        revalidatePath("/integrations");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Toggle failed" };
    }
}
