import React, { Suspense } from "react";
import { NotificationsListener } from "@/components/notifications-listener";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { CommandCenter } from "@/components/command-center";
import { LeadDetailSheet } from "@/components/leads/lead-detail-sheet";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || "ScalerX Lab";

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background selection:bg-primary/20">
          <NotificationsListener />

          <AppSidebar />

          <main className="flex-1 flex flex-col min-w-0 bg-slate-50/30 dark:bg-black/20">
            <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between gap-2 border-b border-slate-200/40 dark:border-white/5 bg-background/80 backdrop-blur-xl px-8 shadow-[0_2px_20px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-5">
                <SidebarTrigger className="-ml-1 text-slate-400 hover:text-primary transition-all hover:scale-110" />
                <Separator orientation="vertical" className="mr-2 h-5 bg-slate-200 dark:bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Active Node</span>
                  <h1 className="text-sm font-black text-slate-900 dark:text-white lowercase tracking-tighter italic">
                    {clinicName.toLowerCase()} hub
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="hidden sm:block">
                  <CommandCenter />
                </div>

                <div className="hidden md:flex flex-col items-end gap-0.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{clinicName}</span>
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full ring-1 ring-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Stream
                  </span>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200/60 dark:border-white/5 flex items-center justify-center text-[10px] font-black text-slate-500 ring-1 ring-slate-100 dark:ring-white/10 transition-transform hover:rotate-3">
                  JD
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-auto p-10 lg:p-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
              {children}
            </div>

            <Suspense fallback={null}>
              <LeadDetailSheet />
            </Suspense>
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
