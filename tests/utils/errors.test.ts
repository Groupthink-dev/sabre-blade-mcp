import { describe, it, expect } from "vitest";
import {
  SabreApiError,
  SabreAuthError,
  handleApiError,
} from "../../src/utils/errors.js";

describe("error handling", () => {
  describe("SabreApiError", () => {
    it("stores status, detail, and path", () => {
      const err = new SabreApiError(404, "Not found", "/v1/trip");
      expect(err.status).toBe(404);
      expect(err.detail).toBe("Not found");
      expect(err.path).toBe("/v1/trip");
      expect(err.name).toBe("SabreApiError");
    });
  });

  describe("handleApiError", () => {
    it("formats auth errors with credential guidance", () => {
      const err = new SabreAuthError("Token failed");
      const msg = handleApiError(err);
      expect(msg).toContain("Authentication error");
      expect(msg).toContain("SABRE_CLIENT_ID");
    });

    it("formats 400 errors", () => {
      const err = new SabreApiError(400, "Invalid origin", "/v5/shop/flights");
      const msg = handleApiError(err);
      expect(msg).toContain("400 Bad Request");
      expect(msg).toContain("Invalid origin");
    });

    it("formats 401 errors with token retry note", () => {
      const err = new SabreApiError(401, "Expired", "/v5/shop/flights");
      const msg = handleApiError(err);
      expect(msg).toContain("401 Unauthorized");
      expect(msg).toContain("retry");
    });

    it("formats 403 errors with entitlement guidance", () => {
      const err = new SabreApiError(403, "Forbidden", "/v5/shop/flights");
      const msg = handleApiError(err);
      expect(msg).toContain("403 Forbidden");
      expect(msg).toContain("entitlements");
    });

    it("formats 429 rate limit errors", () => {
      const err = new SabreApiError(429, "Too fast", "/v5/shop/flights");
      const msg = handleApiError(err);
      expect(msg).toContain("429 Rate Limited");
    });

    it("formats 500 server errors", () => {
      const err = new SabreApiError(500, "Internal", "/v5/shop/flights");
      const msg = handleApiError(err);
      expect(msg).toContain("Server Error");
      expect(msg).toContain("temporarily unavailable");
    });

    it("formats network errors", () => {
      const err = new Error("fetch failed");
      const msg = handleApiError(err);
      expect(msg).toContain("Could not connect");
    });

    it("formats generic errors", () => {
      const err = new Error("something broke");
      const msg = handleApiError(err);
      expect(msg).toContain("something broke");
    });

    it("formats non-Error values", () => {
      const msg = handleApiError("string error");
      expect(msg).toContain("unexpected");
    });
  });
});
