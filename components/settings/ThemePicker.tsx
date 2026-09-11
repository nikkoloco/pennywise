"use client";

import { useState } from "react";
import { setTheme } from "@/app/theme-actions";
import { Card } from "@/components/ui/Card";
import { THEME_IDS, THEMES, type ThemeId } from "@/lib/theme";

/**
 * The five looks, each shown as its own app icon. Picking one repaints the
 * page at once; the cookie the action sets is what makes it stick.
 */
export function ThemePicker({ initial }: { initial: ThemeId }) {
  const [theme, setCurrent] = useState(initial);

  function pick(next: ThemeId) {
    setCurrent(next);
    document.documentElement.setAttribute("data-theme", next);
    void setTheme(next);
  }

  return (
    <Card>
      <div className="grid grid-cols-5 gap-2">
        {THEME_IDS.map((id) => {
          const { label, icon } = THEMES[id];
          const on = id === theme;
          return (
            <button
              key={id}
              type="button"
              onClick={() => pick(id)}
              aria-pressed={on}
              className="flex flex-col items-center gap-2"
            >
              <span
                className={`flex size-12 items-center justify-center rounded-2xl ${
                  on ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-ink-700" : ""
                }`}
                style={{
                  background: `linear-gradient(${icon.ground[0]}, ${icon.ground[1]})`,
                }}
              >
                <span
                  className="text-xl font-extrabold"
                  style={{ color: icon.glyph }}
                >
                  ₱
                </span>
              </span>
              <span
                className={`text-[11px] leading-tight ${
                  on ? "font-semibold text-sky-100" : "text-sky-300"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
