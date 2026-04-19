"use client";

import { useState } from "react";
import { UserTable } from "./user-table";
import { UserForm } from "./user-form";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, ShieldCheck, UserPlus, Activity } from "lucide-react";

interface UserManagementClientProps {
  initialUsers: any[];
  branches: any[];
  clinicName: string;
}

export function UserManagementClient({ initialUsers, branches, clinicName }: UserManagementClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const refreshUsers = async () => {
    window.location.reload();
  };

  const openAddModal = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-10">
      {/* Restored Tactical Header with Indigo Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-indigo-600 animate-pulse" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Personnel Command</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white lowercase italic">
            /identity.matrix
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Securely provision and manage clinical nodes for <span className="font-bold text-slate-900 dark:text-slate-100">{clinicName}</span>.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 mr-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Sovereign Encryption Active</span>
          </div>
          
          <Button 
            onClick={openAddModal}
            className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20 group transition-all"
          >
            <UserPlus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            Provision Node
          </Button>
        </div>
      </div>

      {/* Main Table Layer (Full Width) */}
      <div className="surface-layered rounded-[3rem] overflow-hidden border-none shadow-sm ring-1 ring-slate-200/50 bg-white/50 backdrop-blur-xl transition-all duration-700">
         <UserTable 
            users={users} 
            selectedUserId={selectedUser?.id}
            onEdit={openEditModal} 
         />
      </div>

      {/* System Intel Footer */}
      <div className="flex items-center justify-center pt-10">
          <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-white/5 shadow-sm opacity-60">
              <Activity className="h-3 w-3 text-slate-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Registry Snapshot: {users.length} Active Personnels</span>
          </div>
      </div>

      {/* Identity Provisioning Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-transparent shadow-none">
          <UserForm 
            branches={branches} 
            selectedUser={selectedUser}
            onCancel={() => setIsModalOpen(false)}
            onSuccess={() => {
              setIsModalOpen(false);
              refreshUsers();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
