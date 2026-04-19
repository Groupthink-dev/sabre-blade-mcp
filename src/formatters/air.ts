import { CHARACTER_LIMIT } from "../constants.js";

// ---------- Air Search ----------

interface ConciseSegment {
  flight: string;
  airline: string;
  origin: string;
  destination: string;
  departs: string;
  arrives: string;
  duration: string;
  cabin: string;
  booking_class: string;
  aircraft?: string;
  stops: number;
}

interface ConciseItinerary {
  id: string;
  total_fare: string;
  currency: string;
  base_fare: string;
  taxes: string;
  outbound: ConciseSegment[];
  inbound?: ConciseSegment[];
  validating_carrier: string;
  fare_type?: string;
  refundable?: boolean;
  stops_total: number;
  total_duration: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function extractSegment(raw: any): ConciseSegment {
  return {
    flight: `${raw.MarketingAirline?.Code || raw.marketingAirline || ""}${raw.FlightNumber || raw.flightNumber || ""}`,
    airline: raw.MarketingAirline?.Code || raw.marketingAirline || "",
    origin: raw.DepartureAirport?.LocationCode || raw.departureAirport || "",
    destination: raw.ArrivalAirport?.LocationCode || raw.arrivalAirport || "",
    departs: raw.DepartureDateTime || raw.departureDateTime || "",
    arrives: raw.ArrivalDateTime || raw.arrivalDateTime || "",
    duration: raw.ElapsedTime || raw.elapsedTime || "",
    cabin: raw.CabinType || raw.cabin || "",
    booking_class: raw.ResBookDesigCode || raw.bookingClass || "",
    ...(raw.Equipment?.AirEquipType ? { aircraft: raw.Equipment.AirEquipType } : {}),
    stops: raw.StopQuantity || raw.stops || 0,
  };
}

export function formatAirSearchResponse(raw: any): string {
  const itineraries: any[] =
    raw?.OTA_AirLowFareSearchRS?.PricedItineraries?.PricedItinerary ||
    raw?.groupedItineraryResponse?.itineraryGroups?.[0]?.itineraries ||
    raw?.itineraries ||
    [];

  if (itineraries.length === 0) {
    return "No flights found matching your criteria. Try adjusting dates, airports, or removing the nonstop filter.";
  }

  const formatted: ConciseItinerary[] = itineraries.map(
    (itin: any, idx: number) => {
      const fare =
        itin.AirItineraryPricingInfo?.[0]?.ItinTotalFare ||
        itin.fare ||
        {};
      const segments =
        itin.AirItinerary?.OriginDestinationOptions?.OriginDestinationOption ||
        itin.legs ||
        [];

      const outbound = Array.isArray(segments[0]?.FlightSegment || segments[0]?.segments)
        ? (segments[0].FlightSegment || segments[0].segments).map(extractSegment)
        : segments[0]
          ? [extractSegment(segments[0])]
          : [];

      const inbound =
        segments.length > 1
          ? (segments[1].FlightSegment || segments[1].segments || [segments[1]]).map(
              extractSegment,
            )
          : undefined;

      return {
        id: itin.SequenceNumber || itin.id || `itin-${idx}`,
        total_fare: fare.TotalFare?.Amount || fare.totalFare || "",
        currency: fare.TotalFare?.CurrencyCode || fare.currency || "",
        base_fare: fare.BaseFare?.Amount || fare.baseFare || "",
        taxes:
          fare.Taxes?.TotalTax?.Amount || fare.taxes || "",
        outbound,
        ...(inbound ? { inbound } : {}),
        validating_carrier:
          itin.ValidatingCarrier?.Code ||
          itin.validatingCarrier ||
          outbound[0]?.airline ||
          "",
        ...(itin.fareType ? { fare_type: itin.fareType } : {}),
        ...(itin.refundable !== undefined
          ? { refundable: itin.refundable }
          : {}),
        stops_total: outbound.reduce(
          (sum: number, s: ConciseSegment) => sum + s.stops,
          0,
        ),
        total_duration:
          itin.totalDuration || outbound.map((s: ConciseSegment) => s.duration).join("+"),
      };
    },
  );

  const result = JSON.stringify(
    { count: formatted.length, itineraries: formatted },
    null,
    2,
  );

  if (result.length > CHARACTER_LIMIT) {
    return (
      result.slice(0, CHARACTER_LIMIT) +
      `\n\n... truncated (${formatted.length} itineraries). Use max_results to limit results.`
    );
  }
  return result;
}

// ---------- Air Price ----------

interface ConcisePricing {
  itinerary_id: string;
  total_fare: string;
  currency: string;
  base_fare: string;
  taxes: string;
  fare_valid: boolean;
  last_ticket_date?: string;
  fare_basis: string[];
  pricing_source?: string;
}

export function formatAirPriceResponse(raw: any): string {
  const pricing =
    raw?.OTA_AirPriceRS?.PriceQuote ||
    raw?.priceQuote ||
    raw;

  const result: ConcisePricing = {
    itinerary_id: raw.itineraryId || pricing.itineraryId || "",
    total_fare:
      pricing?.TotalFare?.Amount || pricing?.totalFare || "",
    currency:
      pricing?.TotalFare?.CurrencyCode || pricing?.currency || "",
    base_fare:
      pricing?.BaseFare?.Amount || pricing?.baseFare || "",
    taxes:
      pricing?.Taxes?.TotalTax?.Amount || pricing?.taxes || "",
    fare_valid: pricing?.fareValid ?? true,
    ...(pricing?.lastTicketDate
      ? { last_ticket_date: pricing.lastTicketDate }
      : {}),
    fare_basis: pricing?.fareBasis || [],
    ...(pricing?.pricingSource
      ? { pricing_source: pricing.pricingSource }
      : {}),
  };

  return JSON.stringify(result, null, 2);
}

// ---------- Fare Rules ----------

interface ConciseRule {
  category: string;
  text: string;
}

export function formatAirRulesResponse(raw: any): string {
  const rules: any[] =
    raw?.OTA_AirRulesRS?.FareRuleResponseInfo?.FareRuleInfo ||
    raw?.fareRules ||
    [];

  if (rules.length === 0) {
    return "No fare rules available for this itinerary.";
  }

  const formatted: ConciseRule[] = rules.map((rule: any) => ({
    category:
      rule.FareRuleCategory || rule.category || "General",
    text:
      rule.FareRuleText || rule.text || "",
  }));

  const result = JSON.stringify(formatted, null, 2);

  if (result.length > CHARACTER_LIMIT) {
    return (
      result.slice(0, CHARACTER_LIMIT) +
      "\n\n... truncated. Use category filter to retrieve specific rule sections."
    );
  }
  return result;
}

// ---------- Seat Map ----------

interface ConciseSeat {
  number: string;
  available: boolean;
  type?: string;
  features?: string[];
  charge?: string;
}

interface ConciseCabin {
  cabin_class: string;
  rows: string;
  seat_count: number;
  available_count: number;
  seats: ConciseSeat[];
}

export function formatSeatmapResponse(raw: any): string {
  const seatMap =
    raw?.OTA_AirSeatMapRS?.SeatMapResponses?.SeatMapResponse?.[0]
      ?.SeatMapDetails ||
    raw?.seatMap ||
    {};

  const cabins: any[] = seatMap?.CabinClass || seatMap?.cabins || [];

  if (cabins.length === 0) {
    return "No seat map available for this flight.";
  }

  const formatted: ConciseCabin[] = cabins.map((cabin: any) => {
    const allSeats: ConciseSeat[] = (
      cabin.RowInfo || cabin.rows || []
    ).flatMap((row: any) =>
      (row.SeatInfo || row.seats || []).map((seat: any) => ({
        number: `${row.RowNumber || row.row}${seat.SeatNumber || seat.column || ""}`,
        available:
          seat.AvailabilityIndicator === "Available" ||
          seat.available === true,
        ...(seat.SeatType ? { type: seat.SeatType } : {}),
        ...(seat.features?.length ? { features: seat.features } : {}),
        ...(seat.charge ? { charge: seat.charge } : {}),
      })),
    );

    return {
      cabin_class: cabin.CabinType || cabin.cabinClass || "",
      rows: `${cabins[0]?.FirstRow || ""}-${cabins[0]?.LastRow || ""}`,
      seat_count: allSeats.length,
      available_count: allSeats.filter((s) => s.available).length,
      seats: allSeats.filter((s) => s.available).slice(0, 30),
    };
  });

  return JSON.stringify(formatted, null, 2);
}
