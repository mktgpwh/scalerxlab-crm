import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/security/encryption";

/**
 * AgentX Platform Dispatcher
 * Refactored: Production Graph API Orchestration with In-Memory Decryption.
 */

export interface DispatchParams {
    leadId: string;
    platform: 'facebook' | 'instagram' | 'whatsapp';
    recipientId: string;
    text: string;
}

/**
 * Shared Helper: Fetch & Decrypt Integration Config
 */
async function getIntegrationConfig(type: string) {
    const settings = await prisma.systemSettings.findFirst({ where: { id: "singleton" } });
    if (!settings) throw new Error("CRITICAL: System settings missing.");
    
    const integrations = (settings.integrations as Record<string, any>) || {};
    const config = integrations[type];

    if (!config || !config.isActive) {
        throw new Error(`Integration [${type}] is not configured or active.`);
    }

    return config;
}

/**
 * Send Messenger/Instagram DM via Meta Graph API v21.0
 */
export async function sendMetaMessage(params: DispatchParams) {
    try {
        const config = await getIntegrationConfig("meta_ads");
        const token = decryptToken(config.pageAccessToken);

        console.log(`[DISPATCH] [META] Orchestrating Graph API for ${params.platform}...`);

        const res = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                recipient: { id: params.recipientId },
                message: { text: params.text },
                messaging_type: "RESPONSE"
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Meta API Error");

        return { success: true, messageId: data.message_id };
    } catch (error: any) {
        console.error(`[DISPATCH_FAILURE] [META]`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send WhatsApp Message via Cloud API v21.0
 */
export async function sendWhatsAppMessage(params: DispatchParams) {
    try {
        const config = await getIntegrationConfig("whatsapp");
        const token = decryptToken(config.whatsappAccessToken);
        const phoneId = config.phoneNumberId;

        console.log(`[DISPATCH] [WHATSAPP] Orchestrating Cloud API for ${phoneId}...`);

        const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: params.recipientId,
                type: "text",
                text: { body: params.text }
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "WhatsApp API Error");

        return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error: any) {
        console.error(`[DISPATCH_FAILURE] [WHATSAPP]`, error.message);
        return { success: false, error: error.message };
    }
}
/**
 * Send WhatsApp Message via WATI API v1
 */
export async function sendWatiMessage(params: DispatchParams) {
    try {
        const config = await getIntegrationConfig("wati");
        const token = config.accessToken;
        const baseUrl = config.endpoint.replace(/\/$/, ""); // Remove trailing slash if any

        // 🛡️ [PHASE: HARDENING] - Sanitize Phone Number for WATI
        // Remove '+', spaces, and non-digits
        const cleanPhone = params.recipientId.replace(/\D/g, "");

        console.log(`[DISPATCH] [WATI] Orchestrating Session API for ${cleanPhone}...`);

        const url = `${baseUrl}/api/v1/sendSessionMessage/${cleanPhone}`;
        
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                messageText: params.text
            })
        });

        const data = await res.json();
        
        // Detailed Logging for Debugging
        console.log(`[WATI_RESPONSE] [${res.status}]`, JSON.stringify(data));

        // WATI success mapping: { result: true } or { result: "success" }
        const isSuccess = data.result === true || data.result === "success" || data.status === "success";

        if (!res.ok || !isSuccess) {
             throw new Error(data.message || data.errors?.[0] || `WATI API Error: ${res.status}`);
        }

        return { success: true, messageId: data.id || "wati_msg_sent" };
    } catch (error: any) {
        console.error(`[DISPATCH_FAILURE] [WATI]`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch User Profile (Identity Enrichment)
 * Resolves real names from PSID (Facebook) or IGSID (Instagram).
 */
export async function fetchMetaUserProfile(externalId: string, platform: 'facebook' | 'instagram' | 'whatsapp') {
    try {
        // If it's WhatsApp, Meta Profile API won't work unless using Cloud API.
        // For WATI, we usually get the name in the payload, but if called, return fallback.
        if (platform === 'whatsapp') {
             const suffix = externalId.slice(-4);
             return { success: true, name: `Pahlajani Patient - ${suffix}` };
        }

        const config = await getIntegrationConfig("meta_ads");
        const token = decryptToken(config.pageAccessToken);

        console.log(`[ENRICHMENT] [META] Resolving identity for ${externalId} on ${platform}...`);

        // Fields vary slightly by platform
        const fields = platform === 'instagram' ? 'name,username' : 'first_name,last_name';
        const url = `https://graph.facebook.com/v21.0/${externalId}?fields=${fields}&access_token=${token}`;

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error?.message || "Profile API Error");

        let name = "";
        if (platform === 'instagram') {
            name = data.name || data.username || "";
        } else {
            name = `${data.first_name || ""} ${data.last_name || ""}`.trim();
        }

        // 🛡️ [CLINICAL_FALLBACK]: Never return generic "Meta Lead"
        if (!name) {
            const suffix = externalId.slice(-4);
            name = `Pahlajani Patient - ${suffix}`;
        }

        return { success: true, name, profilePic: data.profile_pic };
    } catch (error: any) {
        console.warn(`[ENRICHMENT_FAILED] [META]`, error.message);
        // Ensure even on total failure we provide the standard clinical name
        const suffix = externalId.slice(-4);
        return { success: true, name: `Pahlajani Patient - ${suffix}` };
    }
}
