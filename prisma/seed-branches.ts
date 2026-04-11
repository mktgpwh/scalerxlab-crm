import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Initializing Clinical Centers...");

  const branches = [
    { name: "Raipur", city: "Raipur", isHQ: true },
    { name: "Bhilai", city: "Bhilai", isHQ: false },
    { name: "Bilaspur", city: "Bilaspur", isHQ: false },
  ];

  for (const branch of branches) {
    const existing = await prisma.branch.findFirst({
        where: { name: branch.name }
    });

    if (!existing) {
        await prisma.branch.create({
            data: {
                ...branch,
                isActive: true
            }
        });
        console.log(`✓ Center Created: ${branch.name}`);
    } else {
        console.log(`- Center Exists: ${branch.name}`);
    }
  }

  console.log("Clinical Matrix Initialized.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
