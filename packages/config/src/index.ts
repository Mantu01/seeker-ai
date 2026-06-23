import { existsSync } from "node:fs";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Config, GenerativeProviderConfig, Lead } from "@seeker/shared-types";

export type MailMode = "generative" | "manual";

export type { Config, GenerativeProviderConfig, Lead };

export class ConfigService {
  public static readonly configFolderName = ".seeker";
  public static readonly configFileName = "config.json";

  public static async load(root: string): Promise<Config> {
    const configPath = join(root, ConfigService.configFolderName, ConfigService.configFileName);
    if (!existsSync(configPath)) {
      return ConfigService.defaultConfig();
    }
    const contents = await readFile(configPath, "utf-8");
    return JSON.parse(contents) as Config;
  }

  public static async save(root: string, config: Config): Promise<void> {
    const folder = join(root, ConfigService.configFolderName);
    if (!existsSync(folder)) {
      await mkdir(folder, { recursive: true });
    }
    const configFile = join(folder, ConfigService.configFileName);
    await writeFile(configFile, JSON.stringify(config, null, 2), "utf-8");
  }

  public static async build(partial: Partial<Config>): Promise<Config> {
    return {
      displayTheme: partial.displayTheme ?? "aurora",
      fontStyle: partial.fontStyle ?? "standard",
      borderStyle: partial.borderStyle ?? "double",
      mailMode: partial.mailMode ?? "generative",
      gmail: partial.gmail ?? { email: "", appPassword: "" },
      generative: partial.generative,
      templateDirectory: partial.templateDirectory ?? "assests/template",
      userPrompt: partial.userPrompt
    };
  }

  public static async configureGenerative(config: Config): Promise<void> {
    config.generative = {
      primary: "openai",
      fallback: "gemini",
      keys: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? ""
      }
    };
  }

  public static async configureManual(config: Config, root: string): Promise<void> {
    const templateFolder = join(root, config.templateDirectory);
    if (!existsSync(templateFolder)) {
      await mkdir(templateFolder, { recursive: true });
    }
    await writeFile(join(templateFolder, ".keep"), "", "utf-8");
  }

  public static async listTemplates(root: string): Promise<string[]> {
    const config = await ConfigService.load(root);
    const folder = join(root, config.templateDirectory);
    if (!existsSync(folder)) {
      return [];
    }
    const items = await readdir(folder, { withFileTypes: true });
    return items.filter((item) => item.isFile() && item.name.endsWith(".md")).map((item) => item.name);
  }

  public static async createTemplate(root: string, filename: string, content: string): Promise<void> {
    const config = await ConfigService.load(root);
    const folder = join(root, config.templateDirectory);
    if (!existsSync(folder)) {
      await mkdir(folder, { recursive: true });
    }
    await writeFile(join(folder, filename), content, "utf-8");
  }

  public static async loadTemplate(root: string, lead: Lead): Promise<string> {
    const config = await ConfigService.load(root);
    const templateName = `${lead.job_type ?? "default"}.md`;
    const path = join(root, config.templateDirectory, templateName);
    if (!existsSync(path)) {
      throw new Error(`Template not found: ${templateName}`);
    }
    return readFile(path, "utf-8");
  }

  private static defaultConfig(): Config {
    return {
      displayTheme: "aurora",
      fontStyle: "standard",
      borderStyle: "double",
      mailMode: "generative",
      gmail: { email: "", appPassword: "" },
      generative: { primary: "openai", fallback: "gemini", keys: {} },
      templateDirectory: "assests/template"
    };
  }
}
