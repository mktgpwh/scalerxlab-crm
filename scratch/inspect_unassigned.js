const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function inspectUnassignedLeads() {
  try {
    const leads = await prisma.lead.findMany({
      where: {
        branchId: null
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    console.log(`--- UNASSIGNED LEADS INSPECTION (${leads.length} LEADS) ---`);
    leads.forEach(l => {
        console.log(`[${l.createdAt.toISOString()}] Name: ${l.name} | Source: ${l.source} | Platform: ${l.metadata?.platform || 'N/A'}`);
    });

  } catch (error) {
    console.error('Inspection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

inspectUnassignedLeads();
