import { ENV } from "../constants.js";

/**
 * Validate bearer token for HTTP transport.
 * Returns true if valid, false if invalid, null if no MCP_API_TOKEN is configured
 * (open access — intended for local/tunnelled use only).
 */
export function validateBearerToken(
  authHeader: string | undefined,
): boolean | null {
  const expected = process.env[ENV.MCP_API_TOKEN];
  if (!expected) return null; // No token configured — open access

  if (!authHeader) return false;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return false;

  // Constant-time comparison
  const provided = parts[1];
  if (provided.length !== expected.length) return false;

  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
