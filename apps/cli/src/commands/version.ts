import { ThemeId } from "@seeker/constants";
import { styleFor } from "../ui/styles.js";

export async function handleVersion(theme: ThemeId): Promise<void> {
  console.log(styleFor(theme).accent("Seeker CLI v0.1.0"));
}
