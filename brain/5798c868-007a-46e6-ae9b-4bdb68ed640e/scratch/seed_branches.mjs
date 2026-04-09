import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const organizations = await prisma.organization.findMany();
  
  if (organizations.length === 0) {
    console.log("No organizations found to seed.");
    return;
  }

  for (const org of organizations) {
    console.log(`Seeding branches for Org: ${org.name} (${org.id})`);
    
    const hq = await prisma.branch.upsert({
      where: { id: `hq-${org.id}` },
      update: {},
      create: {
        id: `hq-${org.id}`,
        organizationId: org.id,
        name: "Main / HQ",
        city: "Raipur",
        isHQ: true
      }
    });

    await prisma.branch.upsert({
      where: { id: `bhilai-${org.id}` },
      update: {},
      create: {
        id: `bhilai-${org.id}`,
        organizationId: org.id,
        name: "Bhilai Branch",
        city: "Bhilai",
        isHQ: false
      }
    });

    await prisma.branch.upsert({
      where: { id: `bilaspur-${org.id}` },
      update: {},
      create: {
        id: `bilaspur-${org.id}`,
        organizationId: org.id,
        name: "Bilaspur Center",
        city: "Bilaspur",
        isHQ: false
      }
    });

    // Update leads to link to HQ by default
    const updatedCount = await prisma.lead.updateMany({
      where: { organizationId: org.id, branchId: null },
      data: { branchId: hq.id, isAutoAssigned: true }
    });
    
    console.log(`Updated ${updatedCount.count} leads for ${org.name}`);

    // Update modulesConfig to defaults if empty
    await prisma.organization.update({
      where: { id: org.id },
      data: {
        modulesConfig: {
          ai: true,
          engagement: true,
          operations: true,
          intelligence: true
        }
      }
    });
    console.log(`Updated modulesConfig for ${org.name}`);
  }
}

main()
  .then(() => {
    console.log("Seeding complete.");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
