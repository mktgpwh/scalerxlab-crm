const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const orgs = await prisma.organization.findMany();
  console.log('ORGS_FOUND:', JSON.stringify(orgs));
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
