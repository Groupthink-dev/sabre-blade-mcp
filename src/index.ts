#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Hono } from "hono";
import { createServer } from "./server.js";
import { validateCredentials } from "./services/sabre.js";
import { validateBearerToken } from "./services/auth.js";
import { ENV, DEFAULT_PORT } from "./constants.js";

async function runStdio(): Promise<void> {
  const { pcc } = await validateCredentials();
  console.error(`[sabre-blade-mcp] Authenticated (PCC: ${pcc}). Starting stdio transport.`);

  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function runHttp(): Promise<void> {
  const port = Number(process.env[ENV.PORT]) || DEFAULT_PORT;
  const app = new Hono();

  // Bearer auth middleware (skip /health)
  app.use("/*", async (c, next) => {
    if (c.req.path === "/health") return next();

    const result = validateBearerToken(c.req.header("Authorization"));
    if (result === false) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    await next();
  });

  app.get("/health", (c) =>
    c.json({ status: "ok", server: "sabre-blade-mcp", version: "0.1.0" }),
  );

  app.post("/mcp", async (c) => {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    const body = await c.req.json();

    const nodeReq = (c.env as Record<string, unknown>)?.incoming as
      | import("node:http").IncomingMessage
      | undefined;
    const nodeRes = (c.env as Record<string, unknown>)?.outgoing as
      | import("node:http").ServerResponse
      | undefined;

    if (nodeReq && nodeRes) {
      nodeRes.on("close", () => transport.close());
      await server.connect(transport);
      await transport.handleRequest(nodeReq, nodeRes, body);
      return undefined as unknown as Response;
    }

    return c.json(
      { error: "HTTP transport requires Node.js runtime." },
      501,
    );
  });

  const { serve } = await import("@hono/node-server");
  serve({ fetch: app.fetch, port }, () => {
    console.error(
      `[sabre-blade-mcp] HTTP transport listening on port ${port}`,
    );
  });
}

const transport = process.env[ENV.TRANSPORT]?.toLowerCase();

if (transport === "http") {
  runHttp().catch((err) => {
    console.error("[sabre-blade-mcp] Fatal:", err);
    process.exit(1);
  });
} else {
  runStdio().catch((err) => {
    console.error("[sabre-blade-mcp] Fatal:", err);
    process.exit(1);
  });
}
