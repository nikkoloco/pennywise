"use server";

import { cookies } from "next/headers";
import { isThemeId, THEME_COOKIE, type ThemeId } from "@/lib/theme";

const THEME_MAX_AGE = 400 * 24 * 60 * 60;

/** Remembers the chosen look on this device. The layout reads it on every page. */
export async function setTheme(theme: ThemeId) {
  if (!isThemeId(theme)) return;

  (await cookies()).set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: THEME_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
