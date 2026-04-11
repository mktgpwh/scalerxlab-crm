"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const branchSchema = z.object({
  name: z.string().min(2, "Name is required"),
  city: z.string().min(2, "City is required"),
  isHQ: z.boolean().default(false),
});

export async function createBranchAction(data: z.infer<typeof branchSchema>) {
  try {
    const branch = await prisma.branch.create({
      data: {
        name: data.name,
        city: data.city,
        isHQ: data.isHQ,
        isActive: true,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/leads");
    return { success: true, branch };
  } catch (error) {
    console.error("Failed to create branch:", error);
    return { error: "Failed to create center node." };
  }
}

export async function toggleBranchStatusAction(id: string, isActive: boolean) {
  try {
    await prisma.branch.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath("/settings");
    revalidatePath("/leads");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle branch status:", error);
    return { error: "Failed to update center state." };
  }
}
