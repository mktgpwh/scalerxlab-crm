import { createClient } from "@supabase/supabase-js";

// Use Supabase directly to seed bypassing Prisma v7 client constructor blocks locally
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log('Seeding Demo Organization via Supabase directly...');
  
  const { data, error } = await supabase
    .from('organizations')
    .upsert({
      id: 'org_scalerx_01',
      name: 'ScalerX Academy',
      slug: 'scalerx',
      industry: 'EDUCATION',
      updatedAt: new Date().toISOString()
    }, { onConflict: 'slug' })
    .select();

  if (error) {
    console.error("Seed Failed:", error);
    process.exit(1);
  }

  console.log('Organization Seeded:', data);
}

main();
