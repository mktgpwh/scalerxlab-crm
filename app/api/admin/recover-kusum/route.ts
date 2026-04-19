import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("🚀 Starting password recovery for Kusum...");
    
    try {
        // Locate Kusum by name or email patterns
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { name: { contains: "Kusum", mode: "insensitive" } },
                    { email: { contains: "kusum", mode: "insensitive" } }
                ]
            }
        });

        if (!user) {
            return NextResponse.json({ 
                success: false, 
                error: "User 'Kusum' not found in database." 
            }, { status: 404 });
        }

        console.log(`🎯 Found User: ${user.name} (${user.email})`);

        // Hash the new password
        const hashedPassword = await bcrypt.hash("Pahlajani@123", 10);

        // Update the record
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { 
                password: hashedPassword,
                isActive: true 
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: "Kusum's password has been updated and hashed.",
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name
            }
        });

    } catch (error: any) {
        console.error("💥 RECOVERY_ERROR:", error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || "Internal Server Error" 
        }, { status: 500 });
    }
}
