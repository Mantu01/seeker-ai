import { ThemeId } from "@seeker/constants";
import { LogStore } from "@seeker/logger";
import { renderTable, renderBlock } from "../ui/renderer.js";
import { styleFor } from "../ui/styles.js";

export async function handleStatus(currentPath: string, theme: ThemeId, borderStyle?: string): Promise<void> {
  const style = styleFor(theme);
  const state = await LogStore.loadState(currentPath);

  const headers = ["Metric Indicator", "Value Count"];
  const rows = [
    ["Total Processed", String(state.processed)],
    ["Sent Outreach", String(state.sent)],
    ["Failed Outputs", String(state.failed)],
    ["Skipped Accounts", String(state.skipped)],
    ["Remaining Queue", String(state.remaining)]
  ];

  console.log(style.accent("\nExecution Status:"));
  console.log(renderTable(headers, rows, theme));
}
