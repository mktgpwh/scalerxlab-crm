/**
 * WATI WhatsApp Notification Engine
 * Handles invoice and payment link delivery via AgentX
 */

export interface WatiInvoiceParams {
    whatsappNumber: string;
    patientName: string;
    invoiceNumber: string;
    amount: number;
    paymentLink: string;
}

export async function sendInvoiceNotification({
    whatsappNumber,
    patientName,
    invoiceNumber,
    amount,
    paymentLink
}: WatiInvoiceParams) {
    const endpoint = process.env.WATI_API_ENDPOINT;
    const token = process.env.WATI_ACCESS_TOKEN;

    if (!endpoint || !token) {
        console.error("🚨 [WATI_NOTIFICATION_ERROR] Missing credentials!");
        return { success: false, error: "Credentials missing" };
    }

    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    
    // Construct empathetic message from AgentX
    const message = `Namaste ${patientName}! 🙏\n\nThis is AgentX from Pahlajani's Women's Hospital. Your digital invoice *#${invoiceNumber}* for ₹${amount.toFixed(2)} has been generated.\n\nYou can pay securely via UPI using the link below:\n👉 ${paymentLink}\n\nThank you for choosing Pahlajanis!`;

    try {
        const url = `${endpoint}/api/v1/sendSessionMessage/${cleanNumber}?messageText=${encodeURIComponent(message)}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`WATI API returned ${response.status}: ${err}`);
        }

        console.log(`✅ [WATI_SUCCESS] Invoice alert sent to ${cleanNumber}`);
        return { success: true };
    } catch (error) {
        console.error("🛑 [WATI_FATAL] Failed to send notification:", error);
        return { success: false, error };
    }
}
