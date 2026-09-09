"use client";

import { useState, useTransition } from "react";
import { createApiToken, deleteApiToken, revokeApiToken } from "@/app/actions";
import { CopyField } from "@/components/settings/CopyField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Token = {
  id: string;
  name: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
};

export function TokenManager({ tokens }: { tokens: Token[] }) {
  const [, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [issued, setIssued] = useState<string | null>(null);

  function create() {
    startTransition(async () => {
      setIssued(await createApiToken(name.trim() || "iPhone"));
      setName("");
    });
  }

  return (
    <Card>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Token name, e.g. iPhone"
          maxLength={40}
          aria-label="Token name"
          className="min-h-11 flex-1 rounded-2xl bg-ink-600 px-4 text-sm text-sky-100 placeholder:text-sky-400 focus:outline-none"
        />
        <Button onClick={create}>Create</Button>
      </div>

      {issued && (
        <div className="mt-4 rounded-2xl border border-gold-500/40 bg-void/40 p-3">
          <p className="mb-2 text-xs text-gold-300">
            Copy this now. It is stored hashed and cannot be shown again.
          </p>
          <div className="flex flex-col gap-2">
            <CopyField value={issued} />
            {/* The header value is what actually gets pasted into Shortcuts. */}
            <CopyField
              label="Ready-made Authorization header value"
              value={`Bearer ${issued}`}
            />
          </div>
        </div>
      )}

      {tokens.length > 0 && (
        <ul className="mt-4 divide-y divide-ink-600">
          {tokens.map((token) => (
            <li key={token.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-sky-100">
                  {token.name}
                  {token.revokedAt && (
                    <span className="ml-2 text-xs text-umber-300">revoked</span>
                  )}
                </p>
                <p className="text-xs text-sky-300">
                  {token.lastUsedAt
                    ? `last used ${token.lastUsedAt.toLocaleDateString("en-PH")}`
                    : "never used"}
                </p>
              </div>
              {!token.revokedAt && (
                <button
                  type="button"
                  onClick={() => startTransition(() => revokeApiToken(token.id))}
                  className="min-h-11 shrink-0 px-3 text-xs font-semibold text-umber-300"
                >
                  Revoke
                </button>
              )}
              <button
                type="button"
                onClick={() => startTransition(() => deleteApiToken(token.id))}
                className="min-h-11 shrink-0 px-3 text-xs font-semibold text-umber-300"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
