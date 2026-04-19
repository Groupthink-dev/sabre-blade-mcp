import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sabreFetch } from "../services/sabre.js";
import { handleApiError } from "../utils/errors.js";
import { requireWrite } from "../utils/write-gate.js";
import { HotelBookSchema } from "../schemas/hotel.js";
import type { HotelBookInput } from "../schemas/hotel.js";
import { formatBookingConfirmation } from "../formatters/trip.js";

export function registerHotelWriteTools(server: McpServer): void {
  // --- sabre_hotel_book ---
  server.tool(
    "sabre_hotel_book",
    "Book a hotel reservation. WRITE-GATED: requires SABRE_WRITE_ENABLED=true and confirm=true. Creates a live reservation.",
    HotelBookSchema.shape,
    async (params: HotelBookInput) => {
      const gateError = requireWrite(params.confirm, "hotel_book");
      if (gateError) {
        return {
          content: [{ type: "text" as const, text: gateError }],
          isError: true,
        };
      }

      try {
        const body = {
          CreatePassengerNameRecordRQ: {
            version: "2.3.0",
            TravelItineraryAddInfo: {
              CustomerInfo: {
                PersonName: [
                  {
                    GivenName: params.guest_name.split(" ")[0] || params.guest_name,
                    Surname:
                      params.guest_name.split(" ").slice(1).join(" ") ||
                      params.guest_name,
                    NameNumber: "1.1",
                  },
                ],
                ContactNumbers: {
                  ContactNumber: [
                    { Phone: params.contact_phone, Type: "H" },
                  ],
                },
                ...(params.contact_email
                  ? {
                      Email: [
                        { Address: params.contact_email, Type: "BC" },
                      ],
                    }
                  : {}),
              },
            },
            HotelBook: {
              BookingInfo: {
                HotelCode: params.property_id,
                RatePlanCode: params.rate_key,
                StartDate: params.check_in,
                EndDate: params.check_out,
                ...(params.special_requests
                  ? { SpecialRequest: params.special_requests }
                  : {}),
              },
            },
            PostProcessing: {
              EndTransaction: {
                Source: { ReceivedFrom: "SABRE-BLADE-MCP" },
              },
            },
          },
        };

        const res = await sabreFetch("/v2.3.0/passenger/records", {
          method: "POST",
          body: JSON.stringify(body),
        });
        const data = await res.json();
        return {
          content: [
            { type: "text" as const, text: formatBookingConfirmation(data) },
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
