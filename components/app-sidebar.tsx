"use client";

import Image from "next/image";
import {
  Users,
  LayoutDashboard,
  History,
  Settings,
  Sparkles,
  Command,
  BarChart3,
  Home,
  Phone,
  Puzzle,
  LogOut,
  ShieldCheck,
  Radio,
  PowerOff,
  Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";
import { IntegrationIcon } from "@/components/ui/integration-icon";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { toggleUserPresence } from "@/app/(dashboard)/settings/users/actions";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || "ScalerX Lab";

const items = [
  { title: "Command Center", url: "/", icon: Home, label: "Overview" },
  { title: "Sovereign Intelligence", url: "/intelligence", icon: Sparkles, label: "AgentX" },
  { title: "Lead Funnels", url: "/pipeline", icon: LayoutDashboard, label: "Pipelines" },
  { title: "Billing Terminal", url: "/billing", icon: Receipt, label: "Revenue Node" },
  { title: "Intelligence Matrix", url: "/matrix", icon: BarChart3, label: "MIS Insights" },
  { title: "Shared Inbox", url: "/inbox", icon: (props: any) => <IntegrationIcon slug="whatsapp" {...props} />, label: "WhatsApp" },
  { title: "Call Management", url: "/calls", icon: Phone, label: "Telephony" },
  { title: "Connections", url: "/integrations", icon: Puzzle, label: "Expansion Hub" },
  { title: "Activity Logs", url: "/activity", icon: History },
  { title: "Personnel Matrix", url: "/settings/users", icon: Users, label: "Command Roster" },
  { title: "Security & Compliance", url: "/security", icon: ShieldCheck, label: "Privacy Vault" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;
  const role = user?.role;
  const userId = user?.id;

  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isPresenceLoading, setIsPresenceLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setIsOnline(user.isOnline || false);
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const handleTogglePresence = async () => {
    if (!userId) return;
    setIsPresenceLoading(true);
    const newStatus = !isOnline;
    const result = await toggleUserPresence(userId, newStatus);
    setIsPresenceLoading(false);
    
    if (result.success) {
      setIsOnline(newStatus);
      toast.success(newStatus ? "Back on Operations" : "Node Standby", {
        description: newStatus ? "You are now receiving live leads." : "Leads will pass to other online nodes.",
        icon: newStatus ? <Radio className="h-4 w-4 text-emerald-500 animate-pulse" /> : <PowerOff className="h-4 w-4 text-slate-400" />
      });
    }
  };

  // Filter items based on role
  // Filter items based on new strict strict roles
  const filteredItems = items.filter((item) => {
    // 1. Super Admin / Sales Admin see everything
    if (role === "SUPER_ADMIN" || role === "SALES_ADMIN") return true;

    // 2. Front Desk restrictive view
    if (role === "FRONT_DESK") {
      return ["Command Center", "Lead Funnels", "Billing Terminal"].includes(item.title);
    }

    // 3. Counsellor (restricted from high-level, telephony, and command center)
    if (role === "COUNSELLOR") {
      return ["Lead Funnels", "Billing Terminal", "Shared Inbox", "Activity Logs"].includes(item.title);
    }

    // 4. Sales Users & Field Sales (General operational view)
    if (role === "SALES_USER" || role === "FIELD_SALES") {
      if (["Connections", "Sovereign Intelligence", "Security & Compliance", "Intelligence Matrix", "Personnel Matrix"].includes(item.title)) {
        return false;
      }
      return true;
    }

    return false; // Default: hide everything if role is unrecognized
  });

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200/50 bg-white/80 backdrop-blur-xl shadow-2xl max-md:bg-white/98 max-md:backdrop-blur-none">
      <SidebarHeader className="h-20 flex items-center px-4 bg-transparent border-b border-slate-100">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push("/")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-white ring-1 ring-slate-200 shadow-sm transition-all group-hover:scale-110 group-hover:rotate-3 shrink-0 p-1">
            <Image src="/scalerxlab-logo.png" alt="Pahlajani's" width={32} height={32} className="object-contain w-full h-full" priority />
          </div>
          <div className="flex flex-col gap-0 transition-opacity group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none min-w-0 pl-1">
             <span className="text-sm font-black tracking-tighter text-slate-900 truncate">Pahlajani's</span>
             <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/80">Business OS</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 mt-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-4 px-2">Core Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {filteredItems.map((item) => {
                const isActive = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      tooltip={item.title}
                      isActive={isActive}
                      className={`h-12 transition-all duration-300 rounded-none group relative overflow-hidden cursor-pointer ${
                        isActive ? "bg-primary/10 text-black font-black border-l-4 border-primary" : "text-slate-600 hover:bg-slate-100/50 hover:text-slate-950"
                      }`}
                    >
                      <div className="flex items-center gap-3 w-full px-2">
                        <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-900"}`} />
                        <div className="flex flex-col">
                          <span className="font-bold text-sm tracking-tight">{item.title}</span>
                          {item.label && <span className="text-[9px] font-medium opacity-60 group-data-[collapsible=icon]:hidden">{item.label}</span>}
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-4 px-2">System Health</SidebarGroupLabel>
          <div className="px-2 space-y-4 group-data-[collapsible=icon]:hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600">AgentX Stream</span>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                  Active
                </span>
              </div>
            </div>
            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 leading-none">AI Priority</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-[1.4] mb-3">AI scoring active.</p>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-[75%] bg-primary shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              </div>
            </div>
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-100 gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleTogglePresence}
              disabled={isPresenceLoading}
              className={cn(
                "h-12 rounded-xl px-3 transition-all cursor-pointer group/pres",
                isOnline ? "bg-emerald-500/10 text-emerald-600 font-bold" : "bg-slate-100/50 text-slate-500"
              )}
            >
              {isOnline ? (
                <div className="flex items-center gap-3">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest group-data-[collapsible=icon]:hidden">Online & Active</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <PowerOff className="h-4 w-4" />
                  <span className="font-bold text-[10px] uppercase tracking-widest group-data-[collapsible=icon]:hidden">Offline (Standby)</span>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton 
              render={<Link href="/settings/users" />}
              isActive={pathname.startsWith("/settings/users")}
              className={cn("h-10 rounded-xl px-3 transition-all cursor-pointer", pathname.startsWith("/settings/users") ? "bg-primary/10 text-primary font-bold shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}
            >
              <Settings className="h-4 w-4" />
              <span className="font-bold text-[11px] uppercase tracking-widest group-data-[collapsible=icon]:hidden">System Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="h-10 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl px-3 transition-all cursor-pointer active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-black text-[11px] uppercase tracking-widest group-data-[collapsible=icon]:hidden">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
