import { existsSync } from "node:fs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { LogEntry, RunState } from "@seeker/shared-types";

export class LogStore {
  public static async loadState(root: string): Promise<RunState> {
    const stateFile = join(root, ".seeker", "state.json");
    if (!existsSync(stateFile)) {
      return { processed: 0, sent: 0, failed: 0, skipped: 0, remaining: 0, lastProcessedRow: -1 };
    }
    const payload = await readFile(stateFile, "utf-8");
    return JSON.parse(payload) as RunState;
  }

  public static async saveState(root: string, state: RunState): Promise<void> {
    const folder = join(root, ".seeker");
    if (!existsSync(folder)) {
      await mkdir(folder, { recursive: true });
    }
    await writeFile(join(folder, "state.json"), JSON.stringify(state, null, 2), "utf-8");
  }

  public static async log(root: string, entry: LogEntry): Promise<void> {
    const folder = join(root, ".seeker");
    if (!existsSync(folder)) {
      await mkdir(folder, { recursive: true });
    }
    const logs = await LogStore.loadLogs(root);
    await writeFile(join(folder, "logs.json"), JSON.stringify([...logs, entry], null, 2), "utf-8");
  }

  public static async loadLogs(root: string): Promise<LogEntry[]> {
    const logsFile = join(root, ".seeker", "logs.json");
    if (!existsSync(logsFile)) {
      return [];
    }
    const payload = await readFile(logsFile, "utf-8");
    return JSON.parse(payload) as LogEntry[];
  }

  public static async reset(root: string): Promise<void> {
    const folder = join(root, ".seeker");
    if (!existsSync(folder)) {
      return;
    }
    await writeFile(join(folder, "state.json"), JSON.stringify({ processed: 0, sent: 0, failed: 0, skipped: 0, remaining: 0, lastProcessedRow: -1 }, null, 2), "utf-8");
    await writeFile(join(folder, "logs.json"), JSON.stringify([], null, 2), "utf-8");
  }
}
