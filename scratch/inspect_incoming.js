const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function inspectAllEvents() {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        lead: {
           select: { id: true, name: true, whatsappNumber: true }
        }
      }
    });

    console.log('--- RECENT SIGNAL STREAM ---');
    logs.forEach(log => {
      const raw = log.metadata?.raw || {};
      const eventType = raw.eventType || 'unknown';
      console.log(`[${log.createdAt.toISOString()}] LEAD: ${log.lead?.name} | ACTION: ${log.action} | WATI_EVENT: ${eventType}`);
      console.log(`Msg: ${log.description}`);
      console.log('---------------------------');
    });
  } catch (error) {
    console.error('Inspection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

inspectAllEvents();
