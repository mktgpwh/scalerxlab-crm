"use client";

import { useState } from "react";
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
import { createUserAction } from "./actions";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Mail, User, Lock, ChevronRight } from "lucide-react";

export function AddUserForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "AGENT",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createUserAction(formData);
      
      if (result.success) {
        toast.success("Node Provisioned", {
          description: `${formData.name} was successfully initialized in the matrix.`,
        });
        setFormData({ name: "", email: "", role: "AGENT", password: "" });
      } else {
        toast.error("Provisioning Failed", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("System Error", {
        description: "An unexpected error occurred during tactical provisioning.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      <div className="space-y-2.5">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Legal Name</Label>
        <div className="relative group">
          <User className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Dr. Smith"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="h-14 pl-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tactical Identifier (Email)</Label>
        <div className="relative group">
          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
          <Input
            type="email"
            placeholder="smith@scalerxlab.com"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="h-14 pl-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Role</Label>
          <Select 
            value={formData.role} 
            onValueChange={(value) => setFormData({ ...formData, role: value || "AGENT" })}
          >
            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-xl">
              <SelectItem value="DOCTOR" className="rounded-xl font-bold text-xs uppercase tracking-wider">Doctor</SelectItem>
              <SelectItem value="COUNSELOR" className="rounded-xl font-bold text-xs uppercase tracking-wider">Counsellor</SelectItem>
              <SelectItem value="TELESALES" className="rounded-xl font-bold text-xs uppercase tracking-wider">Tele Agent (Sales)</SelectItem>
              <SelectItem value="FIELD_SALES" className="rounded-xl font-bold text-xs uppercase tracking-wider">Field Sales</SelectItem>
              <SelectItem value="ORG_ADMIN" className="rounded-xl font-bold text-xs uppercase tracking-wider">Admin</SelectItem>
              <SelectItem value="AGENT" className="rounded-xl font-bold text-xs uppercase tracking-wider">General Agent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Key</Label>
          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
            <Input
              type="password"
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="h-14 pl-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-16 rounded-[1.25rem] bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl group transition-all"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <span className="flex items-center justify-center">
              Execute Provisioning
              <ChevronRight className="h-4 w-4 ml-3 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
