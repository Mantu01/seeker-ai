export type ThemeId = "aurora" | "midnight" | "sunset" | "forest" | "cyberpunk" | "dracula";
export type MailMode = "generative" | "manual";

export interface Lead {
  company: string;
  email: string;
  founder_name?: string;
  website?: string;
  linkedin?: string;
  description?: string;
  job_type?: string;
  industry?: string;
  notes?: string;
}

export interface GmailConfig {
  email: string;
  appPassword: string;
}

export interface GenerativeProviderConfig {
  primary: "openai" | "gemini" | "claude" | "openrouter" | "custom";
  fallback?: "openai" | "gemini" | "claude" | "openrouter" | "custom";
  keys: Record<string, string>;
}

export interface Config {
  displayTheme: ThemeId;
  fontStyle?: string;
  borderStyle?: string;
  mailMode: MailMode;
  gmail: GmailConfig;
  generative?: GenerativeProviderConfig;
  templateDirectory: string;
  userPrompt?: string;
}

export interface Draft {
  subject: string;
  body: string;
}

export interface SendResult {
  success: boolean;
  error?: string;
}

export interface LogEntry {
  timestamp: string;
  lead: Lead;
  subject: string;
  status: "sent" | "failed" | "skipped";
  provider: string;
  error?: string;
}

export interface RunState {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  remaining: number;
  lastProcessedRow: number;
}
