"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Mail, User, Lock, GitBranch, X, Trash2 } from "lucide-react";

interface UserFormProps {
  branches: Array<{ id: string; name: string; city: string }>;
  selectedUser: any | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function UserForm({ branches, selectedUser, onSuccess, onCancel }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "SALES_USER",
    password: "",
    branchId: "",
    isActive: true,
  });

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        name: selectedUser.name || "",
        email: selectedUser.email || "",
        role: selectedUser.role || "SALES_USER",
        password: "", // Don't pre-fill password
        branchId: selectedUser.branchId || "",
        isActive: selectedUser.isActive ?? true,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        role: "SALES_USER",
        password: "",
        branchId: "",
        isActive: true,
      });
    }
  }, [selectedUser]);

  const isBranchRequired = ["FRONT_DESK", "COUNSELLOR", "FIELD_SALES"].includes(formData.role);
  const isEdit = !!selectedUser;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBranchRequired && !formData.branchId) {
      toast.error("Constraint Violation", {
        description: "Branch allocation is mandatory for this role.",
      });
      return;
    }

    if (!isEdit && formData.password.length < 8) {
      toast.error("Security Violation", {
        description: "Access Key must be at least 8 characters long for new identities.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { ...formData, id: selectedUser.id } : formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(isEdit ? "Identity Updated" : "Identity Provisioned", {
          description: `${formData.name} configuration synchronized.`,
        });
        onSuccess();
      } else {
        toast.error("Operation Failed", { description: result.error });
      }
    } catch (error) {
      toast.error("System Error", { description: "Tactical sync failure." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser || !confirm("Are you sure you want to decommission this node?")) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users?id=${selectedUser.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Node Decommissioned");
        onSuccess();
      } else {
        const result = await response.json();
        toast.error("Decommission Failed", { description: result.error });
      }
    } catch (err) {
      toast.error("System Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-none overflow-hidden">
      <div className="p-10 pb-6 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black tracking-tighter italic lowercase text-zinc-900 dark:text-white">
            {isEdit ? "/update.identity" : "/provision.node"}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {isEdit ? "Modifying existing matrix node" : "Onboarding new tactical node"}
          </p>
        </div>
        {onCancel && (
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-xl hover:bg-zinc-200/50">
            <X className="h-5 w-5 text-zinc-400" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Legal Name</Label>
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Clinical Agent"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-14 pl-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold focus:ring-primary/20 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tactical Identifier (Email)</Label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
              <Input
                type="email"
                placeholder="agent@scalerxlab.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-14 pl-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold focus:ring-primary/20 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Access Key {isEdit && "(Leave blank for no change)"}
            </Label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
              <Input
                type="password"
                placeholder="••••••••"
                required={!isEdit}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-14 pl-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold focus:ring-primary/20 transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">System Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: string | null) => setFormData({ ...formData, role: value || "SALES_USER", branchId: "" })}
              >
                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-sm">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="SUPER_ADMIN" className="rounded-xl font-bold py-3">Super Admin</SelectItem>
                  <SelectItem value="SALES_ADMIN" className="rounded-xl font-bold py-3">Sales Admin</SelectItem>
                  <SelectItem value="SALES_USER" className="rounded-xl font-bold py-3">Sales User</SelectItem>
                  <SelectItem value="FRONT_DESK" className="rounded-xl font-bold py-3">Front Desk</SelectItem>
                  <SelectItem value="COUNSELLOR" className="rounded-xl font-bold py-3">Counsellor</SelectItem>
                  <SelectItem value="FIELD_SALES" className="rounded-xl font-bold py-3">Field Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isBranchRequired && (
              <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-500">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Clinical Center Allocation</Label>
                <div className="relative group">
                    <GitBranch className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 z-10 text-primary" />
                    <Select 
                        value={formData.branchId} 
                        onValueChange={(value: string | null) => setFormData({ ...formData, branchId: value || "" })}
                    >
                        <SelectTrigger className="h-14 pl-14 rounded-2xl bg-primary/5 border-none ring-1 ring-primary/20 font-black text-primary text-sm">
                            <SelectValue placeholder="Select branch localization" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                            {branches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id as string} className="rounded-xl font-bold py-3">
                                    {branch.name} ({branch.city})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              </div>
            )}
          </div>

          <div className="pt-8 space-y-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-16 rounded-[1.25rem] bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/20 group transition-all"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center justify-center">
                  {isEdit ? "Sync Identity Update" : "Activate Access Identity"}
                  <ShieldCheck className="h-4 w-4 ml-3 group-hover:scale-110 transition-transform" />
                </span>
              )}
            </Button>

            {isEdit && (
              <Button
                type="button"
                variant="ghost"
                disabled={loading}
                onClick={handleDelete}
                className="w-full h-12 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 text-[10px] font-black uppercase tracking-widest"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Decommission Node
              </Button>
            )}
            
            {isEdit && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="w-full h-10 text-[9px] font-bold text-slate-400 uppercase tracking-widest"
              >
                Cancel / Reset
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
