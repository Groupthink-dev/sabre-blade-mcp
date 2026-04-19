import { CHARACTER_LIMIT } from "../constants.js";

// ---------- Hotel Search ----------

interface ConciseProperty {
  property_id: string;
  name: string;
  chain?: string;
  star_rating?: number;
  address?: string;
  city?: string;
  country?: string;
  distance?: string;
  lowest_rate?: string;
  currency?: string;
  amenities?: string[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export function formatHotelSearchResponse(raw: any): string {
  const properties: any[] =
    raw?.GetHotelAvailRS?.HotelAvailInfos?.HotelAvailInfo ||
    raw?.properties ||
    [];

  if (properties.length === 0) {
    return "No hotels found matching your criteria. Try adjusting location, dates, or removing star rating filter.";
  }

  const formatted: ConciseProperty[] = properties.map((prop: any) => {
    const info = prop.HotelInfo || prop;
    const rate =
      prop.HotelRateInfo?.RateInfos?.ConvertedRateInfo?.[0] ||
      prop.lowestRate ||
      {};

    return {
      property_id: info.HotelCode || info.propertyId || "",
      name: info.HotelName || info.name || "",
      ...(info.ChainName ? { chain: info.ChainName } : {}),
      ...(info.SabreRating || info.starRating
        ? { star_rating: Number(info.SabreRating || info.starRating) }
        : {}),
      ...(info.LocationInfo?.Address?.AddressLine1 || info.address
        ? {
            address:
              info.LocationInfo?.Address?.AddressLine1 || info.address,
          }
        : {}),
      ...(info.LocationInfo?.Address?.CityName || info.city
        ? { city: info.LocationInfo?.Address?.CityName || info.city }
        : {}),
      ...(info.LocationInfo?.Address?.CountryCode || info.country
        ? {
            country:
              info.LocationInfo?.Address?.CountryCode || info.country,
          }
        : {}),
      ...(prop.Distance || info.distance
        ? { distance: `${prop.Distance || info.distance}` }
        : {}),
      ...(rate.AverageNightlyRate || rate.amount
        ? { lowest_rate: String(rate.AverageNightlyRate || rate.amount) }
        : {}),
      ...(rate.CurrencyCode || rate.currency
        ? { currency: rate.CurrencyCode || rate.currency }
        : {}),
      ...(info.amenities?.length ? { amenities: info.amenities.slice(0, 8) } : {}),
    };
  });

  const result = JSON.stringify(
    { count: formatted.length, properties: formatted },
    null,
    2,
  );

  if (result.length > CHARACTER_LIMIT) {
    return (
      result.slice(0, CHARACTER_LIMIT) +
      `\n\n... truncated (${formatted.length} properties). Use max_results to limit results.`
    );
  }
  return result;
}

// ---------- Hotel Availability ----------

interface ConciseRate {
  rate_key: string;
  room_type: string;
  description?: string;
  rate_per_night: string;
  total: string;
  currency: string;
  meal_plan?: string;
  cancellation?: string;
  guarantee_required?: boolean;
}

export function formatHotelAvailResponse(raw: any): string {
  const rates: any[] =
    raw?.HotelRateDescriptionRS?.RoomStay?.RoomRates?.RoomRate ||
    raw?.rates ||
    [];

  if (rates.length === 0) {
    return "No rates available for this property on the selected dates.";
  }

  const formatted: ConciseRate[] = rates.map((rate: any) => ({
    rate_key:
      rate.RatePlanCode || rate.rateKey || "",
    room_type:
      rate.RoomTypeCode || rate.roomType || "",
    ...(rate.RoomDescription?.Text || rate.description
      ? { description: (rate.RoomDescription?.Text || rate.description).slice(0, 120) }
      : {}),
    rate_per_night: String(
      rate.Rates?.Rate?.Amount || rate.ratePerNight || "",
    ),
    total: String(
      rate.Total?.AmountAfterTax || rate.total || "",
    ),
    currency:
      rate.Rates?.Rate?.CurrencyCode || rate.currency || "",
    ...(rate.mealPlan ? { meal_plan: rate.mealPlan } : {}),
    ...(rate.CancelPolicy?.CancelPenalty?.[0]
      ? {
          cancellation:
            rate.CancelPolicy.CancelPenalty[0].PenaltyDescription?.Text ||
            "See property terms",
        }
      : {}),
    ...(rate.guaranteeRequired !== undefined
      ? { guarantee_required: rate.guaranteeRequired }
      : {}),
  }));

  return JSON.stringify(
    { count: formatted.length, rates: formatted },
    null,
    2,
  );
}

// ---------- Hotel Content ----------

interface ConciseContent {
  property_id: string;
  name: string;
  chain?: string;
  star_rating?: number;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  description?: string;
  amenities: string[];
  check_in_time?: string;
  check_out_time?: string;
  latitude?: number;
  longitude?: number;
}

export function formatHotelContentResponse(raw: any): string {
  const info =
    raw?.GetHotelContentRS?.HotelContentInfo ||
    raw?.property ||
    raw;

  const result: ConciseContent = {
    property_id: info.HotelCode || info.propertyId || "",
    name: info.HotelName || info.name || "",
    ...(info.ChainName ? { chain: info.ChainName } : {}),
    ...(info.SabreRating || info.starRating
      ? { star_rating: Number(info.SabreRating || info.starRating) }
      : {}),
    ...(info.Address?.AddressLine1 || info.address
      ? { address: info.Address?.AddressLine1 || info.address }
      : {}),
    ...(info.Address?.CityName || info.city
      ? { city: info.Address?.CityName || info.city }
      : {}),
    ...(info.Address?.CountryCode || info.country
      ? { country: info.Address?.CountryCode || info.country }
      : {}),
    ...(info.ContactNumbers?.Phone?.[0]?.PhoneNumber || info.phone
      ? { phone: info.ContactNumbers?.Phone?.[0]?.PhoneNumber || info.phone }
      : {}),
    ...(info.Description?.Text || info.description
      ? { description: (info.Description?.Text || info.description).slice(0, 300) }
      : {}),
    amenities: (
      info.PropertyAmenities?.Amenity ||
      info.amenities ||
      []
    )
      .map((a: any) => a.Description || a.name || a)
      .filter((a: any) => typeof a === "string")
      .slice(0, 15),
    ...(info.checkInTime ? { check_in_time: info.checkInTime } : {}),
    ...(info.checkOutTime ? { check_out_time: info.checkOutTime } : {}),
    ...(info.Latitude || info.latitude
      ? { latitude: Number(info.Latitude || info.latitude) }
      : {}),
    ...(info.Longitude || info.longitude
      ? { longitude: Number(info.Longitude || info.longitude) }
      : {}),
  };

  return JSON.stringify(result, null, 2);
}
