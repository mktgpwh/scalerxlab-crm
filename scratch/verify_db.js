const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const orgs = await prisma.organization.findMany();
    console.log('--- DATABASE ORGANIZATIONS ---');
    orgs.forEach(o => {
      console.log(`ID: ${o.id} | Slug: ${o.slug} | Name: ${o.name}`);
    });
    console.log('-------------------------------');
  } catch (e) {
    console.error('Database check failed:', e);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
