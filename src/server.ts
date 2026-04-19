import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAirReadTools } from "./tools/air-read.js";
import { registerAirWriteTools } from "./tools/air-write.js";
import { registerHotelReadTools } from "./tools/hotel-read.js";
import { registerHotelWriteTools } from "./tools/hotel-write.js";
import { registerTripReadTools } from "./tools/trip-read.js";
import { registerTripWriteTools } from "./tools/trip-write.js";
import { registerUtilityTools } from "./tools/utility.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "SabreBlade",
    version: "0.1.0",
  });

  // Read tools (no write gates)
  registerAirReadTools(server);      // 4 tools: air_search, air_price, air_rules, air_seatmap
  registerHotelReadTools(server);    // 3 tools: hotel_search, hotel_avail, hotel_content
  registerTripReadTools(server);     // 2 tools: trip_get, trip_list
  registerUtilityTools(server);      // 4 tools: geo_search, airline_lookup, destinations, car_search

  // Write tools (dual-gated: env + per-call confirm)
  registerAirWriteTools(server);     // 1 tool: air_book
  registerHotelWriteTools(server);   // 1 tool: hotel_book
  registerTripWriteTools(server);    // 1 tool: trip_cancel

  return server;
}
