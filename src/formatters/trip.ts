import { CHARACTER_LIMIT } from "../constants.js";

// ---------- Trip Get ----------

interface ConcisePnrSegment {
  type: "air" | "hotel" | "car" | "other";
  status: string;
  details: string;
}

interface ConcisePnr {
  locator: string;
  status: string;
  created: string;
  passengers: string[];
  segments: ConcisePnrSegment[];
  ticketing_deadline?: string;
  contact?: string;
  remarks?: string[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function extractPnrSegment(raw: any): ConcisePnrSegment {
  if (raw.Air || raw.type === "air") {
    const air = raw.Air || raw;
    return {
      type: "air",
      status: air.ActionCode || air.status || "",
      details: [
        air.MarketingCarrier || air.airline || "",
        air.FlightNumber || air.flightNumber || "",
        air.DepartureDateTime || air.departure || "",
        `${air.DepartureAirport || air.origin || ""}-${air.ArrivalAirport || air.destination || ""}`,
      ]
        .filter(Boolean)
        .join(" "),
    };
  }

  if (raw.Hotel || raw.type === "hotel") {
    const hotel = raw.Hotel || raw;
    return {
      type: "hotel",
      status: hotel.StatusCode || hotel.status || "",
      details: [
        hotel.HotelName || hotel.name || "",
        hotel.CheckInDate || hotel.checkIn || "",
        "to",
        hotel.CheckOutDate || hotel.checkOut || "",
      ]
        .filter(Boolean)
        .join(" "),
    };
  }

  if (raw.Vehicle || raw.type === "car") {
    const car = raw.Vehicle || raw;
    return {
      type: "car",
      status: car.StatusCode || car.status || "",
      details: [
        car.VendorName || car.vendor || "",
        car.PickupDate || car.pickup || "",
        car.PickupLocation || car.location || "",
      ]
        .filter(Boolean)
        .join(" "),
    };
  }

  return {
    type: "other",
    status: raw.StatusCode || raw.status || "",
    details: JSON.stringify(raw).slice(0, 100),
  };
}

export function formatTripGetResponse(raw: any): string {
  const pnr = raw?.TravelItineraryReadRS?.TravelItinerary || raw?.pnr || raw;

  const passengers: string[] = (
    pnr?.CustomerInfo?.PersonName ||
    pnr?.passengers ||
    []
  ).map(
    (p: any) =>
      `${p.GivenName || p.firstName || ""} ${p.Surname || p.lastName || ""}`.trim(),
  );

  const segments: ConcisePnrSegment[] = (
    pnr?.ItineraryInfo?.ReservationItems?.Item ||
    pnr?.segments ||
    []
  ).map(extractPnrSegment);

  const result: ConcisePnr = {
    locator: pnr?.ItineraryRef?.ID || pnr?.locator || "",
    status: pnr?.status || "confirmed",
    created: pnr?.CreateDateTime || pnr?.created || "",
    passengers,
    segments,
    ...(pnr?.ticketingDeadline
      ? { ticketing_deadline: pnr.ticketingDeadline }
      : {}),
    ...(pnr?.contact ? { contact: pnr.contact } : {}),
  };

  return JSON.stringify(result, null, 2);
}

// ---------- Trip List ----------

interface ConciseTripSummary {
  locator: string;
  status: string;
  lead_passenger: string;
  departure_date: string;
  segments_summary: string;
}

export function formatTripListResponse(raw: any): string {
  const trips: any[] =
    raw?.trips ||
    raw?.TripSearchRS?.Trips?.Trip ||
    [];

  if (trips.length === 0) {
    return "No trips found matching your criteria.";
  }

  const formatted: ConciseTripSummary[] = trips.map((trip: any) => ({
    locator: trip.locator || trip.RecordLocator || "",
    status: trip.status || trip.Status || "",
    lead_passenger:
      trip.leadPassenger ||
      trip.PersonName?.Surname ||
      "",
    departure_date:
      trip.departureDate || trip.DepartureDate || "",
    segments_summary:
      trip.summary ||
      `${trip.segmentCount || "?"} segments`,
  }));

  const result = JSON.stringify(
    { count: formatted.length, trips: formatted },
    null,
    2,
  );

  if (result.length > CHARACTER_LIMIT) {
    return (
      result.slice(0, CHARACTER_LIMIT) +
      `\n\n... truncated (${formatted.length} trips). Use surname or date filters to narrow results.`
    );
  }
  return result;
}

// ---------- Booking confirmations ----------

interface ConciseBookingConfirmation {
  locator: string;
  status: string;
  summary: string;
}

export function formatBookingConfirmation(raw: any): string {
  const result: ConciseBookingConfirmation = {
    locator:
      raw?.CreatePassengerNameRecordRS?.ItineraryRef?.ID ||
      raw?.locator ||
      "",
    status: raw?.status || "confirmed",
    summary:
      raw?.summary ||
      `PNR ${raw?.CreatePassengerNameRecordRS?.ItineraryRef?.ID || raw?.locator || "?"} created successfully`,
  };

  return JSON.stringify(result, null, 2);
}

export function formatCancelConfirmation(raw: any): string {
  return JSON.stringify(
    {
      locator: raw?.locator || "",
      status: "cancelled",
      cancelled_segments: raw?.cancelledSegments || "all",
    },
    null,
    2,
  );
}
