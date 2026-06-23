import { existsSync } from "node:fs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { LogEntry, RunState } from "@seeker/shared-types";

export class LogStore {
  public static async loadState(root: string): Promise<RunState> {
    const folder = join(root, ".seeker");
    const stateFile = join(folder, "state.json");
    if (!existsSync(stateFile)) {
      if (!existsSync(folder)) {
        await mkdir(folder, { recursive: true });
      }
      const defState: RunState = { processed: 0, sent: 0, failed: 0, skipped: 0, remaining: 0, lastProcessedRow: -1 };
      await writeFile(stateFile, JSON.stringify(defState, null, 2), "utf-8");
      return defState;
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
    const folder = join(root, ".seeker");
    const logsFile = join(folder, "logs.json");
    if (!existsSync(logsFile)) {
      if (!existsSync(folder)) {
        await mkdir(folder, { recursive: true });
      }
      await writeFile(logsFile, JSON.stringify([], null, 2), "utf-8");
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
