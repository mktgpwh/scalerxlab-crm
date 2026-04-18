import { UserRole } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: UserRole;
    branchId: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      branchId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: UserRole;
    branchId: string | null;
  }
}

declare module "@auth/core/types" {
  interface User {
    role: UserRole;
    branchId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    branchId: string | null;
  }
}
