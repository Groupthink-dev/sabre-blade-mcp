import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sabreFetch } from "../services/sabre.js";
import { handleApiError } from "../utils/errors.js";
import {
  HotelSearchSchema,
  HotelAvailSchema,
  HotelContentSchema,
} from "../schemas/hotel.js";
import type {
  HotelSearchInput,
  HotelAvailInput,
  HotelContentInput,
} from "../schemas/hotel.js";
import {
  formatHotelSearchResponse,
  formatHotelAvailResponse,
  formatHotelContentResponse,
} from "../formatters/hotel.js";

export function registerHotelReadTools(server: McpServer): void {
  // --- sabre_hotel_search ---
  server.tool(
    "sabre_hotel_search",
    "Search for hotels by location, dates, and guest count. Returns properties with names, ratings, distances, and lowest rates.",
    HotelSearchSchema.shape,
    async (params: HotelSearchInput) => {
      try {
        const isCoords = params.location.includes(",");
        const locationCriteria = isCoords
          ? {
              GeoRef: {
                Radius: { Distance: params.radius || 25, DistanceUnit: "MI" },
                Position: {
                  Latitude: params.location.split(",")[0].trim(),
                  Longitude: params.location.split(",")[1].trim(),
                },
              },
            }
          : params.location.length === 3
            ? { HotelRef: { HotelCityCode: params.location.toUpperCase() } }
            : {
                GeoRef: {
                  Radius: {
                    Distance: params.radius || 25,
                    DistanceUnit: "MI",
                  },
                  Address: { CityName: params.location },
                },
              };

        const body = {
          GetHotelAvailRQ: {
            SearchCriteria: {
              OffSet: params.offset || 0,
              SortBy: params.sort_by === "distance" ? "DIST" : "TFP",
              NumProperties: params.max_results || 50,
              ...locationCriteria,
              RateInfoRef: {
                CurrencyCode: "USD",
                BestOnly: "2",
                StayDateRange: {
                  StartDate: params.check_in,
                  EndDate: params.check_out,
                },
                Rooms: {
                  Room: [
                    {
                      Index: 1,
                      Adults: params.guests,
                      RoomCount: params.rooms,
                    },
                  ],
                },
              },
              ...(params.star_rating
                ? {
                    HotelPref: {
                      SabreRating: { Min: String(params.star_rating) },
                    },
                  }
                : {}),
            },
          },
        };

        const res = await sabreFetch("/v3.0.0/shop/hotels/avail", {
          method: "POST",
          body: JSON.stringify(body),
        });
        const data = await res.json();
        return {
          content: [
            { type: "text" as const, text: formatHotelSearchResponse(data) },
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

  // --- sabre_hotel_avail ---
  server.tool(
    "sabre_hotel_avail",
    "Get detailed room rates and availability for a specific hotel property. Returns rate keys needed for booking.",
    HotelAvailSchema.shape,
    async (params: HotelAvailInput) => {
      try {
        const body = {
          HotelRateDescriptionRQ: {
            HotelRateDescriptionInfo: {
              HotelCode: params.property_id,
              StayDateRange: {
                StartDate: params.check_in,
                EndDate: params.check_out,
              },
              Rooms: {
                Room: [
                  {
                    Index: 1,
                    Adults: params.guests,
                    RoomCount: params.rooms,
                  },
                ],
              },
            },
          },
        };

        const res = await sabreFetch("/v3.0.0/shop/hotels/rate", {
          method: "POST",
          body: JSON.stringify(body),
        });
        const data = await res.json();
        return {
          content: [
            { type: "text" as const, text: formatHotelAvailResponse(data) },
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

  // --- sabre_hotel_content ---
  server.tool(
    "sabre_hotel_content",
    "Get full property details — description, amenities, address, contact info, check-in/check-out times, and coordinates.",
    HotelContentSchema.shape,
    async (params: HotelContentInput) => {
      try {
        const res = await sabreFetch(
          `/v1.0.0/shop/hotels/content?hotelCode=${params.property_id}`,
        );
        const data = await res.json();
        return {
          content: [
            { type: "text" as const, text: formatHotelContentResponse(data) },
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
