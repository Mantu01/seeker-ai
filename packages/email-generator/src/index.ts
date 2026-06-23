import type { Draft, Lead, Config } from "@seeker/shared-types";
import { AI_SYSTEM_PROMPT, AI_PROMPT_TEMPLATE } from "@seeker/constants";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export interface TemplateVariables {
  company: string;
  founder_name?: string;
  website?: string;
  email: string;
  description?: string;
  job_type?: string;
}

export function textToHtml(text: string): string {
  let html = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/\r?\n/g, "<br>");
  return html;
}

export function makeManualDraft(lead: Lead, template: string): Draft {
  const variables: TemplateVariables = {
    company: lead.company,
    founder_name: lead.founder_name,
    website: lead.website,
    email: lead.email,
    description: lead.description,
    job_type: lead.job_type
  };
  const bodyWithVars = template.replace(/{{\s*(\w+)\s*}}/g, (_, token) => String(variables[token as keyof TemplateVariables] ?? ""));
  
  let subject = `Opportunity for ${lead.company}`;
  let body = bodyWithVars;

  const match = bodyWithVars.match(/^(?:#\s*|Subject:\s*)(.*)(?:\r?\n)+/i);
  if (match && match[1]) {
    subject = match[1].trim();
    body = bodyWithVars.substring(match[0].length).trim();
  }

  return {
    subject,
    body: textToHtml(body)
  };
}

export async function makeGenerativeDraft(
  lead: Lead,
  config: Config
): Promise<Draft> {
  const provider = config.generative;
  const openaiKey = provider?.keys?.OPENAI_API_KEY || "";
  const geminiKey = provider?.keys?.GEMINI_API_KEY || "";

  if (!openaiKey && !geminiKey) {
    throw new Error("No AI API keys configured. Please add OpenAI or Gemini keys using /config.");
  }

  const primary = provider?.primary || "openai";
  let activeProvider: "openai" | "gemini" = "openai";

  if (openaiKey && geminiKey) {
    activeProvider = primary === "gemini" ? "gemini" : "openai";
  } else if (openaiKey) {
    activeProvider = "openai";
  } else {
    activeProvider = "gemini";
  }

  const promptText = AI_PROMPT_TEMPLATE(
    lead.company,
    config.userPrompt || "",
    lead.founder_name,
    lead.website,
    lead.description
  );

  const apiKey = activeProvider === "openai" ? openaiKey : geminiKey;

  try {
    if (activeProvider === "openai") {
      const openai = createOpenAI({ apiKey });
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        system: AI_SYSTEM_PROMPT,
        prompt: promptText
      });
      if (text && text.trim()) {
        return parseAiOutput(text, lead.company);
      }
    } else {
      const google = createGoogleGenerativeAI({ apiKey });
      const { text } = await generateText({
        model: google("gemini-2.5-flash"),
        system: AI_SYSTEM_PROMPT,
        prompt: promptText
      });
      if (text && text.trim()) {
        return parseAiOutput(text, lead.company);
      }
    }
  } catch (err) {
    throw new Error(`AI generation failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  throw new Error("AI generation produced empty content.");
}

function parseAiOutput(rawOutput: string, company: string): Draft {
  let subject = `Opportunity for ${company}`;
  let body = rawOutput.trim();

  const subjectMatch = rawOutput.match(/Subject:\s*(.*)/i);
  if (subjectMatch && subjectMatch[1]) {
    subject = subjectMatch[1].trim();
    body = rawOutput.replace(/Subject:\s*(.*)/i, "").trim();
  }

  return { subject, body: textToHtml(body) };
}

export class EmailGenerator {
  public static async draft(
    lead: Lead,
    config: Config
  ): Promise<Draft> {
    return makeGenerativeDraft(lead, config);
  }
}
