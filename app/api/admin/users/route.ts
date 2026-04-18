import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { hashPassword } from "@/lib/utils/password";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/users
 * SUPER_ADMIN only endpoint for provisioning new clinical and administrative nodes.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Session Verification
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Role Authorization (Strictly SUPER_ADMIN only)
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin privileges required for provisioning." },
        { status: 403 }
      );
    }

    // 3. Payload Extraction & Validation
    const body = await req.json();
    const { name, email, password, role, branchId } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields (name, email, password, role)." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Access Key must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // 4. Branch Dependency Check
    const BRANCH_DEPENDENT_ROLES: UserRole[] = ["FRONT_DESK", "COUNSELLOR", "FIELD_SALES"];
    if (BRANCH_DEPENDENT_ROLES.includes(role) && !branchId) {
      return NextResponse.json(
        { error: `Branch allocation is mandatory for the '${role}' role.` },
        { status: 400 }
      );
    }

    // 5. Collision Check: Verify if identity exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A node with this identity (email) already exists in the matrix." },
        { status: 409 }
      );
    }

    // 6. Security Injection: Hash Password
    const hashedPassword = await hashPassword(password);

    // 7. Tactical Provisioning
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as UserRole,
        branchId: branchId || null,
        // Since we are moving to Credentials provider with hashed passwords,
        // we might want to store the password in a field if we are using custom auth
        // However, PrismaAdapter standard model doesn't have a 'password' field.
        // I will add a 'password' field to the User model in a separate step if needed,
        // but wait, I can just use the 'accounts' table or add it to the 'users' table.
        // Actually, for Credentials provider, we usually add a 'password' field to 'User'.
      },
    });

    // NOTE: To support Credentials Provider, I will need to update the Prisma schema 
    // to include a password hash field in the User model. 
    // I'll do this in the next turn before attempting the insert.

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role },
    });

  } catch (error: any) {
    console.error("💥 [USER_PROVISIONING_FATAL]", error);
    return NextResponse.json(
      { error: "Internal System Error during tactical provisioning." },
      { status: 500 }
    );
  }
}
