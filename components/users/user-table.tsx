import { Badge } from "@/components/ui/badge";
import { Mail, GitBranch, ShieldAlert, CircleDot, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface UserTableProps {
  users: any[];
  selectedUserId?: string | null;
  onEdit: (user: any) => void;
}

export function UserTable({ users, selectedUserId, onEdit }: UserTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/5">
            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identity</th>
            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Designation</th>
            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Allocation</th>
            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {users.map((user) => (
            <tr 
              key={user.id} 
              className={cn(
                "group transition-all duration-300",
                selectedUserId === user.id 
                  ? "bg-primary/[0.03] dark:bg-primary/[0.05]" 
                  : "hover:bg-slate-50/50 dark:hover:bg-white/5"
              )}
            >
              <td className="px-8 py-6">
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "h-12 w-12 rounded-[1rem] flex items-center justify-center text-xs font-black border transition-all duration-500 shadow-sm",
                    user.role === "SUPER_ADMIN" 
                      ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50" 
                      : "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/50",
                    selectedUserId === user.id && "ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900"
                  )}>
                    {user.name?.[0] || user.email[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-sm text-slate-900 dark:text-white tracking-tighter">{user.name || "Unknown Identity"}</span>
                    <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                      {user.email}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-8 py-6">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border",
                    user.role === "SUPER_ADMIN" 
                      ? "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50" 
                      : "text-slate-500 bg-slate-50 border-slate-100 dark:bg-white/5 dark:border-white/10"
                  )}>
                    {user.role.replace("_", " ")}
                  </span>
                </div>
              </td>
              <td className="px-8 py-6">
                 {user.branch ? (
                    <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-900 dark:text-white tracking-tighter">{user.branch.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user.branch.city}</span>
                    </div>
                 ) : (
                    <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest italic">Global Node</span>
                 )}
              </td>
              <td className="px-8 py-6">
                {user.isOnline ? (
                  <div className="flex items-center gap-2 text-emerald-500">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Active</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-300 dark:text-slate-700">
                    <div className="h-2 w-2 rounded-full bg-current" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Offline</span>
                  </div>
                )}
              </td>
              <td className="px-8 py-6 text-right">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onEdit(user)}
                  className={cn(
                    "rounded-xl transition-all duration-300",
                    selectedUserId === user.id 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" 
                      : "text-slate-300 hover:text-primary hover:bg-primary/10"
                  )}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

