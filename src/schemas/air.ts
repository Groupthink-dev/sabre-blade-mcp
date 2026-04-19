import { z } from "zod";
import { DateRangeSchema, PassengerSchema, ConfirmSchema } from "./common.js";

export const AirSearchSchema = DateRangeSchema.merge(PassengerSchema).extend({
  origin: z
    .string()
    .length(3)
    .describe("Origin airport IATA code (e.g. 'SYD', 'JFK')."),
  destination: z
    .string()
    .length(3)
    .describe("Destination airport IATA code (e.g. 'LAX', 'LHR')."),
  cabin: z
    .enum(["economy", "premium_economy", "business", "first"])
    .optional()
    .describe("Preferred cabin class. Defaults to economy."),
  nonstop: z
    .boolean()
    .optional()
    .describe("If true, only return non-stop flights."),
  max_results: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .describe("Maximum itineraries to return (1-50, default 10)."),
});

export const AirPriceSchema = z.object({
  itinerary_id: z
    .string()
    .describe("Itinerary ID from a previous air_search result to price/revalidate."),
});

export const AirRulesSchema = z.object({
  itinerary_id: z
    .string()
    .describe("Itinerary ID to retrieve fare rules for."),
  category: z
    .enum(["penalties", "minimum_stay", "advance_purchase", "all"])
    .optional()
    .describe("Specific fare rule category. Defaults to 'all'."),
});

export const AirSeatmapSchema = z.object({
  flight_number: z
    .string()
    .describe("Flight number (e.g. 'QF1', 'UA100')."),
  departure_date: z
    .string()
    .describe("Departure date in YYYY-MM-DD format."),
  origin: z
    .string()
    .length(3)
    .describe("Origin airport IATA code."),
  destination: z
    .string()
    .length(3)
    .describe("Destination airport IATA code."),
});

export const AirBookSchema = ConfirmSchema.extend({
  itinerary_id: z
    .string()
    .describe("Itinerary ID from a priced air_search result."),
  passengers: z
    .array(
      z.object({
        first_name: z.string().describe("Passenger first name (as on ID)."),
        last_name: z.string().describe("Passenger last name (as on ID)."),
        date_of_birth: z
          .string()
          .describe("Date of birth in YYYY-MM-DD format."),
        gender: z.enum(["M", "F"]).describe("Gender (M or F)."),
        type: z
          .enum(["ADT", "CHD", "INF"])
          .default("ADT")
          .describe("Passenger type: ADT (adult), CHD (child), INF (infant)."),
      }),
    )
    .min(1)
    .describe("Passenger details for the booking."),
  contact_phone: z.string().describe("Contact phone number for the booking."),
  contact_email: z
    .string()
    .email()
    .optional()
    .describe("Contact email address."),
  ticketing_deadline: z
    .string()
    .optional()
    .describe("Ticketing deadline in YYYY-MM-DD format. Defaults to airline rule."),
});

export type AirSearchInput = z.infer<typeof AirSearchSchema>;
export type AirPriceInput = z.infer<typeof AirPriceSchema>;
export type AirRulesInput = z.infer<typeof AirRulesSchema>;
export type AirSeatmapInput = z.infer<typeof AirSeatmapSchema>;
export type AirBookInput = z.infer<typeof AirBookSchema>;
