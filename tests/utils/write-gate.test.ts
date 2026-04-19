import { describe, it, expect, afterEach } from "vitest";
import { requireWrite, isWriteEnabled } from "../../src/utils/write-gate.js";

describe("write-gate", () => {
  const originalEnv = process.env.SABRE_WRITE_ENABLED;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.SABRE_WRITE_ENABLED = originalEnv;
    } else {
      delete process.env.SABRE_WRITE_ENABLED;
    }
  });

  describe("isWriteEnabled", () => {
    it("returns false when env not set", () => {
      delete process.env.SABRE_WRITE_ENABLED;
      expect(isWriteEnabled()).toBe(false);
    });

    it("returns false when env is 'false'", () => {
      process.env.SABRE_WRITE_ENABLED = "false";
      expect(isWriteEnabled()).toBe(false);
    });

    it("returns true when env is 'true'", () => {
      process.env.SABRE_WRITE_ENABLED = "true";
      expect(isWriteEnabled()).toBe(true);
    });

    it("returns true when env is 'TRUE' (case-insensitive)", () => {
      process.env.SABRE_WRITE_ENABLED = "TRUE";
      expect(isWriteEnabled()).toBe(true);
    });
  });

  describe("requireWrite", () => {
    it("returns null when both gates pass", () => {
      process.env.SABRE_WRITE_ENABLED = "true";
      const result = requireWrite(true, "air_book");
      expect(result).toBeNull();
    });

    it("blocks when env not set", () => {
      delete process.env.SABRE_WRITE_ENABLED;
      const result = requireWrite(true, "air_book");
      expect(result).toContain("SABRE_WRITE_ENABLED");
      expect(result).toContain("blocked");
    });

    it("blocks when confirm is false", () => {
      process.env.SABRE_WRITE_ENABLED = "true";
      const result = requireWrite(false, "air_book");
      expect(result).toContain("confirm must be set to true");
    });

    it("blocks when confirm is undefined", () => {
      process.env.SABRE_WRITE_ENABLED = "true";
      const result = requireWrite(undefined, "air_book");
      expect(result).toContain("confirm must be set to true");
    });

    it("blocks when both gates fail (env takes precedence)", () => {
      delete process.env.SABRE_WRITE_ENABLED;
      const result = requireWrite(false, "air_book");
      expect(result).toContain("SABRE_WRITE_ENABLED");
    });

    it("includes operation name in message", () => {
      delete process.env.SABRE_WRITE_ENABLED;
      const result = requireWrite(true, "hotel_book");
      expect(result).toContain("hotel_book");
    });
  });
});
