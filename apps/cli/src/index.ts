import { existsSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { Config, ConfigService } from "@seeker/config";
import { ThemeId } from "@seeker/constants";
import { parseStartupCommand, normalizeCommand, parseCommandInput } from "./parser.js";
import { styleFor } from "./ui/styles.js";
import { renderBanner, renderShellHeader } from "./ui/renderer.js";
import { handleHelp } from "./commands/help.js";
import { handleConfig } from "./commands/config.js";
import { handleTheme } from "./commands/theme.js";
import { handleStatus } from "./commands/status.js";
import { handleValidate } from "./commands/validate.js";
import { handlePreview } from "./commands/preview.js";
import { handleLogs } from "./commands/logs.js";
import { handleReset } from "./commands/reset.js";
import { handleVersion } from "./commands/version.js";
import { handleStart } from "./commands/start.js";
import { handleShow } from "./commands/show.js";
import { handleClear } from "./commands/clear.js";
import { handlePrompt } from "./commands/prompt.js";

const rawArgs = process.argv.slice(2);
const args = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;
const initialCommand = parseStartupCommand(args);
const initialParams = initialCommand ? args.slice(1) : [];
const historyList: string[] = [];

function getCliRoot(): string {
  const cwd = process.cwd();
  if (cwd.endsWith("cli") || cwd.endsWith("cli\\") || cwd.endsWith("cli/")) {
    return cwd;
  }
  const cliPath = join(cwd, "apps", "cli");
  if (existsSync(cliPath)) {
    return cliPath;
  }
  return cwd;
}

async function main(): Promise<void> {
  const currentPath = getCliRoot();
  let config = await ConfigService.load(currentPath);
  let theme = config.displayTheme;

  console.clear();
  console.log(renderBanner(theme, config.fontStyle, config.borderStyle));
  console.log(renderShellHeader(theme, config.borderStyle));

  if (initialCommand) {
    config = await executeCommand(initialCommand, initialParams, currentPath, config, theme);
    theme = config.displayTheme;
  }

  await runShell(currentPath, config, theme);
}

async function runShell(currentPath: string, initialConfig: Config, initialTheme: ThemeId): Promise<void> {
  let config = initialConfig;
  let theme = initialTheme;
  let style = styleFor(theme);

  while (true) {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      historySize: 100
    });

    (rl as any).history = [...historyList];

    const answer = await new Promise<string>((resolve) => {
      rl.question(style.prompt("\nseeker://workspace ❯ "), (line) => {
        resolve(line);
      });
    });

    historyList.splice(0, historyList.length, ...(rl as any).history);
    rl.close();

    const raw = answer.trim();
    if (!raw) {
      continue;
    }

    const command = normalizeCommand(raw);
    const params = parseCommandInput(raw);

    if (!command) {
      console.log("");
      console.log(style.warning("Please enter a valid slash command starting with /."));
      continue;
    }

    if (command === "exit") {
      console.log("");
      console.log(style.success("Exiting Seeker. Have a great day!"));
      return;
    }

    config = await executeCommand(command, params, currentPath, config, theme);
    theme = config.displayTheme;
    style = styleFor(theme);
  }
}

async function executeCommand(
  command: string,
  params: string[],
  currentPath: string,
  config: Config,
  theme: ThemeId
): Promise<Config> {
  const style = styleFor(theme);
  const borderStyle = config.borderStyle;

  switch (command) {
    case "help":
      await handleHelp(theme, borderStyle);
      break;
    case "config":
      return await handleConfig(currentPath, config);
    case "theme":
      return await handleTheme(currentPath, config);
    case "show":
      await handleShow(currentPath, config, theme, borderStyle);
      break;
    case "status":
      await handleStatus(currentPath, theme, borderStyle);
      break;
    case "validate":
      await handleValidate(currentPath, params[0], config.mailMode, theme, borderStyle);
      break;
    case "preview":
      await handlePreview(currentPath, config, theme, borderStyle);
      break;
    case "logs":
      await handleLogs(currentPath, theme, borderStyle);
      break;
    case "reset":
      await handleReset(currentPath, theme);
      break;
    case "version":
      await handleVersion(theme);
      break;
    case "start":
      await handleStart(currentPath, config, params.includes("--resume"), theme, borderStyle);
      break;
    case "clear":
      await handleClear();
      break;
    case "prompt":
      return await handlePrompt(currentPath, config, theme, borderStyle);
    default:
      console.log("");
      console.log(style.warning(`Unknown command: /${command}`));
      await handleHelp(theme, borderStyle);
      break;
  }
  return config;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
