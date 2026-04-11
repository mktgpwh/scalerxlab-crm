"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function createUserAction(formData: {
  name: string;
  email: string;
  role: string;
  password?: string;
}) {
  try {
    // 1. Initialize Supabase Admin client (Service Role)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { name, email, role, password } = formData;

    // 2. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || "ScalerX123!", // Default password if none provided
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        return { error: "A user with this email already exists in authentication system." };
      }
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: "Failed to create authentication record." };
    }

    // 3. Create user in Prisma Database
    await prisma.user.create({
      data: {
        id: authData.user.id,
        email,
        name,
        role: role as any,
        isActive: true,
      },
    });

    revalidatePath("/settings/team");
    return { success: true };
  } catch (error: any) {
    console.error("User creation error:", error);
    return { error: "An unexpected system error occurred while provisioning the user." };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) return { error: authError.message };

    // Delete from Prisma (Cascade or separate)
    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/settings/team");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateDistributionStrategy(strategy: "ROUND_ROBIN" | "MANUAL") {
  try {
    await prisma.systemSettings.update({
      where: { id: "singleton" },
      data: { leadDistributionStrategy: strategy }
    });
    revalidatePath("/settings/team");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
