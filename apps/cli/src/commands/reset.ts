import enquirer from "enquirer";
import { ThemeId } from "@seeker/constants";
import { LogStore } from "@seeker/logger";
import { styleFor } from "../ui/styles.js";

export async function handleReset(currentPath: string, theme: ThemeId): Promise<void> {
  const style = styleFor(theme);
  const prompt = enquirer.prompt.bind(enquirer);
  const confirmed = await prompt<{ confirm: boolean }>({
    type: "confirm",
    name: "confirm",
    message: style.prompt("Reset all local logs and execution state?")
  });
  if (!confirmed.confirm) {
    return;
  }
  await LogStore.reset(currentPath);
  console.log(style.success("Workspace reset complete."));
}
