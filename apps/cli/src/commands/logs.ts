import { ThemeId } from "@seeker/constants";
import { LogStore } from "@seeker/logger";
import { renderTable, renderBlock } from "../ui/renderer.js";
import { styleFor } from "../ui/styles.js";

export async function handleLogs(currentPath: string, theme: ThemeId, borderStyle?: string): Promise<void> {
  const style = styleFor(theme);
  const logs = await LogStore.loadLogs(currentPath);

  if (logs.length === 0) {
    console.log(renderBlock("No historical logs found in this workspace.", theme, borderStyle));
    return;
  }

  const headers = ["ID", "Company", "Email", "Status", "Provider / Error"];
  const rows = logs.map((entry, index) => {
    const detail = entry.status === "failed" ? (entry.error || "unknown error") : entry.provider;
    return [
      String(index + 1),
      entry.lead.company || "",
      entry.lead.email || "",
      entry.status.toUpperCase(),
      detail || ""
    ];
  });

  console.log(style.accent("\nOutreach Logs:"));
  console.log(renderTable(headers, rows, theme));
}
