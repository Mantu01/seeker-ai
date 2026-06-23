export function parseStartupCommand(args: string[]): string | undefined {
  const raw = args[0]?.trim();
  if (!raw) {
    return undefined;
  }
  if (raw === "--help" || raw === "-h" || raw === "help") {
    return "help";
  }
  if (raw.startsWith("/")) {
    return normalizeCommand(raw);
  }
  return undefined;
}

export function normalizeCommand(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const sanitized = value.replace(/\\/g, "/").trim();
  const segments = sanitized.split("/").filter(Boolean);
  const lastSegment = segments.pop();
  if (!lastSegment) {
    return undefined;
  }
  return lastSegment.replace(/^\/+/, "");
}

export function parseCommandInput(input: string): string[] {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  return tokens.slice(1);
}
