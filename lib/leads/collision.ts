import { prisma } from "@/lib/prisma";

/**
 * Standardizes a phone number for clinical identity matching.
 */
export function cleanPhone(phone?: string | null): string | null {
    if (!phone) return null;
    return phone.replace(/\D/g, "");
}

/**
 * Tactical Collision Guard: Finds a lead across any clinical contact nodes.
 * Priorities: WhatsApp > Phone > Email
 * Refactored: Uses robust suffix matching to prevent duplicates across 91/+91/0 formats.
 */
export async function findLeadByContact({ 
    phone, 
    whatsappNumber, 
    email 
}: { 
    phone?: string | null; 
    whatsappNumber?: string | null; 
    email?: string | null; 
}) {
    const cPhone = cleanPhone(phone);
    const cWhatsapp = cleanPhone(whatsappNumber);

    if (!cPhone && !cWhatsapp && !email) return null;

    // Use last 10 digits as the clinical "base identity" for mobile numbers
    const phoneBase = cPhone?.slice(-10);
    const whatsappBase = cWhatsapp?.slice(-10);

    return await prisma.lead.findFirst({
        where: {
            OR: [
                ...(phoneBase ? [{ phone: { endsWith: phoneBase } }] : []),
                ...(whatsappBase ? [{ whatsappNumber: { endsWith: whatsappBase } }] : []),
                ...(email ? [{ email }] : [])
            ]
        }
    });
}
