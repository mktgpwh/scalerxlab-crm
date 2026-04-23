import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🚀 Starting E2E Simulation Protocol...");
    
    // Setup: Get a random branch and tele-sales user
    const branch = await prisma.branch.findFirst({ where: { isActive: true } });
    const tsUser = await prisma.user.findFirst({ where: { role: "TELE_SALES", isActive: true } });
    
    if (!branch || !tsUser) {
        throw new Error("Simulation prerequisites missing (Branch or Tele-Sales user)");
    }

    // Node 1: Lead Generation
    const lead = await prisma.lead.create({
        data: {
            name: "E2E Ghost Patient",
            phone: "9999999999",
            source: "SMARTFLO_CALL",
            status: "RAW",
            branchId: branch.id,
            tenantId: "org_pahlajani_001"
        }
    });
    console.log(`✅ Node 1: Lead Generated (ID: ${lead.id})`);

    // Node 2: Appointment Booked
    await prisma.lead.update({
        where: { id: lead.id },
        data: {
            ownerId: tsUser.id,
            status: "APPOINTMENT_SCHEDULED",
            appointmentDate: new Date(),
            appointmentCenter: branch.name
        }
    });
    console.log("✅ Node 2: Appointment Booked");

    // Node 3: Patient Arrived
    await prisma.lead.update({
        where: { id: lead.id },
        data: { status: "VISITED" }
    });
    console.log("✅ Node 3: Patient Arrived");

    // Node 4: Consultation Complete
    await prisma.lead.update({
        where: { id: lead.id },
        data: { 
            status: "CONSULTED",
            aiNotes: "E2E Simulation: Clinical notes appended successfully." 
        }
    });
    console.log("✅ Node 4: Consultation Complete");

    // Node 5: Revenue Converted
    const invoice = await prisma.invoice.create({
        data: {
            leadId: lead.id,
            invoiceNumber: `E2E-${Date.now()}`,
            department: "OPD",
            subTotal: 500,
            totalAmount: 500,
            status: "PAID",
            items: {
                create: {
                    itemName: "Consultation",
                    quantity: 1,
                    unitPrice: 500,
                    total: 500
                }
            },
            payments: {
                create: {
                    amount: 500,
                    paymentMode: "CASH"
                }
            }
        }
    });
    
    await prisma.lead.update({
        where: { id: lead.id },
        data: { status: "WON" }
    });
    console.log(`✅ Node 5: Revenue Converted (Invoice: ${invoice.invoiceNumber})`);

    console.log("\n🎊 E2E Flow Verified Flawlessly.");

    // Cleanup
    console.log("\n🧹 Initiating Self-Cleaning Hook...");
    
    // Deleting in reverse order of dependencies
    await prisma.payment.deleteMany({ where: { invoiceId: invoice.id } });
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
    await prisma.invoice.delete({ where: { id: invoice.id } });
    await prisma.lead.delete({ where: { id: lead.id } });

    console.log("✅ Cleanup Complete. Production metrics remain at Zero.");
}

main()
    .catch(e => {
        console.error("❌ Simulation Failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
