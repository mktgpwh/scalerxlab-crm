"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { UserPlus, Loader2, Sparkles, User, Phone, Mail, Hash } from "lucide-react";
import { createLeadAction } from "@/app/(dashboard)/leads/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface NewLeadDialogProps {
  userRole: string;
  team: any[];
  branches: any[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewLeadDialog({ userRole, team, branches, open: externalOpen, onOpenChange: setExternalOpen }: NewLeadDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen || setInternalOpen;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    category: "OTHER" as any,
    ownerId: "" as string | null,
    branchId: "",
  });

  const router = useRouter();
  const isAdmin = userRole === "ORG_ADMIN" || userRole === "SUPER_ADMIN";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length < 10) {
        toast.error("Validation Error", { description: "Node frequency (phone) must be at least 10 digits." });
        return;
    }

    setLoading(true);
    try {
      const result = await createLeadAction({
        ...formData,
        source: "MANUAL_ENTRY",
        ownerId: (formData.ownerId && formData.ownerId !== "unassigned") ? formData.ownerId : null,
      });

      if (result.error) {
        toast.error("Signal Collision", { description: result.error });
      } else {
        toast.success("Lead Signal Captured", { 
          description: `${formData.name} has been successfully added to the matrix.` 
        });
        setOpen(false);
        setFormData({ name: "", phone: "", email: "", category: "OTHER", ownerId: "", branchId: "" });
        router.refresh();
      }
    } catch (error) {
      toast.error("Interface Error", { description: "Failed to establish link with Control Room." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button className="h-10 px-4 rounded-xl bg-slate-900 border-none hover:bg-black text-white text-[10px] font-semibold tracking-tight uppercase tracking-widest shadow-lg shadow-black/10 group transition-all">
            <UserPlus className="h-3.5 w-3.5 mr-2 group-hover:scale-110 transition-transform" />
            Manual Intake
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[480px] rounded-xl border-none shadow-2xl p-0 overflow-hidden bg-white/95 backdrop-blur-xl">
        <form onSubmit={handleSubmit}>
          <div className="p-8 pt-10 text-center bg-slate-50/50 border-b border-border/50">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                  <Sparkles className="h-6 w-6" />
              </div>
            <DialogHeader>
              <DialogTitle className="text-3xl font-semibold tracking-tight tracking-tighter  lowercase text-slate-900 text-center">
                New Lead Signal
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest text-center pt-2">
                Manually provision identity into the Intelligence Matrix
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar px-8 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold tracking-tight uppercase text-slate-400 tracking-wider ml-1">Full Name</Label>
                <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="John Doe" 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-11 pl-10 rounded-xl border-border/50 bg-slate-50/50 focus-visible:ring-primary/20 font-semibold" 
                    />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold tracking-tight uppercase text-slate-400 tracking-wider ml-1">Phone Node</Label>
                <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 group-focus-within:text-primary transition-colors" />
                    <Input 
                        type="tel" 
                        placeholder="9876543210" 
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-11 pl-10 rounded-xl border-border/50 bg-slate-50/50 focus-visible:ring-primary/20 font-semibold" 
                    />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-semibold tracking-tight uppercase text-slate-400 tracking-wider ml-1">Email Identifier</Label>
              <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="john@example.com" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11 pl-10 rounded-xl border-border/50 bg-slate-50/50 focus-visible:ring-primary/20 font-semibold" 
                  />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-semibold tracking-tight uppercase text-slate-400 tracking-wider ml-1">Category</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger className="h-11 rounded-xl border-border/50 bg-slate-50/50 focus:ring-primary/20 font-semibold text-xs">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 shadow-xl">
                    <SelectItem value="INFERTILITY" className="text-[10px] font-semibold uppercase py-2.5">Infertility (IVF)</SelectItem>
                    <SelectItem value="MATERNITY" className="text-[10px] font-semibold uppercase py-2.5">Maternity</SelectItem>
                    <SelectItem value="GYNECOLOGY" className="text-[10px] font-semibold uppercase py-2.5">Gynecology</SelectItem>
                    <SelectItem value="OTHER" className="text-[10px] font-semibold uppercase py-2.5">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isAdmin && (
                <div className="space-y-3">
                  <Label className="text-[10px] font-semibold tracking-tight uppercase text-slate-400 tracking-wider ml-1">Assign Owner</Label>
                  <Select value={formData.ownerId || "unassigned"} onValueChange={(val) => setFormData({ ...formData, ownerId: val === "unassigned" ? null : val })}>
                    <SelectTrigger className="h-11 rounded-xl border-border/50 bg-slate-50/50 focus:ring-primary/20 font-semibold text-xs">
                      <SelectValue placeholder="Select Owner" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 shadow-xl">
                      <SelectItem value="unassigned" className="text-[10px] font-semibold uppercase py-2.5">Unassigned</SelectItem>
                      {team.map((member) => (
                        <SelectItem key={member.id} value={member.id} className="text-[10px] font-semibold uppercase py-2.5">
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-semibold tracking-tight uppercase text-slate-400 tracking-wider ml-1">Clinical Center <span className="text-rose-500">*</span></Label>
              <Select required value={formData.branchId} onValueChange={(val) => setFormData({ ...formData, branchId: val || "" })}>
                <SelectTrigger className="h-12 rounded-xl border-border/50 bg-slate-50/50 focus:ring-primary/20 font-semibold text-xs ring-1 ring-slate-100/50 hover:bg-slate-100/50 transition-colors">
                  <SelectValue placeholder="Select Deployment Center" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50 shadow-xl">
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id} className="text-[10px] font-semibold uppercase py-2.5">
                      {branch.name} Node
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-8 bg-slate-100/50 border-t border-border/50 flex-shrink-0">
            <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 rounded-xl bg-slate-900 hover:bg-black text-white text-[11px] font-semibold tracking-tight uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 transition-all font-heading"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Lead Profile"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
