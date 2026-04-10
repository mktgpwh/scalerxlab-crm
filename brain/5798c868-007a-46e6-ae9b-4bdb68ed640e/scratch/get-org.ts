import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function getOrg() {
  try {
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true, slug: true }
    });
    console.log('Organizations:', JSON.stringify(orgs, null, 2));
  } catch (error) {
    console.error('Error fetching organizations:', error);
  }
}

getOrg().finally(() => prisma.$disconnect());
