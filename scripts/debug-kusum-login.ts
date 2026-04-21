import { prisma } from "../lib/prisma";
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log("🔍 Investigating Kusum's login failure...");
    const email = "teleservice.crm@gmail.com";
    
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                branch: true
            }
        });

        if (user) {
            console.log("\n✅ User Found:");
            console.log(`   - Name: ${user.name}`);
            console.log(`   - Email: ${user.email}`);
            console.log(`   - Active: ${user.isActive}`);
            console.log(`   - Role: ${user.role}`);
            console.log(`   - Password Hash Length: ${user.password?.length || 0}`);
            console.log(`   - Branch: ${user.branch?.name || "None"}`);
        } else {
            console.log("\n❌ User NOT found in database.");
            
            // Search by name just in case
            const usersByName = await prisma.user.findMany({
                where: {
                    name: {
                        contains: "Kusum",
                        mode: 'insensitive'
                    }
                }
            });
            
            if (usersByName.length > 0) {
                console.log(`\n📝 Found ${usersByName.length} user(s) with 'Kusum' in name:`);
                usersByName.forEach(u => console.log(`   - ${u.name} (${u.email})`));
            } else {
                console.log("\n❌ No users found with 'Kusum' in name.");
            }
        }
    } catch (error) {
        console.error("❌ Prisma Query Error:", error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
