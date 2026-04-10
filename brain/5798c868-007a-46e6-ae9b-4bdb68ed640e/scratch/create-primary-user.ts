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

async function createPrimaryUser() {
  const email = 'scalerxlab@gmail.com';
  const password = 'Scaler@321';
  const orgId = 'org_scalerx_01';

  console.log(`--- Establishing Primary Admin: ${email} ---`);

  // 1. Sign up via Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError && !authError.message.includes('already registered')) {
    console.error('Auth Signup Error:', authError.message);
    return;
  }

  // Get User ID
  let userId = authData.user?.id;
  if (!userId) {
     const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
       email, password
     });
     if (signInError) {
       console.error('Could not retrieve user ID:', signInError.message);
       // User might exist but might be unconfirmed. Let's try to find them by email in public.users if they were ever there.
       const existingProfile = await prisma.user.findUnique({ where: { email } });
       if (!existingProfile) {
          console.error('No existing profile found. User exists in Auth but is locked/unconfirmed.');
          return;
       }
       userId = existingProfile.id;
     } else {
        userId = signInData.user?.id;
     }
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
        name: 'ScalerX Primary Admin',
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

    // 3. Attempt DB Confirmation Bypass
    console.log('--- Attempting DB Confirmation Bypass ---');
    const sqlResult = await prisma.$executeRawUnsafe(
      `UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = $1`,
      email
    );
    console.log('SQL Confirmation Result:', sqlResult);

  } catch (err) {
    console.error('Prisma Error:', err);
  }
}

createPrimaryUser().finally(() => {
    prisma.$disconnect();
    pool.end();
});
