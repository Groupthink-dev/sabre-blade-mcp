export class SabreApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
    public readonly path: string,
  ) {
    super(`Sabre API error ${status} on ${path}: ${detail}`);
    this.name = "SabreApiError";
  }
}

export class SabreAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SabreAuthError";
  }
}

export function handleApiError(error: unknown): string {
  if (error instanceof SabreAuthError) {
    return (
      `Authentication error: ${error.message}. ` +
      `Check SABRE_CLIENT_ID, SABRE_CLIENT_SECRET, and SABRE_PCC are correct. ` +
      `Ensure your Sabre developer account is active.`
    );
  }

  if (error instanceof SabreApiError) {
    switch (error.status) {
      case 400:
        return `Error (400 Bad Request): ${error.detail}. Check request parameters — see Sabre API docs for required fields.`;
      case 401:
        return `Error (401 Unauthorized): ${error.detail}. Token may have expired — the server will retry automatically.`;
      case 403:
        return `Error (403 Forbidden): ${error.detail}. Your credentials may not have access to this API. Check your Sabre developer portal entitlements.`;
      case 404:
        return `Error (404 Not Found): ${error.detail}. The requested resource does not exist. Verify IDs and locators.`;
      case 429:
        return `Error (429 Rate Limited): ${error.detail}. Too many requests — wait before retrying.`;
      case 500:
      case 502:
      case 503:
        return `Error (${error.status} Server Error): ${error.detail}. Sabre service is temporarily unavailable. Retry shortly.`;
      default:
        return `Error (${error.status}): ${error.detail}`;
    }
  }

  if (error instanceof Error) {
    if (error.message.includes("fetch failed") || error.message.includes("ECONNREFUSED")) {
      return "Error: Could not connect to Sabre API. Check network connectivity and SABRE_ENVIRONMENT setting.";
    }
    return `Error: ${error.message}`;
  }

  return `Error: An unexpected error occurred: ${String(error)}`;
}
