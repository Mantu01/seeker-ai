import { ThemeId } from "@seeker/constants";
import { Config } from "@seeker/config";
import { renderTable } from "../ui/renderer.js";
import { styleFor } from "../ui/styles.js";

export async function handleShow(
  currentPath: string,
  config: Config,
  theme: ThemeId,
  borderStyle?: string
): Promise<void> {
  const style = styleFor(theme);

  const headers = ["System Config Parameter", "Configured Settings Value", "Verification Status"];

  const gmailEmail = config.gmail?.email || "NOT SETUP";
  const gmailPass = config.gmail?.appPassword ? "••••••••" : "NOT SETUP";
  const primaryProvider = config.generative?.primary || "NONE";
  const fallbackProvider = config.generative?.fallback || "NONE";
  
  const openaiKey = config.generative?.keys?.OPENAI_API_KEY ? "••••••••" : "NOT SETUP";
  const geminiKey = config.generative?.keys?.GEMINI_API_KEY ? "••••••••" : "NOT SETUP";

  const rows = [
    ["Active UI Theme", config.displayTheme.toUpperCase(), "SUCCESS"],
    ["Banner Font Style", (config.fontStyle || "standard").toUpperCase(), "SUCCESS"],
    ["Box Border Style", (config.borderStyle || "double").toUpperCase(), "SUCCESS"],
    ["Outreach Mail Mode", config.mailMode.toUpperCase(), "SUCCESS"],
    ["Workspace Template Folder", config.templateDirectory.toUpperCase(), "SUCCESS"],
    ["Gmail Outreach Sender", gmailEmail, config.gmail?.email ? "SUCCESS" : "ERROR"],
    ["Gmail App Auth Password", gmailPass, config.gmail?.appPassword ? "SUCCESS" : "ERROR"],
    ["Primary AI Engine", primaryProvider.toUpperCase(), config.generative?.primary ? "SUCCESS" : "SKIP"],
    ["Fallback AI Engine", fallbackProvider.toUpperCase(), config.generative?.fallback ? "SUCCESS" : "SKIP"],
    ["OpenAI Key Token", openaiKey, config.generative?.keys?.OPENAI_API_KEY ? "SUCCESS" : "SKIP"],
    ["Gemini Key Token", geminiKey, config.generative?.keys?.GEMINI_API_KEY ? "SUCCESS" : "SKIP"]
  ];

  console.log(style.accent("\nSystem Configuration & Visual Theme Settings:"));
  console.log(renderTable(headers, rows, theme));
}
