"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * ABC Model Integration Save Action
 * Performs a lightweight 'handshake' before committing to the database.
 */
export async function saveIntegration(type: string, data: any) {
    try {
        // 1. PERFORM HANDSHAKE (Save & Verify Logic)
        const isVerified = await verifyConnection(type, data);
        
        if (!isVerified.success) {
            return { success: false, error: isVerified.message || "Connection verification failed." };
        }

        // 2. FETCH EXISTING Singleton
        const settings = await prisma.systemSettings.findFirst({
            where: { id: "singleton" }
        });

        if (!settings) throw new Error("System settings singleton mismatch.");

        // 3. MERGE INTEGRATION DATA
        const currentIntegrations = (settings.integrations as Record<string, any>) || {};
        const updatedIntegrations = {
            ...currentIntegrations,
            [type]: {
                ...data,
                isActive: true, // Auto-enable on success save
                updatedAt: new Date().toISOString()
            }
        };

        // 4. COMMIT TO DB
        await prisma.systemSettings.update({
            where: { id: "singleton" },
            data: { integrations: updatedIntegrations }
        });

        revalidatePath("/settings/integrations");
        return { success: true };

    } catch (error: any) {
        console.error(`[SAVE_INTEGRATION_${type.toUpperCase()}]`, error);
        return { success: false, error: error.message || "Failed to save configuration." };
    }
}

/**
 * LIGHTWEIGHT HANDSHAKE LIBRARY
 * Mock pings for MVP; Swap with actual API calls as needed.
 */
async function verifyConnection(type: string, data: any) {
    switch (type) {
        case "tata":
            // Structural check + dummy ping to Tata SmartFlo
            if (!data.apiKey || data.apiKey.length < 10) return { success: false, message: "Invalid Tata API Key format." };
            return { success: true };

        case "knowlarity":
            if (!data.apiKey) return { success: false, message: "Knowlarity API Key is required." };
            return { success: true };

        case "whatsapp":
            if (!data.accessToken || !data.phoneNumberId) return { success: false, message: "Missing WhatsApp credentials." };
            return { success: true };

        case "google_ads":
            if (!data.customerId) return { success: false, message: "Google Ads Customer ID is required." };
            return { success: true };

        case "meta_ads":
            if (!data.pixelId) return { success: false, message: "Meta Pixel ID is required." };
            return { success: true };

        case "razorpay":
            if (!data.keyId || !data.keySecret) return { success: false, message: "Razorpay Key ID and Secret required." };
            return { success: true };

        default:
            return { success: true };
    }
}

export async function toggleIntegration(type: string, enabled: boolean) {
    try {
        const settings = await prisma.systemSettings.findFirst({ where: { id: "singleton" } });
        if (!settings) throw new Error("Settings not found");

        const currentIntegrations = (settings.integrations as Record<string, any>) || {};
        if (!currentIntegrations[type]) return { success: false, error: "Integration not configured." };

        currentIntegrations[type].isActive = enabled;

        await prisma.systemSettings.update({
            where: { id: "singleton" },
            data: { integrations: currentIntegrations }
        });

        revalidatePath("/settings/integrations");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Toggle failed." };
    }
}
