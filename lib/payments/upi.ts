/**
 * UPI Payment Engine for ScalerX Lab
 * Generates dynamic UPI Intent Links and QR Data
 */

export interface UPIParams {
    amount: number;
    invoiceNumber: string;
    patientName: string;
}

/**
 * Generates a standard UPI Intent Link for Mobile App redirection
 * Standard URI: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&tn=NOTE&tr=REFID
 */
export function generateUPIIntent({ amount, invoiceNumber, patientName }: UPIParams): string {
    const vpa = process.env.NEXT_PUBLIC_HOSPITAL_UPI_ID || "pahlajani@upi";
    const merchantName = process.env.NEXT_PUBLIC_CLINIC_NAME || "Pahlajanis Womens Hospital";
    
    const params = new URLSearchParams({
        pa: vpa,
        pn: merchantName,
        am: amount.toFixed(2),
        tn: `Invoice ${invoiceNumber} for ${patientName}`,
        tr: invoiceNumber, // Tracking reference
        cu: "INR"
    });

    return `upi://pay?${params.toString()}`;
}

/**
 * Generates a URL for a Dynamic QR Code image
 * Uses a reliable public API for QR generation to avoid heavy local dependencies
 */
export function generateQRUrl({ amount, invoiceNumber, patientName }: UPIParams): string {
    const intent = generateUPIIntent({ amount, invoiceNumber, patientName });
    const size = "300x300";
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${encodeURIComponent(intent)}`;
}
