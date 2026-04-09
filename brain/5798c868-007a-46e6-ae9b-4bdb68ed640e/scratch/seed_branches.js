const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const organizations = await prisma.organization.findMany();
  
  for (const org of organizations) {
    console.log(`Seeding branches for Org: ${org.name}`);
    
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
    await prisma.lead.updateMany({
      where: { organizationId: org.id, branchId: null },
      data: { branchId: hq.id, isAutoAssigned: true }
    });
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
