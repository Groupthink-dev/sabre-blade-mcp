import { describe, it, expect } from "vitest";
import {
  formatGeoSearchResponse,
  formatAirlineLookupResponse,
  formatDestinationsResponse,
  formatCarSearchResponse,
} from "../../src/formatters/utility.js";

describe("utility formatters", () => {
  describe("formatGeoSearchResponse", () => {
    it("returns guidance when no locations", () => {
      const result = formatGeoSearchResponse({});
      expect(result).toContain("No locations found");
    });

    it("formats location list", () => {
      const raw = {
        locations: [
          {
            code: "SYD",
            name: "Sydney Kingsford Smith",
            city: "Sydney",
            country: "Australia",
            countryCode: "AU",
            category: "airport",
            latitude: -33.9461,
            longitude: 151.1772,
            timezone: "Australia/Sydney",
          },
        ],
      };

      const result = formatGeoSearchResponse(raw);
      const parsed = JSON.parse(result);
      expect(parsed.count).toBe(1);
      expect(parsed.locations[0].code).toBe("SYD");
      expect(parsed.locations[0].timezone).toBe("Australia/Sydney");
    });
  });

  describe("formatAirlineLookupResponse", () => {
    it("formats airline info", () => {
      const raw = {
        airline: {
          iataCode: "QF",
          icaoCode: "QFA",
          name: "Qantas Airways",
          country: "Australia",
          alliance: "oneworld",
        },
      };

      const result = formatAirlineLookupResponse(raw);
      const parsed = JSON.parse(result);
      expect(parsed.iata_code).toBe("QF");
      expect(parsed.name).toBe("Qantas Airways");
      expect(parsed.alliance).toBe("oneworld");
    });
  });

  describe("formatDestinationsResponse", () => {
    it("returns guidance when no destinations", () => {
      const result = formatDestinationsResponse({});
      expect(result).toContain("No destinations found");
    });

    it("formats destination list", () => {
      const raw = {
        destinations: [
          {
            code: "LAX",
            name: "Los Angeles",
            country: "United States",
            lowestFare: "899",
            currency: "AUD",
          },
          {
            code: "NRT",
            name: "Tokyo",
            country: "Japan",
            lowestFare: "650",
            currency: "AUD",
          },
        ],
      };

      const result = formatDestinationsResponse(raw);
      const parsed = JSON.parse(result);
      expect(parsed.count).toBe(2);
      expect(parsed.destinations[0].code).toBe("LAX");
      expect(parsed.destinations[1].lowest_fare).toBe("650");
    });
  });

  describe("formatCarSearchResponse", () => {
    it("returns guidance when no vehicles", () => {
      const result = formatCarSearchResponse({});
      expect(result).toContain("No car rentals found");
    });

    it("formats vehicle list", () => {
      const raw = {
        vehicles: [
          {
            vendor: "Hertz",
            carType: "FULLSIZE",
            carClass: "Standard",
            dailyRate: "65.00",
            total: "325.00",
            currency: "USD",
            transmission: "Automatic",
            doors: 4,
          },
        ],
      };

      const result = formatCarSearchResponse(raw);
      const parsed = JSON.parse(result);
      expect(parsed.count).toBe(1);
      expect(parsed.vehicles[0].vendor).toBe("Hertz");
      expect(parsed.vehicles[0].total).toBe("325.00");
      expect(parsed.vehicles[0].transmission).toBe("Automatic");
    });
  });
});
