import { parse } from "csv-parse/sync";
import { readFile, writeFile } from "node:fs/promises";
import type { Lead, MailMode } from "@seeker/shared-types";

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class LeadIngestion {
  public static async loadCsv(filePath: string): Promise<Lead[]> {
    const content = await readFile(filePath, "utf-8");
    const records = parse(content, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
    return records.map((entry) => ({
      company: entry.company ?? "",
      email: entry.email ?? "",
      founder_name: entry.founder_name,
      website: entry.website,
      linkedin: entry.linkedin,
      description: entry.description,
      job_type: entry.job_type,
      industry: entry.industry,
      notes: entry.notes
    }));
  }

  public static validate(leads: Lead[], mode: MailMode, validJobTypes?: string[]): ValidationResult {
    const errors: string[] = [];
    const seen = new Set<string>();
    for (const [index, lead] of leads.entries()) {
      if (!lead.company) {
        errors.push(`Row ${index + 1}: company is required.`);
      }
      if (!lead.email || !LeadIngestion.isValidEmail(lead.email)) {
        errors.push(`Row ${index + 1}: invalid email value.`);
      }
      if (seen.has(lead.email)) {
        errors.push(`Row ${index + 1}: duplicate email ${lead.email}.`);
      }
      seen.add(lead.email);
      if (mode === "manual") {
        if (!lead.job_type) {
          errors.push(`Row ${index + 1}: job_type is required for manual templates.`);
        } else if (validJobTypes && !validJobTypes.includes(lead.job_type)) {
          errors.push(`Row ${index + 1}: job_type '${lead.job_type}' is invalid. Must be one of: ${validJobTypes.join(", ")}`);
        }
      }
      if (mode === "generative" && !lead.description) {
        errors.push(`Row ${index + 1}: description is required for generative mode.`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  private static isValidEmail(email: string): boolean {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  }

  public static async saveCsv(filePath: string, leads: Lead[]): Promise<void> {
    const headers = ["company", "email", "founder_name", "website", "linkedin", "description", "job_type", "industry", "notes"];
    const escape = (val?: string) => {
      if (val === undefined || val === null) return "";
      const cleaned = String(val).replace(/"/g, '""');
      if (cleaned.includes(",") || cleaned.includes("\n") || cleaned.includes('\r') || cleaned.includes('"')) {
        return `"${cleaned}"`;
      }
      return cleaned;
    };
    const lines = [headers.join(",")];
    for (const lead of leads) {
      const row = [
        escape(lead.company),
        escape(lead.email),
        escape(lead.founder_name),
        escape(lead.website),
        escape(lead.linkedin),
        escape(lead.description),
        escape(lead.job_type),
        escape(lead.industry),
        escape(lead.notes)
      ];
      lines.push(row.join(","));
    }
    const content = lines.join("\n") + "\n";
    await writeFile(filePath, content, "utf-8");
  }
}
