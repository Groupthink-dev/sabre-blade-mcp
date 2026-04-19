import {
  getApiBase,
  getClientId,
  getClientSecret,
  getPcc,
} from "../constants.js";
import { SabreApiError, SabreAuthError } from "../utils/errors.js";

// ---------- Token cache ----------

interface CachedToken {
  access_token: string;
  expires_at: number; // epoch ms
}

let tokenCache: CachedToken | null = null;

/** Buffer before expiry to trigger refresh (5 minutes). */
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/**
 * Acquire a sessionless OAuth token using client credentials.
 * Tokens are valid for 7 days; we cache and refresh proactively.
 */
async function acquireToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expires_at - EXPIRY_BUFFER_MS) {
    return tokenCache.access_token;
  }

  const base = getApiBase();
  const clientId = getClientId();
  const clientSecret = getClientSecret();

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const res = await fetch(`${base}/v2/auth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new SabreAuthError(
      `Token acquisition failed (${res.status}): ${body}`,
    );
  }

  const data = (await res.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };

  tokenCache = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  return tokenCache.access_token;
}

/** Clear the token cache (e.g. on 401 retry). */
function clearToken(): void {
  tokenCache = null;
}

// ---------- Fetch wrapper ----------

/**
 * Authenticated fetch against the Sabre REST API.
 * Automatically acquires/refreshes the OAuth token.
 * Retries once on 401 (token expiry).
 */
export async function sabreFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const base = getApiBase();
  const url = `${base}${path}`;

  const doFetch = async (): Promise<Response> => {
    const token = await acquireToken();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    };

    return fetch(url, { ...options, headers });
  };

  let res = await doFetch();

  // Retry once on 401 — token may have been revoked or expired
  if (res.status === 401) {
    clearToken();
    res = await doFetch();
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let detail = body;
    try {
      const parsed = JSON.parse(body);
      detail =
        parsed.message || parsed.error?.message || parsed.errorMessage || body;
    } catch {
      // Use raw body
    }
    throw new SabreApiError(res.status, detail, path);
  }

  return res;
}

/**
 * Validate credentials by acquiring a token.
 * Returns the PCC on success.
 */
export async function validateCredentials(): Promise<{ pcc: string }> {
  const pcc = getPcc();
  await acquireToken();
  return { pcc };
}
