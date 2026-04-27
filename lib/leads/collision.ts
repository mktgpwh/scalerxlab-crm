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

    return await prisma.lead.findFirst({
        where: {
            OR: [
                ...(cPhone ? [{ phone: cPhone }] : []),
                ...(cWhatsapp ? [{ whatsappNumber: cWhatsapp }] : []),
                ...(email ? [{ email }] : [])
            ]
        }
    });
}
