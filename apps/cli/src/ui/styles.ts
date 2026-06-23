import chalk from "chalk";
import { ThemeId, THEME_OPTIONS } from "@seeker/constants";

export interface CliStyle {
  accent(text: string): string;
  success(text: string): string;
  warning(text: string): string;
  error(text: string): string;
  body(text: string): string;
  link(text: string): string;
  prompt(text: string): string;
  accentColor: string;
  title(text: string): string;
}

export function styleFor(theme: ThemeId): CliStyle {
  const token = THEME_OPTIONS[theme] ?? THEME_OPTIONS.aurora;
  return {
    accent: (value: string) => chalk.hex(token.accent).bold(value),
    success: (value: string) => chalk.hex(token.success).bold(value),
    warning: (value: string) => chalk.hex(token.warning).bold(value),
    error: (value: string) => chalk.hex(token.error).bold(value),
    body: (value: string) => chalk.hex(token.body)(value),
    link: (value: string) => chalk.underline.hex(token.accent)(value),
    prompt: (value: string) => chalk.hex(token.accent).bold(value),
    accentColor: token.accent,
    title: (value: string) => chalk.hex(token.title).bold(value)
  };
}
