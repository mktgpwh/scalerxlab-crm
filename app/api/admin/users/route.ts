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
    const { name, email, password, role, branchId, phone } = body;

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

    if (phone && phone.length > 15) {
      return NextResponse.json(
        { error: "Tactical Comms (Phone) must not exceed 15 characters." },
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
        phone: phone || null,
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

/**
 * PATCH /api/admin/users
 * Update an existing clinical or administrative node.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, email, password, role, branchId, isActive, phone } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing Target ID" }, { status: 400 });
    }

    const updateData: any = {
      name,
      email,
      role: role as UserRole,
      branchId: branchId || null,
      phone: phone || null,
      isActive,
      updatedAt: new Date(),
    };

    if (password && password.length >= 8) {
      updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("💥 [USER_UPDATE_FATAL]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users
 * Decommission a clinical node.
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing Target ID" }, { status: 400 });
    }

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json({ error: "Cannot decommission self" }, { status: 400 });
    }

    // 3. OFFBOARDING HOOK: Reassign leads before decommissioning
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, managerId: true }
    });

    if (userToDelete && ['FIELD_SALES', 'TELE_SALES'].includes(userToDelete.role)) {
      const managerId = userToDelete.managerId; // The designated Admin for this node
      if (managerId) {
        await prisma.lead.updateMany({ 
          where: { ownerId: userToDelete.id }, 
          data: { ownerId: managerId } 
        });
        console.log(`[OFFBOARDING] Universal Reassignment: Secured leads from ${userToDelete.id} (Role: ${userToDelete.role}) and attributed to manager ${managerId}`);
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("💥 [USER_DELETE_FATAL]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
