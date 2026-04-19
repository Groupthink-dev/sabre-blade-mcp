import { describe, it, expect } from "vitest";
import {
  formatTripGetResponse,
  formatTripListResponse,
  formatBookingConfirmation,
  formatCancelConfirmation,
} from "../../src/formatters/trip.js";

describe("trip formatters", () => {
  describe("formatTripGetResponse", () => {
    it("formats PNR with passengers and segments", () => {
      const raw = {
        pnr: {
          locator: "ABCDEF",
          status: "confirmed",
          created: "2026-04-20T10:00:00",
          passengers: [
            { firstName: "John", lastName: "Smith" },
            { firstName: "Jane", lastName: "Smith" },
          ],
          segments: [
            {
              type: "air",
              airline: "QF",
              flightNumber: "1",
              departure: "2026-06-01T10:00",
              origin: "SYD",
              destination: "LAX",
              status: "HK",
            },
            {
              type: "hotel",
              name: "Marriott LAX",
              checkIn: "2026-06-01",
              checkOut: "2026-06-05",
              status: "HK",
            },
          ],
        },
      };

      const result = formatTripGetResponse(raw);
      const parsed = JSON.parse(result);
      expect(parsed.locator).toBe("ABCDEF");
      expect(parsed.passengers).toHaveLength(2);
      expect(parsed.passengers[0]).toBe("John Smith");
      expect(parsed.segments).toHaveLength(2);
      expect(parsed.segments[0].type).toBe("air");
      expect(parsed.segments[1].type).toBe("hotel");
    });
  });

  describe("formatTripListResponse", () => {
    it("returns guidance when no trips", () => {
      const result = formatTripListResponse({});
      expect(result).toContain("No trips found");
    });

    it("formats trip summaries", () => {
      const raw = {
        trips: [
          {
            locator: "ABC123",
            status: "active",
            leadPassenger: "Smith",
            departureDate: "2026-06-01",
            summary: "3 segments",
          },
        ],
      };

      const result = formatTripListResponse(raw);
      const parsed = JSON.parse(result);
      expect(parsed.count).toBe(1);
      expect(parsed.trips[0].locator).toBe("ABC123");
    });
  });

  describe("formatBookingConfirmation", () => {
    it("formats confirmation with locator", () => {
      const raw = {
        locator: "XYZ789",
        status: "confirmed",
        summary: "PNR XYZ789 created",
      };

      const result = formatBookingConfirmation(raw);
      const parsed = JSON.parse(result);
      expect(parsed.locator).toBe("XYZ789");
      expect(parsed.status).toBe("confirmed");
    });
  });

  describe("formatCancelConfirmation", () => {
    it("formats cancellation", () => {
      const raw = { locator: "DEF456" };
      const result = formatCancelConfirmation(raw);
      const parsed = JSON.parse(result);
      expect(parsed.locator).toBe("DEF456");
      expect(parsed.status).toBe("cancelled");
    });
  });
});
