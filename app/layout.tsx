import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NextAuthConfigProvider } from "@/components/providers/session-provider";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Pahlajani's BOS",
  description: "AI-powered clinical operations and lead intelligence platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${inter.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans tracking-tight">
        <NextAuthConfigProvider>
          {children}
          <Toaster />
        </NextAuthConfigProvider>
      </body>
    </html>
  );
}
