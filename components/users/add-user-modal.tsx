"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Mail, User, Lock, ChevronRight, GitBranch } from "lucide-react";

interface AddUserModalProps {
  branches: Array<{ id: string; name: string; city: string }>;
}

export function AddUserModal({ branches }: AddUserModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "SALES_USER",
    password: "",
    branchId: "",
  });

  const isBranchRequired = ["FRONT_DESK", "COUNSELLOR", "FIELD_SALES"].includes(formData.role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBranchRequired && !formData.branchId) {
      toast.error("Constraint Violation", {
        description: "Branch allocation is mandatory for tactical operational roles.",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Security Violation", {
        description: "Access Key must be at least 8 characters long.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Identity Provisioned", {
          description: `${formData.name} is now active in the matrix.`,
        });
        setOpen(false);
        setFormData({ name: "", email: "", role: "SALES_USER", password: "", branchId: "" });
        window.location.reload(); // Quick refresh to update table
      } else {
        toast.error("Provisioning Failed", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Registry Error", {
        description: "An unexpected error occurred during tactical sync.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
            <Button className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl group transition-all">
                <ChevronRight className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform" />
                Provision Node
            </Button>
        }
      />
      <DialogContent className="sm:max-w-[520px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white/95 backdrop-blur-xl">
        <div className="p-8 pt-12 text-center bg-slate-50/50 border-b border-slate-100">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tighter italic lowercase text-slate-900">
              New Identity Sync
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest pt-2">
              Onboard clinical staff into the Sovereign Intelligence Matrix
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-5">
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
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Key (8+ Chars)</Label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-14 pl-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold focus:ring-primary/20 transition-all text-sm"
                  />
                </div>
              </div>
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

            <div className="pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-16 rounded-[1.25rem] bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl group transition-all"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center">
                    Activate Access Identity
                    <ShieldCheck className="h-4 w-4 ml-3 group-hover:scale-110 transition-transform" />
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
