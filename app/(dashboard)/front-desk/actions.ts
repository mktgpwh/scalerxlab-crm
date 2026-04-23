"use client";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Fetches all leads with status APPOINTMENT_SCHEDULED
 * In a real production app, this would be a server function (use server), 
 * but for this UI execution we'll use a standard fetch pattern or client-side 
 * interaction as requested for 'simulating' or 'triggering' the action.
 * 
 * UPDATE: I will implement the client-side logic in the page 
 * but provide the logic here for the server boundary.
 */

export async function checkInLead(leadId: string) {
  try {
    const res = await fetch(`/api/front-desk/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId })
    });
    return await res.json();
  } catch (error) {
    return { error: "Check-in failed" };
  }
}
