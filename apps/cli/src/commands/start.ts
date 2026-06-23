import { join } from "node:path";
import { existsSync } from "node:fs";
import enquirer from "enquirer";
import { ThemeId } from "@seeker/constants";
import { LeadIngestion } from "@seeker/lead-ingestion";
import { Config, ConfigService } from "@seeker/config";
import { LogStore } from "@seeker/logger";
import { makeManualDraft, makeGenerativeDraft } from "@seeker/email-generator";
import { EmailSender } from "@seeker/email-sender";
import { styleFor } from "../ui/styles.js";
import { renderBlock, createSpinner } from "../ui/renderer.js";
import { resolveDuplicates } from "./duplicates.js";

export async function handleStart(
  currentPath: string,
  config: Config,
  resume: boolean,
  theme: ThemeId,
  borderStyle?: string
): Promise<void> {
  const style = styleFor(theme);
  const prompt = enquirer.prompt.bind(enquirer);

  console.log("");

  const modePrompt = await prompt<{ mode: "generative" | "manual" }>({
    type: "select",
    name: "mode",
    message: style.prompt("Select Outreach Mode for this run"),
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
    message: style.prompt("Enter CSV file name (only name, e.g. leads.csv)"),
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

  let selectedJobType = "all";
  if (activeMode === "manual") {
    if (jobTypes.length === 0) {
      console.log("");
      console.log(style.error("Error: No templates found in '/assests/template/'. Please create templates first."));
      console.log("");
      return;
    }

    const jobTypePrompt = await prompt<{ jobType: string }>({
      type: "select",
      name: "jobType",
      message: style.prompt("Select Job Type for manual outreach"),
      choices: [...jobTypes, { name: "all", message: "Process All Job Types" }]
    } as any);

    selectedJobType = jobTypePrompt.jobType;
  }

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
  const spinner = createSpinner("Validating CSV data structure", theme);
  spinner.start();
  const validation = LeadIngestion.validate(rows, activeMode, jobTypes, allowDuplicates);
  if (!validation.valid) {
    spinner.fail(style.error("CSV validation failed."));
    console.log("");
    console.log(renderBlock(validation.errors.join("\n"), theme, borderStyle));
    console.log("");
    return;
  }
  spinner.succeed(style.success(`CSV validation complete. Found ${rows.length} total rows.`));

  if (activeMode === "manual" && selectedJobType !== "all") {
    rows = rows.filter((lead) => lead.job_type === selectedJobType);
    console.log("");
    console.log(style.success(`Filtered lead queue. Processing ${rows.length} leads matching job_type: '${selectedJobType}'`));
    if (rows.length === 0) {
      console.log("");
      return;
    }
  }



  console.log("");
  const cooldownPrompt = await prompt<{ seconds: string }>({
    type: "input",
    name: "seconds",
    message: style.prompt("Enter Cooldown Between Emails (seconds)"),
    initial: "5"
  });
  const seconds = Number(cooldownPrompt.seconds) || 0;

  console.log("");
  const startConfirmation = await prompt<{ proceed: boolean }>({
    type: "confirm",
    name: "proceed",
    message: style.prompt(`Start automated mailing campaign for ${rows.length} leads? (cooldown: ${seconds}s)`)
  });

  if (!startConfirmation.proceed) {
    console.log("");
    console.log(style.warning("Campaign aborted."));
    console.log("");
    return;
  }

  const state = await LogStore.loadState(currentPath);
  let index = resume ? state.lastProcessedRow + 1 : 0;

  while (index < rows.length) {
    const lead = rows[index]!;
    console.log("");
    const draftSpinner = createSpinner(`Drafting email for ${lead.company}`, theme);
    draftSpinner.start();

    let draft;
    try {
      const template = activeMode === "manual"
        ? await ConfigService.loadTemplate(currentPath, lead)
        : "";
      draft = activeMode === "manual"
        ? makeManualDraft(lead, template)
        : await makeGenerativeDraft(lead, config);
      draftSpinner.succeed(style.success(`Draft created for ${lead.company}`));
    } catch (error) {
      draftSpinner.fail(style.error(`Failed to build draft for ${lead.company}: ${error instanceof Error ? error.message : String(error)}`));
      state.failed += 1;
      state.processed += 1;
      state.remaining = rows.length - index - 1;
      state.lastProcessedRow = index;
      await LogStore.saveState(currentPath, state);
      index += 1;
      continue;
    }

    const dispatchDetails = `${style.accent("To:")} ${style.body(lead.email)}   │   ${style.accent("Job Type:")} ${style.body(lead.job_type || (activeMode === "generative" ? "Generative AI" : "N/A"))}`;

    console.log("");
    console.log(renderBlock(dispatchDetails, theme, borderStyle, `OUTBOX TRANSACTION: ${lead.company.toUpperCase()}`));

    console.log("");
    const mailSpinner = createSpinner(`Delivering email to ${lead.email}`, theme);
    mailSpinner.start();

    const result = await EmailSender.send(
      { to: lead.email, subject: draft.subject, html: draft.body },
      config.gmail
    );

    if (result.success) {
      mailSpinner.succeed(style.success(`Successfully sent to ${lead.email}`));
      await LogStore.log(currentPath, {
        timestamp: new Date().toISOString(),
        lead,
        subject: draft.subject,
        status: "sent",
        provider: activeMode === "generative" ? (config.generative?.primary || "generative") : "manual"
      });
      state.sent += 1;
    } else {
      mailSpinner.fail(style.error(`Delivery failed: ${result.error}`));
      await LogStore.log(currentPath, {
        timestamp: new Date().toISOString(),
        lead,
        subject: draft.subject,
        status: "failed",
        provider: activeMode === "generative" ? (config.generative?.primary || "generative") : "manual",
        error: result.error
      });
      state.failed += 1;
    }

    state.processed += 1;
    state.remaining = rows.length - index - 1;
    state.lastProcessedRow = index;
    await LogStore.saveState(currentPath, state);

    console.log("");
    console.log(
      style.accent(
        `Progress: Processed ${state.processed}/${rows.length} | Sent: ${state.sent} | Failed: ${state.failed} | Skipped: ${state.skipped}`
      )
    );

    if (index < rows.length - 1 && seconds > 0) {
      console.log("");
      const waitSpinner = createSpinner(`Waiting for ${seconds}s cooldown`, theme);
      waitSpinner.start();
      await new Promise((r) => setTimeout(r, seconds * 1000));
      waitSpinner.succeed(style.success("Cooldown period finished"));
    }

    index += 1;
  }

  console.log("");
  console.log(style.success("Queue processing completed successfully."));
  console.log("");
}
