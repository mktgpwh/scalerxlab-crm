import crypto from "crypto";

/**
 * ScalerX Security Vault
 * Implements AES-256-GCM for authenticated encryption of integration tokens.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 32 bytes

/**
 * Encrypt sensitive token
 */
export function encryptToken(text: string): string {
    if (!ENCRYPTION_KEY) {
        throw new Error("Missing ENCRYPTION_KEY environment variable.");
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag().toString("hex");
    
    // Return combined string: iv:authTag:encrypted
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt sensitive token
 */
export function decryptToken(hash: string): string {
    if (!ENCRYPTION_KEY) {
        throw new Error("Missing ENCRYPTION_KEY environment variable.");
    }

    const [ivHex, authTagHex, encryptedText] = hash.split(":");
    
    if (!ivHex || !authTagHex || !encryptedText) {
        // Fallback for plain text if encryption transition is in progress (Legacy Support)
        if (!hash.includes(":")) return hash; 
        throw new Error("Invalid encrypted token format.");
    }

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
}
