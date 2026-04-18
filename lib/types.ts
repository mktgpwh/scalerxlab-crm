import type { LeadStatus, LeadIntent, LeadSource, TreatmentCategory } from "@prisma/client";

export interface Lead {
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  source: LeadSource;
  status: LeadStatus;
  intent: LeadIntent;
  category: TreatmentCategory;
  metadata: Record<string, unknown> | null; 
  aiScore: number | null;
  aiScoredAt: Date | null;
  aiNotes: string | null;
  ownerId: string | null;
  assignedAt: Date | null;
  branchId: string | null;
  owner?: {
    id: string;
    name: string;
    image: string | null;
  };
  branch?: {
    id: string;
    name: string;
  };
  isAutoAssigned: boolean;
  consentFlag: boolean;
  consentTimestamp: Date | null;
  consentMethod: string | null;
  dataRetentionExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
  callLogs?: CallLog[];
}

export interface CallLog {
  id: string;
  organizationId: string;
  leadId: string | null;
  direction: "INBOUND" | "OUTBOUND";
  status: "CONNECTED" | "MISSED" | "BUSY" | "VOICEMAIL" | "AI_HANDLED";
  duration: number;
  recordingUrl: string | null;
  isQualified: boolean;
  isAiHandled: boolean;
  callerId: string;
  receiverId: string;
  createdAt: Date;
  updatedAt: Date;
  lead?: Lead;
}

export interface TelephonySettings {
  id: string;
  organizationId: string;
  aiRoutingEnabled: boolean;
  tataVirtualNumber: string | null;
  updatedAt: Date;
}
