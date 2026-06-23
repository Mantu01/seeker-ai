import boxen from "boxen";
import figlet from "figlet";
import ora from "ora";
import { ThemeId } from "@seeker/constants";
import { styleFor } from "./styles.js";

function mapFontStyle(fontStyle?: string): any {
  if (fontStyle === "slanted") return "Slanted";
  if (fontStyle === "block") return "Doom";
  if (fontStyle === "isometric") return "Isometric3";
  return "Standard";
}

function mapBorderStyle(borderStyle?: string): "double" | "round" | "single" | "bold" {
  if (borderStyle === "round") return "round";
  if (borderStyle === "single") return "single";
  if (borderStyle === "bold") return "bold";
  return "double";
}

function oraColorFor(theme: ThemeId): "cyan" | "magenta" | "red" | "green" | "yellow" | "blue" {
  if (theme === "midnight") return "magenta";
  if (theme === "sunset") return "red";
  if (theme === "forest") return "green";
  if (theme === "cyberpunk") return "magenta";
  if (theme === "dracula") return "blue";
  return "cyan";
}

export function renderBanner(theme: ThemeId, fontStyle?: string, borderStyle?: string): string {
  const style = styleFor(theme);
  let art = "Seeker";
  try {
    art = figlet.textSync("Seeker", {
      font: mapFontStyle(fontStyle),
      horizontalLayout: "full",
      width: 120
    });
  } catch {
    art = figlet.textSync("Seeker");
  }
  const headline = style.title(art);
  
  const separator = style.accent("─".repeat(50));
  const dashboard = [
    headline,
    "",
    `${style.accent("✦")} ${style.body("Seeker Outreach Automation Engine")} ${style.accent("✦")}`,
    separator,
    `${style.accent("STATUS:")} ${style.success("ONLINE")}  |  ${style.accent("ENV:")} ${style.body("WORKSPACE")}  |  ${style.accent("LOAD:")} ${style.body("READY")}`
  ].join("\n");

  return boxen(dashboard, {
    title: " SEEKER ENGINE SYSTEM ",
    titleAlignment: "center",
    borderColor: style.accentColor,
    padding: 1,
    margin: 1,
    float: "center",
    borderStyle: mapBorderStyle(borderStyle),
    align: "center"
  });
}

export function renderShellHeader(theme: ThemeId, borderStyle?: string): string {
  const style = styleFor(theme);
  const header = [
    style.accent("Welcome to Seeker Shell Console"),
    style.body("Type /help to view command list, /theme to style interface, and /exit to quit."),
    style.body("Use /start to process lead csv data. All commands begin with a leading / symbol.")
  ].join("\n");

  return boxen(header, {
    title: " SYSTEM TERMINAL ",
    titleAlignment: "left",
    borderColor: style.accentColor,
    padding: 1,
    margin: { top: 0, bottom: 1, left: 1, right: 1 },
    borderStyle: mapBorderStyle(borderStyle)
  });
}

export function renderBlock(text: string, theme: ThemeId, borderStyle?: string, blockTitle?: string): string {
  const style = styleFor(theme);
  return boxen(style.body(text), {
    title: blockTitle ? ` ${blockTitle} ` : undefined,
    titleAlignment: "left",
    borderColor: style.accentColor,
    padding: 1,
    margin: 1,
    borderStyle: mapBorderStyle(borderStyle)
  });
}

export function renderTable(headers: string[], rows: string[][], theme: ThemeId): string {
  const style = styleFor(theme);
  
  const styleCell = (cellValue: string, isHeader: boolean) => {
    if (isHeader) return style.accent(cellValue);
    const upper = cellValue.trim().toUpperCase();
    if (upper === "SENT" || upper === "SUCCESS") return style.success(cellValue);
    if (upper.startsWith("FAIL") || upper === "ERROR") return style.error(cellValue);
    if (upper === "SKIPPED" || upper === "SKIP") return style.warning(cellValue);
    return style.body(cellValue);
  };

  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i]?.length || 0)));

  const topBorder = "┌─" + widths.map((w) => "─".repeat(w)).join("─┬─") + "─┐";
  const middleBorder = "├─" + widths.map((w) => "─".repeat(w)).join("─┼─") + "─┤";
  const bottomBorder = "└─" + widths.map((w) => "─".repeat(w)).join("─┴─") + "─┘";

  const formatRow = (cols: string[], isHeader: boolean) => {
    const formattedCols = cols.map((c, i) => {
      const padded = c.padEnd(widths[i] ?? 0);
      return styleCell(padded, isHeader);
    });
    return style.accent("│ ") + formattedCols.join(style.accent(" │ ")) + style.accent(" │");
  };

  const headerStr = formatRow(headers, true);
  const rowStrs = rows.map((r) => formatRow(r, false));

  return [
    style.accent(topBorder),
    headerStr,
    style.accent(middleBorder),
    ...rowStrs,
    style.accent(bottomBorder)
  ].join("\n");
}

export function createSpinner(text: string, theme: ThemeId) {
  const style = styleFor(theme);
  return ora({
    text: style.body(text),
    color: oraColorFor(theme),
    spinner: "dots"
  });
}
