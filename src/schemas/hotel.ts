import { z } from "zod";
import { PaginationSchema, ConfirmSchema } from "./common.js";

export const HotelSearchSchema = PaginationSchema.extend({
  location: z
    .string()
    .describe(
      "City name, airport code, or coordinates (lat,lng) to search near.",
    ),
  check_in: z.string().describe("Check-in date in YYYY-MM-DD format."),
  check_out: z.string().describe("Check-out date in YYYY-MM-DD format."),
  guests: z
    .number()
    .int()
    .min(1)
    .max(9)
    .default(1)
    .describe("Number of guests per room (1-9)."),
  rooms: z
    .number()
    .int()
    .min(1)
    .max(9)
    .default(1)
    .describe("Number of rooms (1-9)."),
  radius: z
    .number()
    .optional()
    .describe("Search radius in miles from the location (default 25)."),
  star_rating: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .describe("Minimum star rating (1-5)."),
  sort_by: z
    .enum(["price", "distance", "rating"])
    .optional()
    .describe("Sort results by price, distance, or rating."),
});

export const HotelAvailSchema = z.object({
  property_id: z
    .string()
    .describe("Sabre property ID from a previous hotel_search result."),
  check_in: z.string().describe("Check-in date in YYYY-MM-DD format."),
  check_out: z.string().describe("Check-out date in YYYY-MM-DD format."),
  guests: z
    .number()
    .int()
    .min(1)
    .max(9)
    .default(1)
    .describe("Number of guests per room."),
  rooms: z
    .number()
    .int()
    .min(1)
    .max(9)
    .default(1)
    .describe("Number of rooms."),
});

export const HotelContentSchema = z.object({
  property_id: z
    .string()
    .describe("Sabre property ID to retrieve full content for."),
});

export const HotelBookSchema = ConfirmSchema.extend({
  property_id: z.string().describe("Sabre property ID."),
  rate_key: z
    .string()
    .describe("Rate key from a previous hotel_avail result."),
  check_in: z.string().describe("Check-in date in YYYY-MM-DD format."),
  check_out: z.string().describe("Check-out date in YYYY-MM-DD format."),
  guest_name: z.string().describe("Primary guest full name."),
  contact_phone: z.string().describe("Contact phone number."),
  contact_email: z.string().email().optional().describe("Contact email."),
  special_requests: z
    .string()
    .optional()
    .describe("Special requests for the hotel (e.g. 'high floor', 'late checkout')."),
});

export type HotelSearchInput = z.infer<typeof HotelSearchSchema>;
export type HotelAvailInput = z.infer<typeof HotelAvailSchema>;
export type HotelContentInput = z.infer<typeof HotelContentSchema>;
export type HotelBookInput = z.infer<typeof HotelBookSchema>;
