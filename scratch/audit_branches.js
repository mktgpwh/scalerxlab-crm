const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function auditBranchData() {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true, city: true }
    });

    console.log('--- BRANCH AUDIT ---');
    for (const b of branches) {
      const count = await prisma.lead.count({
        where: { branchId: b.id }
      });
      console.log(`Branch: ${b.name} (${b.city}) | ID: ${b.id} | Lead Count: ${count}`);
    }

    const unassignedCount = await prisma.lead.count({
      where: { branchId: null }
    });
    console.log(`Unassigned Leads (No Branch): ${unassignedCount}`);

    console.log('\n--- RECENT LEADS (First 5) ---');
    const recentLeads = await prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, branch: { select: { name: true } }, createdAt: true }
    });
    recentLeads.forEach(l => {
        console.log(`[${l.createdAt.toISOString()}] Lead: ${l.name} | Branch: ${l.branch?.name || 'NONE'}`);
    });

  } catch (error) {
    console.error('Audit failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

auditBranchData();
