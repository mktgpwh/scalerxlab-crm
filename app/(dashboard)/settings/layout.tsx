"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Users, 
  Webhook, 
  Settings2, 
  LayoutGrid, 
  Smartphone,
  ShieldCheck
} from "lucide-react";

const navItems = [
  {
    name: "Users",
    href: "/settings/users",
    icon: Users,
    description: "Manage clinical personnel and permissions"
  },
  {
    name: "Webhooks",
    href: "/settings/webhooks",
    icon: Webhook,
    description: "Inbound and outbound data triggers"
  },
  {
    name: "Integrations",
    href: "/settings/integrations",
    icon: LayoutGrid,
    description: "WATI, Meta, and Telephony Hub"
  },
  {
    name: "System Config",
    href: "/settings/config",
    icon: Settings2,
    description: "Workspace parameters and metadata"
  }
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-8">
      {/* Secondary Navigation Bar */}
      <div className="flex flex-col gap-1.5 ring-1 ring-slate-200/50 dark:ring-white/5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-1.5 rounded-[2rem] shadow-sm">
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-6 py-3 rounded-2xl transition-all duration-300 group whitespace-nowrap",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 transition-transform group-hover:scale-110",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                )} />
                <span className="text-[11px] font-black uppercase tracking-widest">{item.name}</span>
                
                {isActive && (
                    <div className="w-1 h-1 rounded-full bg-indigo-200/50 animate-pulse ml-1" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Settings Content */}
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
        {children}
      </div>
    </div>
  );
}
