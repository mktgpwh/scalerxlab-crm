# ScalerX CRM v1.0

A high-performance, multi-tenant SaaS CRM designed specifically for high-conversion industries like Healthcare and Education.

## Architecture

- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS
- **Backend:** Next.js API Routes / Server Actions
- **Database:** PostgreSQL mapping via Prisma ORM
- **AI Analytics Engine:** Groq SDK natively running `llama3-70b-8192` for lightning-fast lead scoring metrics mapping.

## The Multi-Tenant RLS Strategy

We implement multi-tenancy at the core using a **Shared Database with Application-Level Scoping**.
Every data model natively maps back to `organizationId`. 
Moving into Phase 2, this will lock into strictly enforced Row-Level Security (RLS) constraints within PostgreSQL to mathematically guarantee that cross-tenant data bleed simply cannot occur at the software level.

## Indian DPDPA (Digital Personal Data Protection Act) Compliance

The CRM is natively compliant with the DPDPA right from the scaffold:

1. **Explicit Consent Capture:** The schema tracks the `consentFlag`, the explicit `consentTimestamp`, and the exact `consentMethod` directly.
2. **Data Minimization Rule Compliance:** The system automatically establishes `dataRetentionExpiry`. By default, leads are aggressively set to expire 3 years from initial capture to avoid non-compliant indefinite storage.

### Setup Instructions

1. Check the `.env` parameters map to your exact connection URL and Groq API keys.
2. Run Prisma `npx prisma generate` followed by `npx prisma db push`.
3. Launch with `npm run dev`.
