const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function inspectBilaspurLeads() {
  try {
    const leads = await prisma.lead.findMany({
      where: {
        branch: { name: 'Bilaspur' }
      },
      include: { branch: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    console.log(`--- BILASPUR COHORT INSPECTION (${leads.length} LEADS) ---`);
    leads.forEach(l => {
        console.log(`[${l.createdAt.toISOString()}] Name: ${l.name} | Phone: ${l.phone || l.whatsappNumber || 'N/A'} | Source: ${l.source} | Status: ${l.status}`);
        // console.log(`Metadata: ${JSON.stringify(l.metadata, null, 2)}`);
    });

    const manualLeads = leads.filter(l => l.source === 'MANUAL_ENTRY' || l.source === 'OTHER');
    const whatsappLeads = leads.filter(l => l.source === 'WHATSAPP');
    
    console.log(`\nStats: WhatsApp: ${whatsappLeads.length}, Other/Manual: ${manualLeads.length}`);

  } catch (error) {
    console.error('Inspection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

inspectBilaspurLeads();
