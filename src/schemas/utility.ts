import { z } from "zod";

export const GeoSearchSchema = z.object({
  query: z
    .string()
    .describe(
      "Search term — airport name, city name, or IATA/ICAO code (e.g. 'Sydney', 'SYD', 'YSSY').",
    ),
  category: z
    .enum(["airport", "city", "all"])
    .optional()
    .describe("Filter by location category. Defaults to 'all'."),
  country: z
    .string()
    .length(2)
    .optional()
    .describe("Filter by ISO 3166-1 alpha-2 country code (e.g. 'AU', 'US')."),
  max_results: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .describe("Maximum results to return (1-50, default 10)."),
});

export const AirlineLookupSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(3)
    .describe("IATA (2-char) or ICAO (3-char) airline code (e.g. 'QF', 'UAL')."),
});

export const DestinationsSchema = z.object({
  origin: z
    .string()
    .length(3)
    .describe("Origin airport IATA code (e.g. 'SYD')."),
  theme: z
    .enum(["beach", "disney", "gambling", "historic", "mountains", "national_parks", "nightlife", "romantic", "shopping", "skiing", "theme_parks"])
    .optional()
    .describe("Destination theme/category filter."),
  max_results: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .describe("Maximum destinations to return (1-50, default 20)."),
});

export const CarSearchSchema = z.object({
  pickup_location: z
    .string()
    .length(3)
    .describe("Pickup airport IATA code (e.g. 'LAX')."),
  pickup_date: z.string().describe("Pickup date in YYYY-MM-DD format."),
  pickup_time: z
    .string()
    .optional()
    .describe("Pickup time in HH:MM format (24h). Defaults to '10:00'."),
  dropoff_date: z.string().describe("Drop-off date in YYYY-MM-DD format."),
  dropoff_time: z
    .string()
    .optional()
    .describe("Drop-off time in HH:MM format (24h). Defaults to '10:00'."),
  dropoff_location: z
    .string()
    .length(3)
    .optional()
    .describe("Drop-off airport IATA code if different from pickup."),
  car_type: z
    .enum(["economy", "compact", "midsize", "standard", "fullsize", "premium", "luxury", "suv", "van", "convertible"])
    .optional()
    .describe("Preferred car type/class."),
});

export type GeoSearchInput = z.infer<typeof GeoSearchSchema>;
export type AirlineLookupInput = z.infer<typeof AirlineLookupSchema>;
export type DestinationsInput = z.infer<typeof DestinationsSchema>;
export type CarSearchInput = z.infer<typeof CarSearchSchema>;
