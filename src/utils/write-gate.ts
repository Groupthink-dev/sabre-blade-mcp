import { ENV } from "../constants.js";

export function isWriteEnabled(): boolean {
  return process.env[ENV.WRITE_ENABLED]?.toLowerCase() === "true";
}

/**
 * Dual write-gate: requires both the SABRE_WRITE_ENABLED env var AND
 * per-call `confirm: true` before allowing a destructive operation.
 *
 * Returns null if both gates pass, or an error message string if blocked.
 */
export function requireWrite(
  confirm: boolean | undefined,
  operation: string,
): string | null {
  if (!isWriteEnabled()) {
    return (
      `Write operation "${operation}" blocked: ${ENV.WRITE_ENABLED} is not set to "true". ` +
      `Set ${ENV.WRITE_ENABLED}=true in your environment to enable booking and modification operations. ` +
      `This is a safety gate — Sabre write operations can incur real costs and create live reservations.`
    );
  }
  if (confirm !== true) {
    return (
      `Write operation "${operation}" blocked: confirm must be set to true. ` +
      `Pass { "confirm": true } to proceed. This prevents accidental bookings. ` +
      `⚠️ This operation will create or modify a live reservation in the Sabre GDS.`
    );
  }
  return null;
}
