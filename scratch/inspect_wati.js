const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function inspectLastWatiResponse() {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { action: 'CLINIC_MESSAGE_SENT' },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    if (logs.length > 0) {
      console.log('--- LATEST OUTBOUND LOG ---');
      console.log('Log Content:', logs[0].description);
      console.log('Metadata:', JSON.stringify(logs[0].metadata, null, 2));
    } else {
      console.log('No recent CLINIC_MESSAGE_SENT logs found.');
    }
  } catch (err) {
    console.error('Diagnostic error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

inspectLastWatiResponse();
