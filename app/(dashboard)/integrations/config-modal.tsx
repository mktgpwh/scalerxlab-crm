"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { IntegrationIcon } from "@/components/ui/integration-icon";
import { toast } from "sonner";
import { updateConnectionAction } from "./actions";
import { Loader2, ShieldCheck, Zap } from "lucide-react";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  integrationId: string | null;
  existingData: any;
  onSuccess: () => void;
}

const CONFIG_FIELDS: Record<string, { label: string; key: string; placeholder: string; type?: string }[]> = {
  wati: [
    { label: "WATI API Token (Bearer)", key: "token", placeholder: "eyJhbGciOiJIUzI1Ni..." },
    { label: "API Endpoint URL", key: "endpoint", placeholder: "https://live-mt-server.wati.io/1046844" },
    { label: "Channel Phone Number", key: "channelNo", placeholder: "919109114894" }
  ],
  "tata-smartflo": [
    { label: "Virtual Number", key: "virtualNumber", placeholder: "+911234567890" },
    { label: "API Key", key: "apiKey", placeholder: "Enter SmartFlo API Key" }
  ],
  "meta-ads": [
    { label: "Meta Access Token", key: "accessToken", placeholder: "EAAB..." },
    { label: "WABA ID (Optional)", key: "wabaId", placeholder: "Enter WABA ID" }
  ],
  "google-ads": [
    { label: "Customer ID", key: "customerId", placeholder: "123-456-7890" },
    { label: "Developer Token", key: "devToken", placeholder: "Enter Dev Token" }
  ]
};

export function ConfigModal({ isOpen, onClose, integrationId, existingData, onSuccess }: ConfigModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (integrationId) {
      setFormData(existingData || {});
    }
  }, [integrationId, existingData, isOpen]);

  if (!integrationId) return null;

  const fields = CONFIG_FIELDS[integrationId] || [];

  const handleSave = async () => {
    setLoading(true);
    const res = await updateConnectionAction(integrationId, {
        ...formData,
        isEnabled: true // Auto-enable on first config
    });
    setLoading(false);

    if (res.success) {
      toast.success(`${integrationId.toUpperCase()} Connected`, {
          description: "Matrix synchronization is now live."
      });
      onSuccess();
      onClose();
    } else {
      toast.error("Cloud Sync Failed", { description: res.error });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-none shadow-2xl p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
        
        <DialogHeader className="relative space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm ring-1 ring-slate-100 dark:ring-white/10">
              <IntegrationIcon slug={integrationId === "wati" ? "whatsapp" : integrationId} size={32} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-semibold tracking-tight tracking-tighter text-slate-900 dark:text-white uppercase ">
                /configure.{integrationId}
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">
                Establish Clinical Data Bridge
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="relative py-6 space-y-6">
          {fields.length > 0 ? (
            fields.map(field => (
              <div key={field.key} className="space-y-2">
                <Label className="text-[10px] font-semibold tracking-tight uppercase tracking-[0.2em] text-slate-500 pl-1">{field.label}</Label>
                <Input 
                  value={formData[field.key] || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-border/50 dark:border-white/10 focus-visible:ring-indigo-500/20 font-medium"
                />
              </div>
            ))
          ) : (
            <div className="py-12 text-center space-y-3 opacity-40">
                <Zap className="h-10 w-10 mx-auto" />
                <p className="text-xs font-semibold tracking-tight uppercase tracking-widest">Default Parameters Active</p>
                <p className="text-[9px] font-medium">This service uses global singleton settings.</p>
            </div>
          )}

          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  Credentials are encrypted at rest. Pahlajani's clinical compliance ensures zero data leakage to public nodes.
              </p>
          </div>
        </div>

        <DialogFooter className="relative gap-3">
          <Button variant="ghost" onClick={onClose} className="rounded-xl h-12 px-6 text-[10px] font-semibold tracking-tight uppercase tracking-widest hover:bg-slate-100">
            Abort
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-slate-900 dark:bg-primary text-white h-12 rounded-xl text-[10px] font-semibold tracking-tight uppercase tracking-widest gap-2 shadow-lg hover:shadow-primary/20 active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-current" />}
            {loading ? 'Establishiing Bridge...' : 'Save & Verify Node'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
