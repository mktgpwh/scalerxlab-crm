"use client";

import { useState } from "react";
import { UserTable } from "./user-table";
import { UserForm } from "./user-form";
import { cn } from "@/lib/utils";

interface UserManagementClientProps {
  initialUsers: any[];
  branches: any[];
}

export function UserManagementClient({ initialUsers, branches }: UserManagementClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const refreshUsers = async () => {
    try {
      const response = await fetch("/api/admin/users/list"); // I'll need to create this or use a server action
      // For now, I'll just use window.location.reload() for reliable refresh
      // or implement a simple fetch.
      window.location.reload();
    } catch (err) {
      console.error("Refresh failed");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Pane: Master Table */}
      <div className={cn(
        "transition-all duration-500",
        selectedUser ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12"
      )}>
        <div className="surface-layered rounded-[3rem] overflow-hidden border-none shadow-sm ring-1 ring-slate-200/50 bg-white/50 backdrop-blur-xl">
           <UserTable 
              users={users} 
              selectedUserId={selectedUser?.id}
              onEdit={setSelectedUser} 
           />
        </div>
      </div>

      {/* Right Pane: Identity Detail/Form */}
      <div className={cn(
        "lg:col-span-5 xl:col-span-4 sticky top-28 transition-all duration-500 animate-in fade-in slide-in-from-right-4",
        !selectedUser && "hidden lg:block lg:opacity-50 grayscale-[0.5] pointer-events-none"
      )}>
        <UserForm 
          branches={branches} 
          selectedUser={selectedUser}
          onCancel={() => setSelectedUser(null)}
          onSuccess={() => {
            setSelectedUser(null);
            refreshUsers();
          }}
        />
        
        {!selectedUser && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/20 backdrop-blur-[2px] rounded-[2.5rem]">
             <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-3 text-center">
                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select node to modify<br/>or use provision trigger</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
