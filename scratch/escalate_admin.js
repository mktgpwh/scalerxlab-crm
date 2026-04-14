const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function updateAdminRole() {
  try {
    const user = await prisma.user.update({
      where: { email: 'scalerxlab@gmail.com' },
      data: { role: 'SUPER_ADMIN' },
    });
    console.log('Successfully escalated user role:', user.email, 'to', user.role);
  } catch (error) {
    console.error('Escalation failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminRole();
