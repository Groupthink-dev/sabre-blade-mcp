import { describe, it, expect } from "vitest";
import {
  formatAirSearchResponse,
  formatAirPriceResponse,
  formatAirRulesResponse,
  formatSeatmapResponse,
} from "../../src/formatters/air.js";

describe("air formatters", () => {
  describe("formatAirSearchResponse", () => {
    it("returns guidance when no itineraries found", () => {
      const result = formatAirSearchResponse({});
      expect(result).toContain("No flights found");
    });

    it("formats BFM response into concise itineraries", () => {
      const raw = {
        OTA_AirLowFareSearchRS: {
          PricedItineraries: {
            PricedItinerary: [
              {
                SequenceNumber: "1",
                AirItineraryPricingInfo: [
                  {
                    ItinTotalFare: {
                      TotalFare: { Amount: "850.00", CurrencyCode: "USD" },
                      BaseFare: { Amount: "700.00" },
                      Taxes: { TotalTax: { Amount: "150.00" } },
                    },
                  },
                ],
                AirItinerary: {
                  OriginDestinationOptions: {
                    OriginDestinationOption: [
                      {
                        FlightSegment: [
                          {
                            MarketingAirline: { Code: "QF" },
                            FlightNumber: "1",
                            DepartureAirport: { LocationCode: "SYD" },
                            ArrivalAirport: { LocationCode: "LAX" },
                            DepartureDateTime: "2026-06-01T10:00",
                            ArrivalDateTime: "2026-06-01T06:00",
                            ElapsedTime: "13:00",
                            CabinType: "Y",
                            ResBookDesigCode: "Q",
                            StopQuantity: 0,
                          },
                        ],
                      },
                    ],
                  },
                },
                ValidatingCarrier: { Code: "QF" },
              },
            ],
          },
        },
      };

      const result = formatAirSearchResponse(raw);
      const parsed = JSON.parse(result);

      expect(parsed.count).toBe(1);
      expect(parsed.itineraries[0].id).toBe("1");
      expect(parsed.itineraries[0].total_fare).toBe("850.00");
      expect(parsed.itineraries[0].currency).toBe("USD");
      expect(parsed.itineraries[0].outbound[0].flight).toBe("QF1");
      expect(parsed.itineraries[0].outbound[0].origin).toBe("SYD");
      expect(parsed.itineraries[0].outbound[0].destination).toBe("LAX");
      expect(parsed.itineraries[0].validating_carrier).toBe("QF");
    });

    it("strips fields not in concise format", () => {
      const raw = {
        itineraries: [
          {
            id: "test",
            fare: {
              totalFare: "500",
              currency: "AUD",
              baseFare: "400",
              taxes: "100",
            },
            legs: [
              {
                segments: [
                  {
                    marketingAirline: "VA",
                    flightNumber: "800",
                    departureAirport: "MEL",
                    arrivalAirport: "SYD",
                    departureDateTime: "2026-06-01T08:00",
                    arrivalDateTime: "2026-06-01T09:30",
                    elapsedTime: "1:30",
                    cabin: "Y",
                    bookingClass: "V",
                    stops: 0,
                    internalTrackingId: "abc123",
                    _secretData: "should not appear",
                  },
                ],
              },
            ],
            validatingCarrier: "VA",
            _internalRawPayload: { huge: "blob" },
          },
        ],
      };

      const result = formatAirSearchResponse(raw);
      expect(result).not.toContain("internalTrackingId");
      expect(result).not.toContain("_secretData");
      expect(result).not.toContain("_internalRawPayload");
      expect(result).toContain("VA800");
    });
  });

  describe("formatAirPriceResponse", () => {
    it("formats pricing response", () => {
      const raw = {
        priceQuote: {
          totalFare: "900.00",
          currency: "USD",
          baseFare: "750.00",
          taxes: "150.00",
          fareValid: true,
          fareBasis: ["YOWAU"],
        },
      };

      const result = formatAirPriceResponse(raw);
      const parsed = JSON.parse(result);
      expect(parsed.total_fare).toBe("900.00");
      expect(parsed.fare_valid).toBe(true);
    });
  });

  describe("formatAirRulesResponse", () => {
    it("returns guidance when no rules", () => {
      const result = formatAirRulesResponse({});
      expect(result).toContain("No fare rules");
    });

    it("formats fare rules", () => {
      const raw = {
        fareRules: [
          { category: "penalties", text: "Cancellation fee $200" },
          { category: "minimum_stay", text: "Saturday night stay required" },
        ],
      };

      const result = formatAirRulesResponse(raw);
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].category).toBe("penalties");
    });
  });

  describe("formatSeatmapResponse", () => {
    it("returns guidance when no seat map", () => {
      const result = formatSeatmapResponse({});
      expect(result).toContain("No seat map");
    });
  });
});
