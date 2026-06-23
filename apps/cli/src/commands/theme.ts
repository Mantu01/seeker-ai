import enquirer from "enquirer";
import { ThemeId, THEME_OPTIONS, FONT_STYLE_OPTIONS, BORDER_STYLE_OPTIONS } from "@seeker/constants";
import { Config, ConfigService } from "@seeker/config";
import { styleFor } from "../ui/styles.js";
import { renderBanner } from "../ui/renderer.js";

export async function handleTheme(currentPath: string, config: Config): Promise<Config> {
  const currentTheme = config.displayTheme;
  const style = styleFor(currentTheme);
  const prompt = enquirer.prompt.bind(enquirer);

  const themeChoice = await prompt<{ theme: ThemeId }>({
    type: "select",
    name: "theme",
    message: style.prompt("Choose a terminal color theme"),
    choices: (Object.values(THEME_OPTIONS) as any[]).map((entry) => ({
      name: entry.id,
      message: entry.label
    })),
    initial: config.displayTheme
  } as any);

  const nextStyle = styleFor(themeChoice.theme);

  const fontChoice = await prompt<{ font: string }>({
    type: "select",
    name: "font",
    message: nextStyle.prompt("Choose a text banner font style"),
    choices: FONT_STYLE_OPTIONS.map((f: any) => ({
      name: f.id,
      message: f.label
    })),
    initial: config.fontStyle || "standard"
  } as any);

  const borderChoice = await prompt<{ border: string }>({
    type: "select",
    name: "border",
    message: nextStyle.prompt("Choose a terminal border layout style"),
    choices: BORDER_STYLE_OPTIONS.map((b: any) => ({
      name: b.id,
      message: b.label
    })),
    initial: config.borderStyle || "double"
  } as any);

  const nextConfig = await ConfigService.build({
    ...config,
    displayTheme: themeChoice.theme,
    fontStyle: fontChoice.font,
    borderStyle: borderChoice.border
  });

  await ConfigService.save(currentPath, nextConfig);

  console.clear();
  console.log(renderBanner(themeChoice.theme, fontChoice.font, borderChoice.border));
  console.log(nextStyle.success("Theme settings successfully updated. Enjoy your new workspace!"));

  return nextConfig;
}
