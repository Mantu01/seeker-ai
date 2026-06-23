import { Config, ConfigService } from "@seeker/config";
import { ThemeId } from "@seeker/constants";
import { styleFor } from "../ui/styles.js";
import { renderBlock } from "../ui/renderer.js";
import enquirer from "enquirer";

export async function handlePrompt(
  currentPath: string,
  config: Config,
  theme: ThemeId,
  borderStyle?: string
): Promise<Config> {
  const style = styleFor(theme);
  const prompt = enquirer.prompt.bind(enquirer);

  while (true) {
    console.log("");
    const hasPrompt = config.userPrompt && config.userPrompt.trim().length > 0;
    const showMessage = hasPrompt ? "Show Prompt" : "Show Prompt (No prompt provided)";

    const menuChoice = await prompt<{ action: "show" | "edit" | "exit" }>({
      type: "select",
      name: "action",
      message: style.prompt("Personalized Prompt Setup"),
      choices: [
        { name: "show", message: showMessage },
        { name: "edit", message: "Edit Prompt" },
        { name: "exit", message: "Back to Main Shell" }
      ]
    } as any);

    if (menuChoice.action === "exit") {
      break;
    }

    if (menuChoice.action === "show") {
      console.log("");
      if (!hasPrompt) {
        console.log(style.warning("No prompt has been configured yet."));
      } else {
        console.log(renderBlock(config.userPrompt!, theme, borderStyle, "CURRENT PERSONALIZED PROMPT"));
      }
    } else if (menuChoice.action === "edit") {
      console.log("");
      const editResult = await prompt<{ value: string }>({
        type: "input",
        name: "value",
        message: style.prompt("Enter your outreach bio / details (skills, resume, portfolio, etc.)"),
        initial: config.userPrompt || ""
      });

      config.userPrompt = editResult.value.trim();
      await ConfigService.save(currentPath, config);

      console.log("");
      console.log(style.success("Personalized prompt details updated successfully."));
    }
  }

  return config;
}
