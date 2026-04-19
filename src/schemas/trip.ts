import { z } from "zod";
import { ConfirmSchema } from "./common.js";

export const TripGetSchema = z.object({
  locator: z
    .string()
    .describe("Sabre PNR locator (record locator / confirmation number, e.g. 'ABCDEF')."),
});

export const TripListSchema = z.object({
  surname: z
    .string()
    .optional()
    .describe("Filter by passenger surname."),
  departure_date: z
    .string()
    .optional()
    .describe("Filter by departure date (YYYY-MM-DD)."),
  status: z
    .enum(["active", "cancelled", "all"])
    .optional()
    .describe("Filter by booking status. Defaults to 'active'."),
});

export const TripCancelSchema = ConfirmSchema.extend({
  locator: z
    .string()
    .describe("Sabre PNR locator to cancel."),
  segments: z
    .array(z.string())
    .optional()
    .describe(
      "Specific segment numbers to cancel. Omit to cancel the entire PNR.",
    ),
});

export type TripGetInput = z.infer<typeof TripGetSchema>;
export type TripListInput = z.infer<typeof TripListSchema>;
export type TripCancelInput = z.infer<typeof TripCancelSchema>;
