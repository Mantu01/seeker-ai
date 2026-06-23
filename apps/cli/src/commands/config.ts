import enquirer from "enquirer";
import { Config, ConfigService } from "@seeker/config";
import { styleFor } from "../ui/styles.js";

export async function handleConfig(currentPath: string, config: Config): Promise<Config> {
  const currentTheme = config.displayTheme;
  const style = styleFor(currentTheme);
  const prompt = enquirer.prompt.bind(enquirer);
  let activeConfig = { ...config };

  while (true) {
    console.log("");
    console.log(style.accent("--- Seeker Configuration Panel ---"));
    console.log("");

    const menuChoice = await prompt<{ area: "gmail" | "generative" | "exit" }>({
      type: "select",
      name: "area",
      message: style.prompt("Select Configuration Module to edit"),
      choices: [
        { name: "gmail", message: "Configure Gmail Credentials (Email & App Password)" },
        { name: "generative", message: "Configure Generative AI API Keys (OpenAI & Gemini)" },
        { name: "exit", message: "Exit configuration panel" }
      ]
    } as any);

    if (menuChoice.area === "exit") {
      break;
    }

    if (menuChoice.area === "gmail") {
      console.log("");
      const gmailEmail = await prompt<{ email: string }>({
        type: "input",
        name: "email",
        message: style.prompt("Enter your Gmail address"),
        initial: activeConfig.gmail?.email
      } as any);

      const gmailPassword = await prompt<{ appPassword: string }>({
        type: "password",
        name: "appPassword",
        message: style.prompt("Enter your Gmail App Password"),
        initial: activeConfig.gmail?.appPassword
      } as any);

      activeConfig = await ConfigService.build({
        ...activeConfig,
        gmail: { email: gmailEmail.email.trim(), appPassword: gmailPassword.appPassword.trim() }
      });
      await ConfigService.save(currentPath, activeConfig);
      console.log("");
      console.log(style.success("Gmail credentials successfully updated."));
    } else if (menuChoice.area === "generative") {
      console.log("");
      const providerPrompt = await prompt<{ provider: "openai" | "gemini" }>({
        type: "select",
        name: "provider",
        message: style.prompt("Select Primary LLM Model Provider"),
        choices: [
          { name: "openai", message: "OpenAI GPT-4o-mini" },
          { name: "gemini", message: "Google Gemini 2.5 Flash" }
        ],
        initial: activeConfig.generative?.primary || "openai"
      } as any);

      const openaiPrompt = await prompt<{ apiKey: string }>({
        type: "input",
        name: "apiKey",
        message: style.prompt("Enter OpenAI API Key (leave empty to skip)"),
        initial: activeConfig.generative?.keys?.OPENAI_API_KEY || ""
      } as any);

      const geminiPrompt = await prompt<{ apiKey: string }>({
        type: "input",
        name: "apiKey",
        message: style.prompt("Enter Gemini API Key (leave empty to skip)"),
        initial: activeConfig.generative?.keys?.GEMINI_API_KEY || ""
      } as any);

      activeConfig = await ConfigService.build({
        ...activeConfig,
        generative: {
          primary: providerPrompt.provider,
          fallback: providerPrompt.provider === "openai" ? "gemini" : "openai",
          keys: {
            OPENAI_API_KEY: openaiPrompt.apiKey.trim(),
            GEMINI_API_KEY: geminiPrompt.apiKey.trim()
          }
        }
      });
      await ConfigService.save(currentPath, activeConfig);
      console.log("");
      console.log(style.success("Generative AI provider settings successfully updated."));
    }
  }

  console.log("");
  return activeConfig;
}
