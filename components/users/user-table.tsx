"use client";

import { Badge } from "@/components/ui/badge";
import { Mail, GitBranch, ShieldAlert, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserTableProps {
  users: any[];
}

export function UserTable({ users }: UserTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50 italic">
            <th className="px-12 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Personnel Identity</th>
            <th className="px-12 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Tactical Designation</th>
            <th className="px-12 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Center Allocation</th>
            <th className="px-12 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {users.map((user) => (
            <tr key={user.id} className="group hover:bg-slate-50/30 transition-all duration-300">
              <td className="px-12 py-7">
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "h-12 w-12 rounded-[1.25rem] flex items-center justify-center text-[13px] font-black ring-1 transition-transform group-hover:scale-110",
                    user.role === "SUPER_ADMIN" 
                      ? "bg-rose-500/10 text-rose-600 ring-rose-500/20" 
                      : "bg-indigo-500/10 text-indigo-600 ring-indigo-500/20"
                  )}>
                    {user.name?.[0] || user.email[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-black text-sm text-slate-900 tracking-tight">{user.name || "Unknown Identity"}</span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wide">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-12 py-7">
                <div className="flex items-center gap-2.5">
                  {user.role === "SUPER_ADMIN" ? (
                    <ShieldAlert className="h-4 w-4 text-rose-500" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  )}
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    user.role === "SUPER_ADMIN" ? "text-rose-600" : "text-slate-600"
                  )}>
                    {user.role.replace("_", " ")}
                  </span>
                </div>
              </td>
              <td className="px-12 py-7">
                 {user.branch ? (
                    <div className="flex items-center gap-2">
                        <GitBranch className="h-3.5 w-3.5 text-slate-300" />
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{user.branch.name}</span>
                            <span className="text-[9px] font-bold text-slate-400 lowercase italic">{user.branch.city}</span>
                        </div>
                    </div>
                 ) : (
                    <span className="text-[10px] font-bold text-slate-300 italic uppercase tracking-widest">Global Access</span>
                 )}
              </td>
              <td className="px-12 py-7">
                {user.isOnline ? (
                  <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] uppercase tracking-tighter px-3 h-6 shadow-lg shadow-emerald-500/20">
                    <CircleDot className="h-2.5 w-2.5 mr-1.5 animate-pulse" /> LIVE
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-400 border-none font-black text-[9px] uppercase tracking-tighter px-3 h-6">
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
