import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sabreFetch } from "../services/sabre.js";
import { handleApiError } from "../utils/errors.js";
import { TripGetSchema, TripListSchema } from "../schemas/trip.js";
import type { TripGetInput, TripListInput } from "../schemas/trip.js";
import {
  formatTripGetResponse,
  formatTripListResponse,
} from "../formatters/trip.js";

export function registerTripReadTools(server: McpServer): void {
  // --- sabre_trip_get ---
  server.tool(
    "sabre_trip_get",
    "Retrieve a PNR (Passenger Name Record) by its locator. Returns passengers, segments (air/hotel/car), status, and ticketing info.",
    TripGetSchema.shape,
    async (params: TripGetInput) => {
      try {
        const res = await sabreFetch(
          `/v1/trip/orders/getBooking?confirmationId=${params.locator}`,
        );
        const data = await res.json();
        return {
          content: [
            { type: "text" as const, text: formatTripGetResponse(data) },
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

  // --- sabre_trip_list ---
  server.tool(
    "sabre_trip_list",
    "List active trips/PNRs. Optionally filter by passenger surname, departure date, or booking status.",
    TripListSchema.shape,
    async (params: TripListInput) => {
      try {
        const queryParams = new URLSearchParams();
        if (params.surname) queryParams.set("surname", params.surname);
        if (params.departure_date)
          queryParams.set("departureDate", params.departure_date);
        if (params.status && params.status !== "all")
          queryParams.set("status", params.status);

        const qs = queryParams.toString();
        const res = await sabreFetch(
          `/v1/trip/orders${qs ? `?${qs}` : ""}`,
        );
        const data = await res.json();
        return {
          content: [
            { type: "text" as const, text: formatTripListResponse(data) },
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
