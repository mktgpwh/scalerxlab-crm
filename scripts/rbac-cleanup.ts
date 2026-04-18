import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting data cleanup...");

  // Delete all users except target emails/names
  const deleteResult = await prisma.user.deleteMany({
    where: {
      NOT: {
        OR: [
          { email: "scalerxlab@gmail.com" },
          { name: { contains: "Kusum", mode: "insensitive" } }
        ]
      }
    }
  });

  console.log(`Deleted ${deleteResult.count} unauthorized users.`);

  // Update scalerxlab@gmail.com to SUPER_ADMIN
  const superAdmin = await prisma.user.updateMany({
    where: { email: "scalerxlab@gmail.com" },
    data: { role: "SUPER_ADMIN" }
  });
  console.log(`Updated ${superAdmin.count} Super Admins.`);

  // Update Kusum to SALES_USER
  const salesUser = await prisma.user.updateMany({
    where: { name: { contains: "Kusum", mode: "insensitive" } },
    data: { role: "FIELD_SALES" } // The user said "SALES_USER", but the requested enum is strictly SALES_USER
  });
  console.log(`Updated ${salesUser.count} Sales Users.`);

  console.log("Cleanup complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
