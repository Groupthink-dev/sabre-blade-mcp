import { describe, it, expect } from "vitest";
import {
  formatHotelSearchResponse,
  formatHotelAvailResponse,
  formatHotelContentResponse,
} from "../../src/formatters/hotel.js";

describe("hotel formatters", () => {
  describe("formatHotelSearchResponse", () => {
    it("returns guidance when no properties found", () => {
      const result = formatHotelSearchResponse({});
      expect(result).toContain("No hotels found");
    });

    it("formats property list with concise fields", () => {
      const raw = {
        properties: [
          {
            propertyId: "HTL001",
            name: "Grand Hyatt Sydney",
            chain: "Hyatt",
            starRating: 5,
            address: "7 Harbour St",
            city: "Sydney",
            country: "AU",
            distance: "0.5 mi",
            lowestRate: { amount: "350", currency: "AUD" },
            amenities: ["Pool", "Spa", "Gym", "Restaurant", "Bar"],
            _rawGdsPayload: { large: "ignored" },
          },
        ],
      };

      const result = formatHotelSearchResponse(raw);
      const parsed = JSON.parse(result);

      expect(parsed.count).toBe(1);
      expect(parsed.properties[0].property_id).toBe("HTL001");
      expect(parsed.properties[0].name).toBe("Grand Hyatt Sydney");
      expect(parsed.properties[0].star_rating).toBe(5);
      expect(parsed.properties[0].lowest_rate).toBe("350");
      expect(result).not.toContain("_rawGdsPayload");
    });
  });

  describe("formatHotelAvailResponse", () => {
    it("returns guidance when no rates", () => {
      const result = formatHotelAvailResponse({});
      expect(result).toContain("No rates available");
    });

    it("formats rate list", () => {
      const raw = {
        rates: [
          {
            rateKey: "RATE001",
            roomType: "KING",
            description: "King Room City View with complimentary breakfast",
            ratePerNight: "400",
            total: "1200",
            currency: "AUD",
          },
        ],
      };

      const result = formatHotelAvailResponse(raw);
      const parsed = JSON.parse(result);
      expect(parsed.count).toBe(1);
      expect(parsed.rates[0].rate_key).toBe("RATE001");
      expect(parsed.rates[0].rate_per_night).toBe("400");
    });
  });

  describe("formatHotelContentResponse", () => {
    it("formats property content with truncated description", () => {
      const raw = {
        property: {
          propertyId: "HTL001",
          name: "Grand Hyatt Sydney",
          starRating: 5,
          description: "A".repeat(500),
          amenities: ["Pool", "Spa"],
          latitude: -33.8688,
          longitude: 151.2093,
        },
      };

      const result = formatHotelContentResponse(raw);
      const parsed = JSON.parse(result);
      expect(parsed.description.length).toBeLessThanOrEqual(300);
      expect(parsed.latitude).toBe(-33.8688);
    });
  });
});
