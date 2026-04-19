# sabre-blade-mcp

MCP server for the **Sabre Global Distribution System** — search flights across 420+ airlines, browse 2M+ hotel properties, compare rental cars from 40+ brands, and manage bookings via PNR operations. 15 tools with token-efficient output and dual write-gates on all booking operations.

Implements the `travel-v1` service contract.

## Why another Sabre MCP?

Sabre launched an official MCP server in September 2025, but it's **enterprise-only** — locked inside SabreMosaic with no public repo, no npm package, and no self-host option. No community alternative exists either.

| | Sabre Official MCP | sabre-blade-mcp |
|---|---|---|
| **Availability** | Enterprise/SabreMosaic only | Open source (MIT) |
| **Self-hosted** | No | Yes (stdio + HTTP) |
| **Transport** | Unknown | stdio + streamable HTTP |
| **Write safety** | "Crawl-walk-run" governance | Dual gates (env + per-call confirm) |
| **Token efficiency** | "Flattened JSON" (unverified) | Measured formatters — 60%+ reduction |
| **Install** | Commercial agreement required | `npx sabre-blade-mcp` |
| **Source** | Closed | MIT on GitHub |

## Why "Blade MCP"?

Blade MCPs share a design philosophy:

- **Service contracts** — declare what abstract interface you implement, enabling provider swapping
- **Token discipline** — formatters strip raw API bloat; agents see decisions, not XML-era field noise
- **Dual write-gates** — env var AND per-call `confirm: true` prevent accidental live bookings
- **Dual transport** — stdio for local (Claude Desktop/Code), HTTP for remote access via tunnels

Other blades: [cloudflare-blade-mcp](https://github.com/groupthink-dev/cloudflare-blade-mcp) · [vultr-blade-mcp](https://github.com/groupthink-dev/vultr-blade-mcp) · [vastai-blade-mcp](https://github.com/groupthink-dev/vastai-blade-mcp) · [runpod-blade-mcp](https://github.com/groupthink-dev/runpod-blade-mcp) · [caldav-blade-mcp](https://github.com/groupthink-dev/caldav-blade-mcp) · [fastmail-blade-mcp](https://github.com/groupthink-dev/fastmail-blade-mcp)

## Quick start

```bash
git clone https://github.com/groupthink-dev/sabre-blade-mcp.git
cd sabre-blade-mcp
npm install
npm run build
```

## Configure

You need three credentials from [developer.sabre.com](https://developer.sabre.com):

| Variable | Required | Description |
|----------|----------|-------------|
| `SABRE_CLIENT_ID` | Yes | API client ID from your Sabre developer application |
| `SABRE_CLIENT_SECRET` | Yes | Client secret paired with the client ID |
| `SABRE_PCC` | Yes | Pseudo City Code — identifies your agency in the GDS |
| `SABRE_ENVIRONMENT` | No | `cert` (sandbox, default) or `production` |
| `SABRE_WRITE_ENABLED` | No | Set to `true` to enable booking/cancellation tools |
| `MCP_API_TOKEN` | No | Bearer token for HTTP transport authentication |
| `TRANSPORT` | No | `stdio` (default) or `http` |
| `PORT` | No | HTTP port (default: 8790) |

### Getting credentials

1. Sign up at [developer.sabre.com](https://developer.sabre.com) (free sandbox access)
2. Create an application to get your **Client ID** and **Client Secret**
3. Your sandbox **PCC** is provided during registration
4. Production access requires a [commercial agreement](https://developer.sabre.com/guides/travel-agency/developer-guides/getting-started) with Sabre

## Run

```bash
# stdio (default — for Claude Desktop / Claude Code)
SABRE_CLIENT_ID=... SABRE_CLIENT_SECRET=... SABRE_PCC=... node dist/index.js

# HTTP transport
TRANSPORT=http SABRE_CLIENT_ID=... SABRE_CLIENT_SECRET=... SABRE_PCC=... node dist/index.js

# Development (auto-reload)
npm run dev
```

## Claude Code

```json
{
  "mcpServers": {
    "sabre": {
      "command": "node",
      "args": ["/path/to/sabre-blade-mcp/dist/index.js"],
      "env": {
        "SABRE_CLIENT_ID": "your-client-id",
        "SABRE_CLIENT_SECRET": "your-client-secret",
        "SABRE_PCC": "your-pcc"
      }
    }
  }
}
```

## Claude Desktop

```json
{
  "mcpServers": {
    "sabre": {
      "command": "npx",
      "args": ["-y", "sabre-blade-mcp"],
      "env": {
        "SABRE_CLIENT_ID": "your-client-id",
        "SABRE_CLIENT_SECRET": "your-client-secret",
        "SABRE_PCC": "your-pcc"
      }
    }
  }
}
```

## API reference

### Air (5 tools)

| Tool | Description | Gate |
|------|-------------|------|
| `sabre_air_search` | Search flights via Bargain Finder Max — 420+ airlines, economy to first | read |
| `sabre_air_price` | Price/revalidate an itinerary — updated fares, taxes, ticketing deadline | read |
| `sabre_air_rules` | Fare rules — cancellation penalties, minimum stay, advance purchase | read |
| `sabre_air_seatmap` | Seat map — available seats, cabin layout, charges | read |
| `sabre_air_book` | Create PNR — books flights as a live reservation in the GDS | **write** |

### Hotel (4 tools)

| Tool | Description | Gate |
|------|-------------|------|
| `sabre_hotel_search` | Search properties by city, airport code, or coordinates | read |
| `sabre_hotel_avail` | Detailed room rates and availability for a specific property | read |
| `sabre_hotel_content` | Full property details — amenities, address, check-in/out, coordinates | read |
| `sabre_hotel_book` | Book hotel reservation | **write** |

### Trip (3 tools)

| Tool | Description | Gate |
|------|-------------|------|
| `sabre_trip_get` | Retrieve PNR by locator — passengers, segments, status | read |
| `sabre_trip_list` | List active trips — filter by surname, date, status | read |
| `sabre_trip_cancel` | Cancel PNR or specific segments | **write** |

### Utility (4 tools)

| Tool | Description | Gate |
|------|-------------|------|
| `sabre_geo_search` | Airport/city lookup by name or IATA code | read |
| `sabre_airline_lookup` | Airline info by IATA or ICAO code | read |
| `sabre_destinations` | Popular destinations from origin with optional theme filter | read |
| `sabre_car_search` | Rental cars — 40+ brands, 40,000 locations | read |

### Write safety gates

All write tools (air_book, hotel_book, trip_cancel) require **two independent gates**:

1. **Environment variable:** `SABRE_WRITE_ENABLED=true`
2. **Per-call confirmation:** `{ "confirm": true }` in the tool input

Both must pass. If either is missing, the operation is blocked with a clear message explaining what's needed.

## Service contracts

This server implements the `travel-v1` contract from [stallari-pack-spec](https://github.com/groupthink-dev/stallari-pack-spec). The contract defines abstract travel operations (air search, hotel search, booking, trip management) that can be implemented by different GDS providers.

## Development

```bash
npm run dev          # tsx watch (auto-reload)
npm run dev:http     # HTTP transport with auto-reload
npm test             # vitest (44 tests)
npm run test:watch   # vitest watch mode
npm run lint         # TypeScript type-check
```

## Architecture

```
src/
├── index.ts          # Entry point: dual transport (stdio/HTTP)
├── server.ts         # McpServer creation + tool registration
├── constants.ts      # API URLs, env var names, defaults
├── services/
│   ├── sabre.ts      # API client: OAuth token cache + authenticated fetch
│   └── auth.ts       # Bearer token middleware for HTTP transport
├── schemas/          # Zod input schemas (air, hotel, trip, utility, common)
├── formatters/       # Token-efficient response formatters (one per domain)
├── tools/            # Tool registration (split by domain + read/write)
└── utils/
    ├── write-gate.ts # Dual write-gate pattern
    └── errors.ts     # Typed error handling
```

## Licence

MIT
