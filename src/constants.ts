export const SABRE_API_BASE_PROD = "https://api.platform.sabre.com";
export const SABRE_API_BASE_CERT =
  "https://api-crt.cert.platform.sabre.com";

export const ENV = {
  CLIENT_ID: "SABRE_CLIENT_ID",
  CLIENT_SECRET: "SABRE_CLIENT_SECRET",
  PCC: "SABRE_PCC",
  ENVIRONMENT: "SABRE_ENVIRONMENT",
  WRITE_ENABLED: "SABRE_WRITE_ENABLED",
  MCP_API_TOKEN: "MCP_API_TOKEN",
  TRANSPORT: "TRANSPORT",
  PORT: "PORT",
} as const;

export const DEFAULT_PORT = 8790;

/** Character limit for tool responses before truncation guidance. */
export const CHARACTER_LIMIT = 4000;

export function getApiBase(): string {
  const env = process.env[ENV.ENVIRONMENT]?.toLowerCase();
  return env === "production" || env === "prod"
    ? SABRE_API_BASE_PROD
    : SABRE_API_BASE_CERT;
}

export function getClientId(): string {
  const id = process.env[ENV.CLIENT_ID];
  if (!id) throw new Error(`${ENV.CLIENT_ID} environment variable is required`);
  return id;
}

export function getClientSecret(): string {
  const secret = process.env[ENV.CLIENT_SECRET];
  if (!secret)
    throw new Error(`${ENV.CLIENT_SECRET} environment variable is required`);
  return secret;
}

export function getPcc(): string {
  const pcc = process.env[ENV.PCC];
  if (!pcc) throw new Error(`${ENV.PCC} environment variable is required`);
  return pcc;
}
