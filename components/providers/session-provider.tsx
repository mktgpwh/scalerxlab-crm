"use client";

import { SessionProvider } from "next-auth/react";

export const NextAuthConfigProvider = ({ children }: { children: React.ReactNode }) => {
  return <SessionProvider>{children}</SessionProvider>;
};
