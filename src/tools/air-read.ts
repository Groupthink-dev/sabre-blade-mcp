import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sabreFetch } from "../services/sabre.js";
import { handleApiError } from "../utils/errors.js";
import {
  AirSearchSchema,
  AirPriceSchema,
  AirRulesSchema,
  AirSeatmapSchema,
} from "../schemas/air.js";
import type {
  AirSearchInput,
  AirPriceInput,
  AirRulesInput,
  AirSeatmapInput,
} from "../schemas/air.js";
import {
  formatAirSearchResponse,
  formatAirPriceResponse,
  formatAirRulesResponse,
  formatSeatmapResponse,
} from "../formatters/air.js";

const CABIN_MAP: Record<string, string> = {
  economy: "Y",
  premium_economy: "S",
  business: "C",
  first: "F",
};

export function registerAirReadTools(server: McpServer): void {
  // --- sabre_air_search ---
  server.tool(
    "sabre_air_search",
    "Search for flights using Sabre Bargain Finder Max. Returns priced itineraries with fares, schedules, and booking classes. Supports round-trip and one-way.",
    AirSearchSchema.shape,
    async (params: AirSearchInput) => {
      try {
        const body: Record<string, unknown> = {
          OTA_AirLowFareSearchRQ: {
            Version: "5",
            POS: {
              Source: [{ PseudoCityCode: process.env.SABRE_PCC }],
            },
            OriginDestinationInformation: [
              {
                DepartureDateTime: `${params.departure_date}T00:00:00`,
                OriginLocation: { LocationCode: params.origin.toUpperCase() },
                DestinationLocation: {
                  LocationCode: params.destination.toUpperCase(),
                },
              },
              ...(params.return_date
                ? [
                    {
                      DepartureDateTime: `${params.return_date}T00:00:00`,
                      OriginLocation: {
                        LocationCode: params.destination.toUpperCase(),
                      },
                      DestinationLocation: {
                        LocationCode: params.origin.toUpperCase(),
                      },
                    },
                  ]
                : []),
            ],
            TravelerInfoSummary: {
              AirTravelerAvail: [
                {
                  PassengerTypeQuantity: [
                    { Code: "ADT", Quantity: params.adults },
                    ...(params.children
                      ? [{ Code: "CNN", Quantity: params.children }]
                      : []),
                    ...(params.infants
                      ? [{ Code: "INF", Quantity: params.infants }]
                      : []),
                  ],
                },
              ],
            },
            TPA_Extensions: {
              IntelliSellTransaction: {
                RequestType: { Name: "50ITINS" },
              },
              ...(params.nonstop
                ? { FlightStopsOptions: { MaxStops: 0 } }
                : {}),
              ...(params.cabin
                ? {
                    CabinPref: {
                      Cabin: CABIN_MAP[params.cabin] || "Y",
                    },
                  }
                : {}),
            },
          },
        };

        const res = await sabreFetch("/v5/shop/flights", {
          method: "POST",
          body: JSON.stringify(body),
        });
        const data = await res.json();
        return {
          content: [{ type: "text" as const, text: formatAirSearchResponse(data) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    },
  );

  // --- sabre_air_price ---
  server.tool(
    "sabre_air_price",
    "Price/revalidate a specific itinerary from a previous air search. Returns updated fare, taxes, and ticketing deadline.",
    AirPriceSchema.shape,
    async (params: AirPriceInput) => {
      try {
        const res = await sabreFetch("/v4/shop/flights/revalidate", {
          method: "POST",
          body: JSON.stringify({
            OTA_AirLowFareSearchRQ: {
              Version: "4",
              ItineraryId: params.itinerary_id,
            },
          }),
        });
        const data = await res.json();
        return {
          content: [{ type: "text" as const, text: formatAirPriceResponse(data) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    },
  );

  // --- sabre_air_rules ---
  server.tool(
    "sabre_air_rules",
    "Retrieve fare rules for a specific itinerary — cancellation penalties, minimum stay, advance purchase requirements.",
    AirRulesSchema.shape,
    async (params: AirRulesInput) => {
      try {
        const res = await sabreFetch("/v1/shop/flights/rules", {
          method: "POST",
          body: JSON.stringify({
            OTA_AirRulesRQ: {
              ItineraryId: params.itinerary_id,
              ...(params.category && params.category !== "all"
                ? { Category: params.category }
                : {}),
            },
          }),
        });
        const data = await res.json();
        return {
          content: [{ type: "text" as const, text: formatAirRulesResponse(data) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    },
  );

  // --- sabre_air_seatmap ---
  server.tool(
    "sabre_air_seatmap",
    "Retrieve seat map for a specific flight — shows available seats, cabin layout, and seat charges.",
    AirSeatmapSchema.shape,
    async (params: AirSeatmapInput) => {
      try {
        const res = await sabreFetch("/v4/shop/flights/seatmap", {
          method: "POST",
          body: JSON.stringify({
            OTA_AirSeatMapRQ: {
              FlightInfo: {
                FlightNumber: params.flight_number,
                DepartureDate: params.departure_date,
                Origin: params.origin.toUpperCase(),
                Destination: params.destination.toUpperCase(),
              },
            },
          }),
        });
        const data = await res.json();
        return {
          content: [{ type: "text" as const, text: formatSeatmapResponse(data) }],
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
