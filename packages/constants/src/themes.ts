export const ThemeId = {
  aurora: "aurora",
  midnight: "midnight",
  sunset: "sunset",
  forest: "forest",
  cyberpunk: "cyberpunk",
  dracula: "dracula"
} as const;

export type ThemeId = (typeof ThemeId)[keyof typeof ThemeId];

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  body: string;
  title: string;
}

export const THEME_OPTIONS: Record<ThemeId, ThemeDefinition> = {
  aurora: {
    id: "aurora",
    label: "Aurora",
    accent: "#74c0fc",
    success: "#63e6be",
    warning: "#ffd43b",
    error: "#ff6b6b",
    body: "#cddcfe",
    title: "#ffffff"
  },
  midnight: {
    id: "midnight",
    label: "Midnight",
    accent: "#7c3aed",
    success: "#22c55e",
    warning: "#fb7185",
    error: "#f97316",
    body: "#cbd5e1",
    title: "#f8fafc"
  },
  sunset: {
    id: "sunset",
    label: "Sunset",
    accent: "#f43f5e",
    success: "#fb7185",
    warning: "#f59e0b",
    error: "#dc2626",
    body: "#fdba74",
    title: "#ffedd5"
  },
  forest: {
    id: "forest",
    label: "Forest",
    accent: "#16a34a",
    success: "#4ade80",
    warning: "#facc15",
    error: "#dc2626",
    body: "#d9f99d",
    title: "#d1fae5"
  },
  cyberpunk: {
    id: "cyberpunk",
    label: "Cyberpunk",
    accent: "#ff007f",
    success: "#00ffff",
    warning: "#ffff00",
    error: "#ff0000",
    body: "#e0e0e0",
    title: "#ffffff"
  },
  dracula: {
    id: "dracula",
    label: "Dracula",
    accent: "#bd93f9",
    success: "#50fa7b",
    warning: "#f1fa8c",
    error: "#ff5555",
    body: "#f8f8f2",
    title: "#ffffff"
  }
};

export const FONT_STYLE_OPTIONS = [
  { id: "standard", label: "Standard Bold" },
  { id: "slanted", label: "Slanted Italic" },
  { id: "block", label: "Solid Block" },
  { id: "isometric", label: "3D Isometric" }
] as const;

export type FontStyleId = (typeof FONT_STYLE_OPTIONS)[number]["id"];

export const BORDER_STYLE_OPTIONS = [
  { id: "double", label: "Double Border (Classic)" },
  { id: "round", label: "Round Border (Modern)" },
  { id: "single", label: "Single Border (Minimal)" },
  { id: "bold", label: "Bold Border (Strong)" }
] as const;

export type BorderStyleId = (typeof BORDER_STYLE_OPTIONS)[number]["id"];

