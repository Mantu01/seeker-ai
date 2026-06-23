import { join } from "node:path";
import { existsSync } from "node:fs";
import enquirer from "enquirer";
import { ThemeId } from "@seeker/constants";
import { LeadIngestion } from "@seeker/lead-ingestion";
import { Config, ConfigService } from "@seeker/config";
import { makeManualDraft, makeGenerativeDraft } from "@seeker/email-generator";
import { renderBlock, createSpinner } from "../ui/renderer.js";
import { styleFor } from "../ui/styles.js";
import { resolveDuplicates } from "./duplicates.js";

export async function handlePreview(
  currentPath: string,
  config: Config,
  theme: ThemeId,
  borderStyle?: string
): Promise<void> {
  const style = styleFor(theme);
  const prompt = enquirer.prompt.bind(enquirer);

  console.log("");

  const modePrompt = await prompt<{ mode: "generative" | "manual" }>({
    type: "select",
    name: "mode",
    message: style.prompt("Select Outreach Mode for preview"),
    choices: [
      { name: "generative", message: "Generative AI Outreach" },
      { name: "manual", message: "Manual Markdown Templates" }
    ]
  } as any);
  const activeMode = modePrompt.mode;

  if (activeMode === "generative") {
    const hasAIKeys = config.generative?.keys?.OPENAI_API_KEY || config.generative?.keys?.GEMINI_API_KEY;
    if (!hasAIKeys) {
      console.log("");
      console.log(style.error("┌──────────────────────────────────────────────────────────┐"));
      console.log(style.error("│ ERROR: No AI API keys configured.                        │"));
      console.log(style.error("│ Generative mode requires either an OpenAI or Gemini key. │"));
      console.log(style.error("│ Please run /config to setup your LLM credentials first.   │"));
      console.log(style.error("└──────────────────────────────────────────────────────────┘"));
      console.log("");
      return;
    }
    if (!config.userPrompt || !config.userPrompt.trim()) {
      console.log("");
      console.log(style.error("┌──────────────────────────────────────────────────────────┐"));
      console.log(style.error("│ ERROR: No custom prompt details configured.               │"));
      console.log(style.error("│ Generative mode requires you to configure user prompt    │"));
      console.log(style.error("│ details first. Please run /prompt command.               │"));
      console.log(style.error("└──────────────────────────────────────────────────────────┘"));
      console.log("");
      return;
    }
  }

  let templates: string[] = [];
  let jobTypes: string[] = [];
  try {
    templates = await ConfigService.listTemplates(currentPath);
    jobTypes = templates.map((file) => file.replace(/\.md$/, ""));
  } catch (error) {
  }

  const csvPrompt = await prompt<{ filename: string }>({
    type: "input",
    name: "filename",
    message: style.prompt("Enter CSV file name for preview (only name)"),
    initial: "leads.csv"
  });

  let filename = csvPrompt.filename.trim();
  if (!filename) {
    filename = "leads.csv";
  }
  if (!filename.toLowerCase().endsWith(".csv")) {
    filename += ".csv";
  }

  const csvPath = join(currentPath, "assests", "data", filename);

  let rows;
  try {
    if (!existsSync(csvPath)) {
      console.log("");
      console.log(style.error(`CSV file not found at: ${csvPath}`));
      console.log("");
      return;
    }
    rows = await LeadIngestion.loadCsv(csvPath);
  } catch (error) {
    console.log("");
    console.log(style.error(`CSV loading error: ${error instanceof Error ? error.message : String(error)}`));
    console.log("");
    return;
  }

  let allowDuplicates = false;
  const duplicateResolution = await resolveDuplicates(csvPath, rows, theme);
  if (!duplicateResolution) {
    return;
  }
  rows = duplicateResolution.rows;
  allowDuplicates = duplicateResolution.allowDuplicates;



  console.log("");
  const spinner = createSpinner("Generating email previews", theme);
  spinner.start();

  try {
    const validation = LeadIngestion.validate(rows, activeMode, jobTypes, allowDuplicates);
    if (!validation.valid) {
      spinner.fail(style.error("CSV validation failed for preview."));
      console.log("");
      console.log(renderBlock(validation.errors.join("\n"), theme, borderStyle));
      console.log("");
      return;
    }

    spinner.succeed(style.success("Previews generated successfully:"));

    for (const lead of rows.slice(0, 3)) {
      const template = activeMode === "manual"
        ? await ConfigService.loadTemplate(currentPath, lead)
        : "";
      const draft = activeMode === "manual"
        ? makeManualDraft(lead, template)
        : await makeGenerativeDraft(lead, config);

      const content = [
        `${style.accent("To:")} ${style.body(lead.email)}`,
        `${style.accent("Subject:")} ${style.body(draft.subject)}`,
        "",
        style.body(draft.body)
      ].join("\n");

      console.log("");
      console.log(renderBlock(content, theme, borderStyle, `OUTBOX PREVIEW: ${lead.company.toUpperCase()}`));
    }
    console.log("");
  } catch (error) {
    spinner.fail(style.error(`Failed to generate previews: ${error instanceof Error ? error.message : String(error)}`));
    console.log("");
  }
}
