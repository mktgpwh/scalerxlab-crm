import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Starting Production Data Purge (Clean Slate Protocol)...");

  try {
    console.log("🧹 Purging Payments...");
    await prisma.payment.deleteMany({});

    console.log("🧹 Purging Invoice Items...");
    await prisma.invoiceItem.deleteMany({});

    console.log("🧹 Purging Invoices...");
    await prisma.invoice.deleteMany({});

    console.log("🧹 Purging Call Logs...");
    await prisma.callLog.deleteMany({});

    console.log("🧹 Purging Auto Nurture Queue...");
    await prisma.autoNurtureQueue.deleteMany({});

    console.log("🧹 Purging Activity Logs...");
    await prisma.activityLog.deleteMany({});

    console.log("🧹 Purging Leads...");
    await prisma.lead.deleteMany({});

    console.log("✅ Data Purge Complete. Database is now in 'RAW' Production state.");
  } catch (error) {
    console.error("💥 CRITICAL FAILURE DURING PURGE:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
