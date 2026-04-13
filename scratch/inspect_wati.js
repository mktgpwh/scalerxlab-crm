const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectLastWatiResponse() {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { action: 'CLINIC_MESSAGE_SENT' },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    if (logs.length > 0) {
      console.log(`--- INSPECTING LAST ${logs.length} OUTBOUND LOGS ---`);
      logs.forEach((log, index) => {
          console.log(`\n[LOG #${index + 1}]`);
          console.log('Timestamp:', log.createdAt);
          console.log('Description:', log.description);
          console.log('Metadata:', JSON.stringify(log.metadata, null, 2));
      });
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
