import { LeadStatus, LeadIntent, LeadSource, TreatmentCategory } from "@prisma/client";

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
  assignedToId: string | null;
  assignedAt: Date | null;
  branchId: string | null;
  isAutoAssigned: boolean;
  consentFlag: boolean;
  consentTimestamp: Date | null;
  consentMethod: string | null;
  dataRetentionExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
