import { CHARACTER_LIMIT } from "../constants.js";

// ---------- Geo Search ----------

interface ConciseLocation {
  code: string;
  name: string;
  city?: string;
  country?: string;
  country_code?: string;
  category: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export function formatGeoSearchResponse(raw: any): string {
  const locations: any[] =
    raw?.GeoSearchRS?.GeoSearchResults?.GeoSearchResult ||
    raw?.locations ||
    [];

  if (locations.length === 0) {
    return "No locations found matching your query. Try a different search term or IATA code.";
  }

  const formatted: ConciseLocation[] = locations.map((loc: any) => ({
    code: loc.AirportCode || loc.CityCode || loc.code || "",
    name: loc.AirportName || loc.CityName || loc.name || "",
    ...(loc.CityName && loc.AirportName ? { city: loc.CityName } : {}),
    ...(loc.CountryName || loc.country
      ? { country: loc.CountryName || loc.country }
      : {}),
    ...(loc.CountryCode || loc.countryCode
      ? { country_code: loc.CountryCode || loc.countryCode }
      : {}),
    category: loc.Category || loc.category || "airport",
    ...(loc.Latitude || loc.latitude
      ? { latitude: Number(loc.Latitude || loc.latitude) }
      : {}),
    ...(loc.Longitude || loc.longitude
      ? { longitude: Number(loc.Longitude || loc.longitude) }
      : {}),
    ...(loc.TimeZone || loc.timezone
      ? { timezone: loc.TimeZone || loc.timezone }
      : {}),
  }));

  return JSON.stringify(
    { count: formatted.length, locations: formatted },
    null,
    2,
  );
}

// ---------- Airline Lookup ----------

interface ConciseAirline {
  iata_code: string;
  icao_code?: string;
  name: string;
  country?: string;
  alliance?: string;
  hub_airports?: string[];
}

export function formatAirlineLookupResponse(raw: any): string {
  const airline = raw?.airline || raw;

  const result: ConciseAirline = {
    iata_code: airline.IATACode || airline.iataCode || "",
    ...(airline.ICAOCode || airline.icaoCode
      ? { icao_code: airline.ICAOCode || airline.icaoCode }
      : {}),
    name: airline.AirlineName || airline.name || "",
    ...(airline.Country || airline.country
      ? { country: airline.Country || airline.country }
      : {}),
    ...(airline.Alliance || airline.alliance
      ? { alliance: airline.Alliance || airline.alliance }
      : {}),
    ...(airline.hubAirports?.length
      ? { hub_airports: airline.hubAirports }
      : {}),
  };

  return JSON.stringify(result, null, 2);
}

// ---------- Destinations ----------

interface ConciseDestination {
  code: string;
  name: string;
  country?: string;
  theme?: string;
  lowest_fare?: string;
  currency?: string;
}

export function formatDestinationsResponse(raw: any): string {
  const destinations: any[] =
    raw?.DestinationFinderRS?.FareInfo ||
    raw?.destinations ||
    [];

  if (destinations.length === 0) {
    return "No destinations found from this origin. Try a different airport or remove the theme filter.";
  }

  const formatted: ConciseDestination[] = destinations.map((dest: any) => ({
    code:
      dest.DestinationLocation || dest.code || "",
    name: dest.CityName || dest.name || "",
    ...(dest.CountryName || dest.country
      ? { country: dest.CountryName || dest.country }
      : {}),
    ...(dest.Theme || dest.theme
      ? { theme: dest.Theme || dest.theme }
      : {}),
    ...(dest.LowestFare?.Fare || dest.lowestFare
      ? { lowest_fare: String(dest.LowestFare?.Fare || dest.lowestFare) }
      : {}),
    ...(dest.LowestFare?.CurrencyCode || dest.currency
      ? { currency: dest.LowestFare?.CurrencyCode || dest.currency }
      : {}),
  }));

  const result = JSON.stringify(
    { count: formatted.length, destinations: formatted },
    null,
    2,
  );

  if (result.length > CHARACTER_LIMIT) {
    return (
      result.slice(0, CHARACTER_LIMIT) +
      `\n\n... truncated (${formatted.length} destinations). Use max_results or theme to narrow results.`
    );
  }
  return result;
}

// ---------- Car Search ----------

interface ConciseCar {
  vendor: string;
  car_type: string;
  car_class: string;
  daily_rate: string;
  total: string;
  currency: string;
  pickup_location?: string;
  dropoff_location?: string;
  air_conditioning?: boolean;
  transmission?: string;
  doors?: number;
}

export function formatCarSearchResponse(raw: any): string {
  const vehicles: any[] =
    raw?.OTA_VehAvailRateRS?.VehAvailRSCore?.VehVendorAvails ||
    raw?.vehicles ||
    [];

  if (vehicles.length === 0) {
    return "No car rentals found for the selected dates and location. Try different dates or a nearby airport.";
  }

  const formatted: ConciseCar[] = vehicles.flatMap((vendor: any) => {
    const vendorName = vendor.Vendor?.CompanyShortName || vendor.vendor || "";
    const avails = vendor.VehAvails?.VehAvail || vendor.vehicles || [vendor];

    return avails.map((v: any) => {
      const core = v.VehAvailCore || v;
      const vehicle = core.Vehicle || v;
      const charges = core.RentalRate?.VehicleCharges?.VehicleCharge || [];
      const totalCharge = core.TotalCharge || v;

      return {
        vendor: vendorName || vehicle.vendor || "",
        car_type: vehicle.VehType?.VehicleCategory || vehicle.carType || "",
        car_class: vehicle.VehClass?.Size || vehicle.carClass || "",
        daily_rate: String(
          charges[0]?.Amount || v.dailyRate || "",
        ),
        total: String(
          totalCharge.RateTotalAmount || totalCharge.total || "",
        ),
        currency:
          totalCharge.CurrencyCode || totalCharge.currency || "",
        ...(vehicle.AirConditionInd !== undefined || vehicle.air_conditioning !== undefined
          ? { air_conditioning: vehicle.AirConditionInd ?? vehicle.air_conditioning }
          : {}),
        ...(vehicle.TransmissionType || vehicle.transmission
          ? { transmission: vehicle.TransmissionType || vehicle.transmission }
          : {}),
        ...(vehicle.DoorCount || vehicle.doors
          ? { doors: Number(vehicle.DoorCount || vehicle.doors) }
          : {}),
      };
    });
  });

  const result = JSON.stringify(
    { count: formatted.length, vehicles: formatted },
    null,
    2,
  );

  if (result.length > CHARACTER_LIMIT) {
    return (
      result.slice(0, CHARACTER_LIMIT) +
      `\n\n... truncated (${formatted.length} vehicles). Use car_type to filter results.`
    );
  }
  return result;
}
