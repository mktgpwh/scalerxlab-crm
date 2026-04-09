/**
 * ScalerX CRM - AI Provider Types
 * ─────────────────────────────────────────────────────────────────
 * Defines the universal interface that ALL AI providers must implement.
 * Swap providers by changing AI_PROVIDER in .env — zero code changes.
 * ─────────────────────────────────────────────────────────────────
 */

export interface LeadContext {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source: string;
  status: string;
  city?: string | null;
  state?: string | null;
  metadata?: Record<string, unknown> | null;
  journeyLogs?: JourneyLogContext[];
  organizationIndustry?: string;
}

export interface JourneyLogContext {
  channel: string;
  event: string;
  summary?: string | null;
  createdAt: Date;
}

export interface IntentScoreResult {
  score: number;           // 0–100
  intent: "HOT" | "WARM" | "COLD";
  reasoning: string;       // Human-readable AI explanation
  suggestedAction: string; // e.g. "Call immediately", "Send brochure"
  modelUsed: string;
  tokensUsed?: number;
}

export interface SentimentResult {
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  confidence: number;      // 0.0–1.0
  summary: string;
  modelUsed: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ─────────────────────────────────────────────
// THE UNIVERSAL AI PROVIDER INTERFACE
// Every provider adapter MUST implement this
// ─────────────────────────────────────────────

export interface AIProvider {
  readonly name: string;
  readonly modelId: string;

  /**
   * Score a lead's intent based on their data and journey
   */
  scoreLeadIntent(lead: LeadContext): Promise<IntentScoreResult>;

  /**
   * Analyze sentiment from a text (e.g. latest WhatsApp message)
   */
  analyzeSentiment(text: string): Promise<SentimentResult>;

  /**
   * Generic chat completion — for future extensibility
   */
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;

  /**
   * Health check — verify API key and connectivity
   */
  ping(): Promise<boolean>;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export type AIProviderName = "groq" | "openai" | "anthropic" | "gemini";
