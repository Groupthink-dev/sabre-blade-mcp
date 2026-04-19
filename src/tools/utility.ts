import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sabreFetch } from "../services/sabre.js";
import { handleApiError } from "../utils/errors.js";
import {
  GeoSearchSchema,
  AirlineLookupSchema,
  DestinationsSchema,
  CarSearchSchema,
} from "../schemas/utility.js";
import type {
  GeoSearchInput,
  AirlineLookupInput,
  DestinationsInput,
  CarSearchInput,
} from "../schemas/utility.js";
import {
  formatGeoSearchResponse,
  formatAirlineLookupResponse,
  formatDestinationsResponse,
  formatCarSearchResponse,
} from "../formatters/utility.js";

export function registerUtilityTools(server: McpServer): void {
  // --- sabre_geo_search ---
  server.tool(
    "sabre_geo_search",
    "Look up airports and cities by name or IATA/ICAO code. Returns codes, coordinates, country, and timezone.",
    GeoSearchSchema.shape,
    async (params: GeoSearchInput) => {
      try {
        const queryParams = new URLSearchParams({
          query: params.query,
          ...(params.category && params.category !== "all"
            ? { category: params.category }
            : {}),
          ...(params.country ? { country: params.country } : {}),
          limit: String(params.max_results || 10),
        });

        const res = await sabreFetch(
          `/v1/lists/utilities/geosearch/locations?${queryParams}`,
        );
        const data = await res.json();
        return {
          content: [
            { type: "text" as const, text: formatGeoSearchResponse(data) },
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

  // --- sabre_airline_lookup ---
  server.tool(
    "sabre_airline_lookup",
    "Look up airline information by IATA (2-char) or ICAO (3-char) code. Returns airline name, country, and alliance.",
    AirlineLookupSchema.shape,
    async (params: AirlineLookupInput) => {
      try {
        const res = await sabreFetch(
          `/v1/lists/utilities/airlines?airlineCode=${params.code.toUpperCase()}`,
        );
        const data = await res.json();
        return {
          content: [
            {
              type: "text" as const,
              text: formatAirlineLookupResponse(data),
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

  // --- sabre_destinations ---
  server.tool(
    "sabre_destinations",
    "Discover popular destinations from an origin airport, optionally filtered by theme (beach, skiing, historic, etc.).",
    DestinationsSchema.shape,
    async (params: DestinationsInput) => {
      try {
        const queryParams = new URLSearchParams({
          origin: params.origin.toUpperCase(),
          ...(params.theme ? { theme: params.theme.toUpperCase() } : {}),
          limit: String(params.max_results || 20),
        });

        const res = await sabreFetch(
          `/v2/shop/flights/fares?${queryParams}`,
        );
        const data = await res.json();
        return {
          content: [
            {
              type: "text" as const,
              text: formatDestinationsResponse(data),
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

  // --- sabre_car_search ---
  server.tool(
    "sabre_car_search",
    "Search for rental cars by pickup/dropoff location and dates. Returns vehicles from 40+ rental brands with rates.",
    CarSearchSchema.shape,
    async (params: CarSearchInput) => {
      try {
        const body = {
          OTA_VehAvailRateRQ: {
            VehAvailRQCore: {
              VehRentalCore: {
                PickUpDateTime: `${params.pickup_date}T${params.pickup_time || "10:00"}:00`,
                ReturnDateTime: `${params.dropoff_date}T${params.dropoff_time || "10:00"}:00`,
                PickUpLocation: {
                  LocationCode: params.pickup_location.toUpperCase(),
                },
                ReturnLocation: {
                  LocationCode: (
                    params.dropoff_location || params.pickup_location
                  ).toUpperCase(),
                },
              },
              ...(params.car_type
                ? {
                    VehPrefs: {
                      VehPref: [
                        {
                          VehClass: params.car_type.toUpperCase(),
                        },
                      ],
                    },
                  }
                : {}),
            },
          },
        };

        const res = await sabreFetch("/v2.4.0/shop/cars", {
          method: "POST",
          body: JSON.stringify(body),
        });
        const data = await res.json();
        return {
          content: [
            { type: "text" as const, text: formatCarSearchResponse(data) },
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
