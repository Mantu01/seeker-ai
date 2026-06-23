import { YOUTUBE_LINKS } from "./youtube-links.js";

export const CLI_COMMANDS = [
  "/help",
  "/start",
  "/config",
  "/theme",
  "/show",
  "/status",
  "/logs",
  "/preview",
  "/validate <file>",
  "/reset",
  "/version",
  "/prompt",
  "/clear",
  "/exit"
] as const;

export const HELP_CONTENT = `${CLI_COMMANDS.join("\n")}\n\nDocumentation:\nhttps://docs.seeker.dev\nVideo Tutorial:\n${YOUTUBE_LINKS.DOCS}`;

export const AI_SYSTEM_PROMPT = "You are Seeker, a premium email outreach assistant. Write highly customized, professional outreach emails.";

export const AI_PROMPT_TEMPLATE = (
  company: string,
  userPrompt: string,
  founder?: string,
  website?: string,
  description?: string
): string => {
  let promptText = `Write a premium, personalized cold outreach email to ${founder ?? "the founder"} at ${company}.\n`;
  promptText += `Company Website: ${website ?? "Not specified"}\n`;
  promptText += `Company Description: ${description ?? "Not specified"}\n\n`;
  promptText += `Sender Context / Instructions:\n${userPrompt}\n\n`;
  promptText += `Keep the email concise, professional, and well-structured. You MUST include a subject line at the very top starting with 'Subject: ' followed by the email body. Make sure there are clear paragraphs.`;
  return promptText;
};
