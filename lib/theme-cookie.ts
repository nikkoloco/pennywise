import { cookies } from "next/headers";
import { THEME_COOKIE, toThemeId } from "./theme";

/** The look this device asked for, or the default if it never chose. */
export async function currentTheme() {
  return toThemeId((await cookies()).get(THEME_COOKIE)?.value);
}
