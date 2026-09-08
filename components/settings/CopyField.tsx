"use client";

import { useState } from "react";

type Props = { value: string; label?: string; multiline?: boolean };

/** A read-only value with a copy button, since all of this gets retyped into iOS. */
export function CopyField({ value, label, multiline = false }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      {label && <p className="mb-1 text-xs text-sky-300">{label}</p>}
      <div className="flex items-start gap-2">
        <code
          className={`flex-1 rounded-xl bg-void/60 px-3 py-2 font-mono text-xs break-all text-sky-100 ${
            multiline ? "whitespace-pre-wrap" : ""
          }`}
        >
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          className="min-h-11 shrink-0 rounded-full bg-ink-600 px-4 text-xs font-semibold text-sky-100"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
