import { join } from "node:path";
import { existsSync } from "node:fs";
import enquirer from "enquirer";
import { ThemeId } from "@seeker/constants";
import { MailMode, ConfigService } from "@seeker/config";
import { LeadIngestion } from "@seeker/lead-ingestion";
import { styleFor } from "../ui/styles.js";
import { renderBlock, createSpinner } from "../ui/renderer.js";
import { resolveDuplicates } from "./duplicates.js";

export async function handleValidate(
  currentPath: string,
  filePath: string | undefined,
  mode: MailMode,
  theme: ThemeId,
  borderStyle?: string
): Promise<boolean> {
  const style = styleFor(theme);
  const prompt = enquirer.prompt.bind(enquirer);

  console.log("");

  const modePrompt = await prompt<{ mode: "generative" | "manual" }>({
    type: "select",
    name: "mode",
    message: style.prompt("Select Mail Mode for validation"),
    choices: [
      { name: "generative", message: "Generative AI Outreach" },
      { name: "manual", message: "Manual Markdown Templates" }
    ]
  } as any);
  const activeMode = modePrompt.mode;

  let templates: string[] = [];
  let jobTypes: string[] = [];
  try {
    templates = await ConfigService.listTemplates(currentPath);
    jobTypes = templates.map((file) => file.replace(/\.md$/, ""));
  } catch (error) {
  }

  let path = filePath ?? "leads.csv";
  if (!path.toLowerCase().endsWith(".csv")) {
    path += ".csv";
  }
  if (!path.includes("/") && !path.includes("\\")) {
    path = join(currentPath, "assests", "data", path);
  }

  try {
    if (!existsSync(path)) {
      console.log("");
      console.log(style.error(`CSV file not found at: ${path}`));
      console.log("");
      return false;
    }
    let rows = await LeadIngestion.loadCsv(path);

    let allowDuplicates = false;
    const duplicateResolution = await resolveDuplicates(path, rows, theme);
    if (!duplicateResolution) {
      return false;
    }
    rows = duplicateResolution.rows;
    allowDuplicates = duplicateResolution.allowDuplicates;

    console.log("");
    const spinner = createSpinner(`Validating CSV: ${path}`, theme);
    spinner.start();

    const result = LeadIngestion.validate(rows, activeMode, jobTypes, allowDuplicates);
    if (!result.valid) {
      spinner.fail(style.error("CSV validation failed."));
      console.log("");
      console.log(renderBlock(result.errors.join("\n"), theme, borderStyle));
      console.log("");
      return false;
    }
    spinner.succeed(style.success(`CSV validation passed. Ingested ${rows.length} lead rows.`));
    console.log("");
    return true;
  } catch (error) {
    console.log("");
    console.log(style.error(`Failed to read or parse CSV: ${error instanceof Error ? error.message : String(error)}`));
    console.log("");
    return false;
  }
}
