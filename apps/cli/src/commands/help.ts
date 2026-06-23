import { HELP_CONTENT, YOUTUBE_LINKS, ThemeId } from "@seeker/constants";
import { styleFor } from "../ui/styles.js";
import { renderBlock } from "../ui/renderer.js";

export async function handleHelp(theme: ThemeId, borderStyle?: string): Promise<void> {
  const style = styleFor(theme);
  console.log(renderBlock(HELP_CONTENT, theme, borderStyle));
  console.log(style.accent("Documentation:"), style.link(YOUTUBE_LINKS.DOCS));
}
