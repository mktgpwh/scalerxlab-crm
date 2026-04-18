import bcrypt from "bcryptjs";

/**
 * Tactical Password Security Utility
 * Provides verified hashing and comparison for ScalerXLab identities.
 */

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
