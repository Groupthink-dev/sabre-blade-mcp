import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sabreFetch } from "../services/sabre.js";
import { handleApiError } from "../utils/errors.js";
import { requireWrite } from "../utils/write-gate.js";
import { AirBookSchema } from "../schemas/air.js";
import type { AirBookInput } from "../schemas/air.js";
import { formatBookingConfirmation } from "../formatters/trip.js";

export function registerAirWriteTools(server: McpServer): void {
  // --- sabre_air_book ---
  server.tool(
    "sabre_air_book",
    "Create a Passenger Name Record (PNR) to book flights. WRITE-GATED: requires SABRE_WRITE_ENABLED=true and confirm=true. Creates a live reservation in the Sabre GDS.",
    AirBookSchema.shape,
    async (params: AirBookInput) => {
      const gateError = requireWrite(params.confirm, "air_book");
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
                PersonName: params.passengers.map((p) => ({
                  GivenName: p.first_name,
                  Surname: p.last_name,
                  DateOfBirth: p.date_of_birth,
                  Gender: p.gender,
                  PassengerType: p.type,
                  NameNumber: "1.1",
                })),
                ContactNumbers: {
                  ContactNumber: [
                    {
                      Phone: params.contact_phone,
                      Type: "H",
                    },
                  ],
                },
                ...(params.contact_email
                  ? {
                      Email: [
                        {
                          Address: params.contact_email,
                          Type: "BC",
                        },
                      ],
                    }
                  : {}),
              },
            },
            AirBook: {
              OriginDestinationInformation: {
                ItineraryId: params.itinerary_id,
              },
            },
            PostProcessing: {
              EndTransaction: {
                Source: {
                  ReceivedFrom: "SABRE-BLADE-MCP",
                },
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
