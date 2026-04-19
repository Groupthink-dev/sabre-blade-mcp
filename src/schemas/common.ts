import { z } from "zod";

export const PaginationSchema = z.object({
  max_results: z
    .number()
    .int()
    .min(1)
    .max(200)
    .optional()
    .describe("Maximum number of results to return (1-200, default 50)."),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Number of results to skip for pagination."),
});

export const ConfirmSchema = z.object({
  confirm: z
    .literal(true)
    .describe(
      "Must be true to proceed. Write operations create live reservations in the Sabre GDS.",
    ),
});

export const DateRangeSchema = z.object({
  departure_date: z
    .string()
    .describe("Departure date in YYYY-MM-DD format."),
  return_date: z
    .string()
    .optional()
    .describe("Return date in YYYY-MM-DD format. Omit for one-way."),
});

export const PassengerSchema = z.object({
  adults: z
    .number()
    .int()
    .min(1)
    .max(9)
    .default(1)
    .describe("Number of adult passengers (1-9)."),
  children: z
    .number()
    .int()
    .min(0)
    .max(8)
    .optional()
    .describe("Number of child passengers (0-8)."),
  infants: z
    .number()
    .int()
    .min(0)
    .max(4)
    .optional()
    .describe("Number of infant passengers (0-4, lap infants)."),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;
