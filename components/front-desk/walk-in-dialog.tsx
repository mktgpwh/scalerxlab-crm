"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
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
import { UserPlus, Loader2, Sparkles, User, Phone, Zap } from "lucide-react";
import { createLeadAction } from "@/app/(dashboard)/leads/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function WalkInRegistrationDialog({ branches }: { branches: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    category: "OTHER" as any,
    branchId: "",
  });

  const router = useRouter();

  // Sync branchId when branches load
  useEffect(() => {
    if (branches.length > 0 && !formData.branchId) {
      setFormData(prev => ({ ...prev, branchId: branches[0]?.id || "" }));
    }
  }, [branches, formData.branchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length < 10) {
        toast.error("Format Error", { description: "Phone number must be valid." });
        return;
    }

    setLoading(true);
    try {
      const result = await createLeadAction({
        ...formData,
        email: "",
        source: "WALK_IN",
        ownerId: null,
      });

      if (result.error) {
        toast.error("Capture Failed", { description: result.error });
      } else {
        toast.success("Walk-In Registered", { 
          description: `${formData.name} is now marked as VISITED and ready for counselling.` 
        });
        setOpen(false);
        setFormData({ name: "", phone: "", category: "OTHER", branchId: branches[0]?.id || "" });
        router.refresh();
      }
    } catch (error) {
      toast.error("System Error", { description: "Front Desk handshake failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button className="h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 group transition-all">
            <Zap className="h-4 w-4 mr-2 fill-current" />
            Register Walk-In Patient
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[440px] rounded-[30px] border-none shadow-2xl p-0 overflow-hidden bg-white/95 backdrop-blur-xl">
        <form onSubmit={handleSubmit}>
          <div className="p-8 pt-10 text-center bg-emerald-50/50 border-b border-emerald-100/50">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/20">
                  <UserPlus className="h-7 w-7" />
              </div>
            <DialogHeader>
              <DialogTitle className="text-3xl font-black tracking-tight tracking-tighter text-emerald-900 text-center lowercase">
                /walk-in.capture
              </DialogTitle>
              <DialogDescription className="text-emerald-600/70 text-[10px] font-bold uppercase tracking-[0.2em] text-center pt-2">
                Rapid Intake Protocol for Organic Arrivals
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-8 py-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black tracking-widest uppercase text-zinc-400 ml-1">Patient Name</Label>
              <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-emerald-500 transition-colors" />
                  <Input 
                      placeholder="Jane Doe" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-14 pl-12 rounded-2xl border-none bg-zinc-50 focus-visible:ring-emerald-500/20 font-bold text-zinc-900" 
                  />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black tracking-widest uppercase text-zinc-400 ml-1">Phone Number</Label>
              <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-emerald-500 transition-colors" />
                  <Input 
                      type="tel" 
                      placeholder="99999 88888" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-14 pl-12 rounded-2xl border-none bg-zinc-50 focus-visible:ring-emerald-500/20 font-bold text-zinc-900" 
                  />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black tracking-widest uppercase text-zinc-400 ml-1">Speciality</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger className="h-14 rounded-2xl border-none bg-zinc-50 focus:ring-emerald-500/20 font-bold text-xs">
                    <SelectValue>
                      {formData.category || "General"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl py-2">
                    <SelectItem value="INFERTILITY" className="text-[10px] font-bold uppercase py-3">IVF/Infertility</SelectItem>
                    <SelectItem value="MATERNITY" className="text-[10px] font-bold uppercase py-3">Maternity</SelectItem>
                    <SelectItem value="GYNECOLOGY" className="text-[10px] font-bold uppercase py-3">Gynecology</SelectItem>
                    <SelectItem value="OTHER" className="text-[10px] font-bold uppercase py-3">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black tracking-widest uppercase text-zinc-400 ml-1">Arrival Center</Label>
                <Select required value={formData.branchId} onValueChange={(val) => setFormData({ ...formData, branchId: val || "" })}>
                  <SelectTrigger className="h-14 rounded-2xl border-none bg-zinc-50 focus:ring-emerald-500/20 font-bold text-xs">
                    <SelectValue>
                      {branches.find(b => b.id === formData.branchId)?.name?.split(' ')[0] || "Branch"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl py-2">
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id} className="text-[10px] font-bold uppercase py-3">
                        {branch.name.split(' ')[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>


          <div className="p-8 bg-zinc-50 border-t border-zinc-100">
            <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-16 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Finalize Walk-In Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
