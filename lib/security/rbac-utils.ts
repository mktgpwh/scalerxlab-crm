import { UserRole } from "@prisma/client";

interface SessionUser {
  id: string;
  role: UserRole;
  branchId: string | null;
}

/**
 * Generates a Prisma 'where' clause for the Lead model based on user role and branch.
 * Implementing strict data-level isolation for ScalerXLab.
 */
export function getLeadFilter(user?: SessionUser): any {
  if (!user) return { id: "none" };

  // 1. GLOBAL ACCESS: Super Admin see everything
  if (user.role === UserRole.SUPER_ADMIN) {
    return { tenantId: "org_pahlajani_001" };
  }

  // 2. SALES ADMIN ACCESS: See all SALES_USER leads + their own
  if (user.role === UserRole.SALES_ADMIN) {
    return {
      OR: [
        { owner: { role: UserRole.SALES_USER } },
        { ownerId: user.id }
      ]
    };
  }

  // 3. OWNER-LEVEL ISOLATION: Operational roles only see their own assigned leads
  const operationalRoles: UserRole[] = [UserRole.FIELD_SALES, UserRole.SALES_USER, UserRole.COUNSELLOR];
  if (operationalRoles.includes(user.role)) {
    return {
      ownerId: user.id,
    };
  }

  // 4. BRANCH ACCESS: Front Desk sees all branch leads
  if (user.role === UserRole.FRONT_DESK) {
    return {
      branchId: user.branchId || "HQ",
    };
  }

  return { ownerId: user.id };
}

/**
 * Generates a Prisma 'where' clause for Revenue (Invoice/Payment) isolation.
 */
export function getRevenueFilter(user?: SessionUser): any {
  if (!user) return { id: "none" };

  // 1. GLOBAL ACCESS
  if (user.role === UserRole.SUPER_ADMIN) return {};

  // 2. SALES ADMIN: See revenue for all SALES_USERS + self
  if (user.role === UserRole.SALES_ADMIN) {
    return {
      lead: {
        OR: [
          { owner: { role: UserRole.SALES_USER } },
          { ownerId: user.id }
        ]
      }
    };
  }

  // 3. FIELD SALES: See only their own assigned lead revenue
  if (user.role === UserRole.FIELD_SALES) {
    return {
      lead: { ownerId: user.id }
    };
  }

  // 4. FRONT DESK: See only invoices they created
  if (user.role === UserRole.FRONT_DESK) {
    return {
      createdBy: user.id
    };
  }

  return { id: "none" };
}

/**
 * Checks if a user can access a specific route or action.
 */
export function canAccess(role: UserRole, requiredRoles: UserRole[]) {
  return requiredRoles.includes(role);
}
