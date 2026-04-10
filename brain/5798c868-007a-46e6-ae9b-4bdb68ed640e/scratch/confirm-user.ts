import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function confirmUser() {
  const email = 'admin@scalerxlab.com';
  console.log(`--- Confirming User: ${email} ---`);

  try {
    // Try to update the auth.users table directly via raw SQL
    // This requires the DB user to have permissions on the auth schema, 
    // which the 'postgres' user usually does.
    const result = await prisma.$executeRawUnsafe(
      `UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE email = $1`,
      email
    );
    
    console.log('SQL Execution Result:', result);
    if (result > 0) {
      console.log('SUCCESS: User email confirmed via direct DB update.');
    } else {
      console.log('FAILED: No user found with that email in auth.users or no permission.');
    }
  } catch (err) {
    console.error('SQL Error:', err);
  }
}

confirmUser().finally(() => {
    prisma.$disconnect();
    pool.end();
});
