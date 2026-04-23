import type { NextAuthConfig } from "next-auth";

export type EdgeUserRole = 
  | 'SUPER_ADMIN' 
  | 'TELE_SALES_ADMIN' 
  | 'TELE_SALES' 
  | 'FIELD_SALES_ADMIN' 
  | 'FIELD_SALES' 
  | 'BILLING' 
  | 'FRONT_DESK' 
  | 'COUNSELLOR';

export default {
  providers: [], // Configured in auth.ts
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role as EdgeUserRole;
        token.branchId = (user as any).branchId;
        token.id = user.id;
        token.isOnline = (user as any).isOnline || false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role as EdgeUserRole;
        (session.user as any).branchId = token.branchId as string | null;
        (session.user as any).isOnline = token.isOnline as boolean;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
