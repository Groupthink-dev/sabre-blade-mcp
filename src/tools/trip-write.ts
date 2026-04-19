import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sabreFetch } from "../services/sabre.js";
import { handleApiError } from "../utils/errors.js";
import { requireWrite } from "../utils/write-gate.js";
import { TripCancelSchema } from "../schemas/trip.js";
import type { TripCancelInput } from "../schemas/trip.js";
import { formatCancelConfirmation } from "../formatters/trip.js";

export function registerTripWriteTools(server: McpServer): void {
  // --- sabre_trip_cancel ---
  server.tool(
    "sabre_trip_cancel",
    "Cancel a PNR or specific segments. WRITE-GATED: requires SABRE_WRITE_ENABLED=true and confirm=true. Cancels a live reservation in the Sabre GDS.",
    TripCancelSchema.shape,
    async (params: TripCancelInput) => {
      const gateError = requireWrite(params.confirm, "trip_cancel");
      if (gateError) {
        return {
          content: [{ type: "text" as const, text: gateError }],
          isError: true,
        };
      }

      try {
        const body: Record<string, unknown> = {
          OTA_CancelRQ: {
            Version: "2.0",
            UniqueID: { ID: params.locator, Type: "PNR" },
            ...(params.segments?.length
              ? {
                  Segment: params.segments.map((seg) => ({
                    Number: seg,
                  })),
                }
              : {}),
          },
        };

        const res = await sabreFetch("/v1/trip/orders/cancel", {
          method: "POST",
          body: JSON.stringify(body),
        });
        const data = await res.json();
        return {
          content: [
            {
              type: "text" as const,
              text: formatCancelConfirmation({
                ...data,
                locator: params.locator,
                cancelledSegments: params.segments || "all",
              }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    },
  );
}
