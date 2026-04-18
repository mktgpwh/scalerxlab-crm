"use client";

import { Badge } from "@/components/ui/badge";
import { Mail, GitBranch, ShieldAlert, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserTableProps {
  users: any[];
}

export function UserTable({ users }: UserTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/50">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border/50 bg-muted/50">
            <th className="px-8 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Identity</th>
            <th className="px-8 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Designation</th>
            <th className="px-8 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Allocation</th>
            <th className="px-8 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {users.map((user) => (
            <tr key={user.id} className="group hover:bg-muted/30 transition-all duration-200">
              <td className="px-8 py-5">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center text-xs font-semibold border transition-transform group-hover:scale-105",
                    user.role === "SUPER_ADMIN" 
                      ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50" 
                      : "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/50"
                  )}>
                    {user.name?.[0] || user.email[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-foreground tracking-tight">{user.name || "Unknown Identity"}</span>
                    <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                      {user.email}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-8 py-5">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[11px] font-semibold px-2 py-0.5 rounded-md border",
                    user.role === "SUPER_ADMIN" 
                      ? "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50" 
                      : "text-muted-foreground bg-muted border-border/50"
                  )}>
                    {user.role.replace("_", " ")}
                  </span>
                </div>
              </td>
              <td className="px-8 py-5">
                 {user.branch ? (
                    <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-foreground tracking-tight">{user.branch.name}</span>
                        <span className="text-[10px] text-muted-foreground">{user.branch.city}</span>
                    </div>
                 ) : (
                    <span className="text-[11px] font-medium text-muted-foreground/60 italic">Global Access</span>
                 )}
              </td>
              <td className="px-8 py-5">
                {user.isOnline ? (
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900/50 font-semibold text-[10px] px-2.5 h-6">
                    <CircleDot className="h-2.5 w-2.5 mr-2 animate-pulse" /> ONLINE
                  </Badge>
                ) : (
                  <Badge className="bg-muted text-muted-foreground border-transparent hover:bg-muted font-medium text-[10px] px-2.5 h-6">
                    OFFLINE
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
