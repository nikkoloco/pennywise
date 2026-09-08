import { createHash, randomBytes } from "node:crypto";

/**
 * Shortcut tokens are shown once at creation and stored only as a hash, so a
 * leaked database row cannot be replayed against the logging endpoint.
 */
export function generateToken() {
  return `pw_${randomBytes(24).toString("base64url")}`;
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
