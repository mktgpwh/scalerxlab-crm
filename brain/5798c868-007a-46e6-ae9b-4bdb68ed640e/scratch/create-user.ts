import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createUser() {
  const email = 'admin@scalerxlab.com';
  const password = 'Password123!';
  const orgId = 'org_scalerx_01';

  console.log(`--- Creating User: ${email} ---`);

  // 1. Sign up via Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('User already exists in Supabase Auth. Proceeding to Prisma link...');
    } else {
      console.error('Auth Signup Error:', authError.message);
      return;
    }
  }

  // Get User ID (either from signup or by signing in to retrieve)
  let userId = authData.user?.id;
  if (!userId) {
     const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
       email, password
     });
     if (signInError) {
       console.error('Could not retrieve user ID:', signInError.message);
       return;
     }
     userId = signInData.user?.id;
  }

  console.log('User Auth ID:', userId);

  // 2. Link in Prisma
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { id: userId },
      create: {
        id: userId,
        email,
        name: 'ScalerX Admin',
        isActive: true,
      }
    });
    console.log('Prisma User Created/Updated:', user.id);

    const membership = await prisma.organizationMember.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId
        }
      },
      update: { role: 'ORG_ADMIN' },
      create: {
        userId: user.id,
        organizationId: orgId,
        role: 'ORG_ADMIN'
      }
    });
    console.log('Organization Membership Linked:', membership.id);
  } catch (err) {
    console.error('Prisma Error:', err);
  }
}

createUser().finally(() => {
    prisma.$disconnect();
    pool.end();
});
