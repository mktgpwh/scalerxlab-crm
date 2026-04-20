import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL or DIRECT_URL is not set.");
    process.exit(1);
}

const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false } // Supabase usually requires SSL
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function recoverKusum() {
    console.log("🚀 Starting password recovery for Kusum...");
    
    try {
        // Locate Kusum by name or specific email
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: "teleservice.crm@gmail.com" },
                    { name: { contains: "Kusum", mode: "insensitive" } }
                ]
            }
        });

        if (!user) {
            console.error("❌ FATAL: User 'Kusum' not found in database.");
            return;
        }

        console.log(`🎯 Found User: ${user.name} (${user.email})`);

        // Hash the new password
        const hashedPassword = await bcrypt.hash("Pahlajani@123", 10);

        // Update the record
        await prisma.user.update({
            where: { id: user.id },
            data: { 
                password: hashedPassword,
                isActive: true // Ensure she is active
            }
        });

        console.log("✅ SUCCESS: Kusum's password has been updated and hashed.");
        console.log("👉 New Password: Pahlajani@123");

    } catch (error) {
        console.error("💥 RECOVERY_ERROR:", error);
    } finally {
        await prisma.$disconnect();
    }
}

recoverKusum();
