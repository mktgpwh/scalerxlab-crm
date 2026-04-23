"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendInvoiceNotification } from "@/lib/notifications/wati";
import { generateUPIIntent } from "@/lib/payments/upi";
import { auth } from "@/auth";

/**
 * Searches for patients (Leads) by name or phone
 */
export async function searchPatients(query: string) {
    if (!query || query.length < 2) return [];

    try {
        return await prisma.lead.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query } },
                    { whatsappNumber: { contains: query } }
                ]
            } as any,
            take: 10,
            select: {
                id: true,
                name: true,
                phone: true,
                whatsappNumber: true,
                category: true,
                owner: {
                    select: {
                        name: true
                    }
                }
            }
        });
    } catch (error) {
        console.error("[BILLING_SEARCH_ERROR]", error);
        return [];
    }
}

interface InvoiceItemInput {
    itemName: string;
    quantity: number;
    unitPrice: number;
    tax: number;
}

/**
 * Creates an invoice and triggers WhatsApp notification
 */
export async function createInvoiceAction(params: {
    leadId: string;
    department: "OPD" | "IPD" | "PHARMACY" | "ULTRASOUND" | "LAB";
    items: InvoiceItemInput[];
}) {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        const { leadId, department, items } = params;

        // 1. Calculate Totals
        const subTotal = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
        const totalTax = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity * (item.tax / 100)), 0);
        const totalAmount = subTotal + totalTax;

        // 2. Generate Unique Invoice Number (Format: PH-YYYY-XXXXX)
        const date = new Date();
        const year = date.getFullYear();
        const count = await prisma.invoice.count();
        const invoiceNumber = `PH-${year}-${String(count + 1).padStart(5, '0')}`;

        // 3. Create Records Atomically
        const invoice = await prisma.$transaction(async (tx) => {
            const inv = await (tx.invoice.create as any)({
                data: {
                    leadId,
                    department,
                    invoiceNumber,
                    subTotal,
                    tax: totalTax,
                    totalAmount,
                    status: "UNPAID",
                    createdBy: userId,
                },
                include: {
                    lead: true
                }
            });

            await tx.invoiceItem.createMany({
                data: items.map(item => ({
                    invoiceId: inv.id,
                    itemName: item.itemName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    tax: item.tax,
                    total: (item.unitPrice * item.quantity) + (item.unitPrice * item.quantity * (item.tax / 100))
                }))
            });

            // Log activity
            await tx.activityLog.create({
                data: {
                    leadId,
                    userId,
                    action: "INVOICE_GENERATED",
                    description: `Generated ${department} invoice ${invoiceNumber} for ₹${totalAmount.toFixed(2)}`,
                    metadata: { invoiceId: inv.id, department }
                }
            });

            return inv;
        }) as any;

        // 4. Generate UPI Payment Info
        const upiLink = generateUPIIntent({
            amount: totalAmount,
            invoiceNumber: invoice.invoiceNumber,
            patientName: invoice.lead.name
        });

        // 5. Update Invoice with Payment Link
        await prisma.invoice.update({
            where: { id: invoice.id },
            data: { paymentLinkUrl: upiLink }
        });

        // 6. Trigger AgentX WhatsApp Notification
        const whatsapp = invoice.lead.whatsappNumber || invoice.lead.phone;
        if (whatsapp) {
            await sendInvoiceNotification({
                whatsappNumber: whatsapp,
                patientName: invoice.lead.name,
                invoiceNumber: invoice.invoiceNumber,
                amount: totalAmount,
                paymentLink: upiLink
            });
        }

        revalidatePath("/billing");
        return { success: true, invoice: { ...invoice, paymentLinkUrl: upiLink } };

    } catch (error) {
        console.error("[CREATE_INVOICE_ERROR]", error);
        return { success: false, error: "Failed to generate invoice" };
    }
}

/**
 * Marks an invoice as PAID and completes the Closed-Loop Attribution.
 * Transition: VISITED -> CHECKED_OUT
 */
export async function markInvoiceAsPaidAction(invoiceId: string) {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Update Invoice Status
            const invoice = await tx.invoice.update({
                where: { id: invoiceId },
                data: { status: "PAID" },
                include: { lead: true }
            });

            if (invoice.leadId) {
                // 2. Transition Lead to final CHECKED_OUT state
                await tx.lead.update({
                    where: { id: invoice.leadId },
                    data: { status: "CHECKED_OUT" }
                });

                // 3. Log the final Revenue Conversion milestone
                await tx.activityLog.create({
                    data: {
                        leadId: invoice.leadId,
                        userId,
                        action: "REVENUE_CONVERTED",
                        description: `Revenue Loop Closed. Invoice ${invoice.invoiceNumber} for ₹${invoice.totalAmount} marked as PAID.`,
                        tenantId: invoice.tenantId
                    }
                });
            }

            return invoice;
        });

        revalidatePath("/billing");
        revalidatePath("/leads");
        return { success: true, invoice: result };
    } catch (error) {
        console.error("[MARK_PAID_ERROR]", error);
        return { success: false, error: "Failed to commit payment node" };
    }
}
