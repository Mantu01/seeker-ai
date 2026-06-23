import { Lead } from "@seeker/shared-types";
import { LeadIngestion } from "@seeker/lead-ingestion";
import { ThemeId } from "@seeker/constants";
import { styleFor } from "../ui/styles.js";
import { createSpinner } from "../ui/renderer.js";
import enquirer from "enquirer";

export async function resolveDuplicates(
  csvPath: string,
  rows: Lead[],
  theme: ThemeId
): Promise<{ rows: Lead[]; allowDuplicates: boolean } | null> {
  const style = styleFor(theme);
  const prompt = enquirer.prompt.bind(enquirer);

  const emailsSeen = new Set<string>();
  const duplicateRows: Lead[] = [];
  for (const row of rows) {
    const emailKey = row.email ? row.email.trim().toLowerCase() : "";
    if (emailKey && emailsSeen.has(emailKey)) {
      duplicateRows.push(row);
    } else if (emailKey) {
      emailsSeen.add(emailKey);
    }
  }

  if (duplicateRows.length === 0) {
    return { rows, allowDuplicates: false };
  }

  console.log("");
  console.log(style.warning(`[WARNING] Duplicate emails detected: ${duplicateRows.length} rows contain duplicate emails.`));
  console.log("");

  const duplicateChoice = await prompt<{ action: "keep" | "skip" | "delete" | "abort" }>({
    type: "select",
    name: "action",
    message: style.prompt("Select action for duplicates"),
    choices: [
      { name: "keep", message: "Keep duplicates and send mail" },
      { name: "skip", message: "Skip duplicate rows (in-memory filtering)" },
      { name: "delete", message: "Delete duplicate rows from the CSV file permanently" },
      { name: "abort", message: "Abort execution" }
    ]
  } as any);

  if (duplicateChoice.action === "abort") {
    console.log("");
    console.log(style.error("Execution aborted."));
    console.log("");
    return null;
  }

  const uniqueRows: Lead[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const emailKey = row.email ? row.email.trim().toLowerCase() : "";
    if (emailKey) {
      if (!seen.has(emailKey)) {
        seen.add(emailKey);
        uniqueRows.push(row);
      }
    } else {
      uniqueRows.push(row);
    }
  }

  if (duplicateChoice.action === "keep") {
    console.log("");
    console.log(style.success("Keeping duplicate leads as they are."));
    console.log("");
    return { rows, allowDuplicates: true };
  }

  if (duplicateChoice.action === "delete") {
    console.log("");
    const spinnerSave = createSpinner("Rewriting CSV file to remove duplicates", theme);
    spinnerSave.start();
    try {
      await LeadIngestion.saveCsv(csvPath, uniqueRows);
      spinnerSave.succeed(style.success("CSV file successfully rewritten and saved."));
    } catch (err) {
      spinnerSave.fail(style.error(`Failed to save cleaned CSV: ${err instanceof Error ? err.message : String(err)}`));
      console.log("");
      return null;
    }
  } else if (duplicateChoice.action === "skip") {
    console.log("");
    console.log(style.success("Skipped duplicate rows in-memory."));
  }

  console.log("");
  return { rows: uniqueRows, allowDuplicates: false };
}
