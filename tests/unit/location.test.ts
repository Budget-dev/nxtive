import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  matchIndianState,
  sanitizePostalCode,
  reverseGeocode,
  INDIAN_STATES,
} from "../../src/lib/location";

describe("Location & Geocoding Utilities", () => {
  describe("matchIndianState", () => {
    it("should match exact state names case-insensitively", () => {
      expect(matchIndianState("maharashtra")).toBe("Maharashtra");
      expect(matchIndianState("KARNATAKA")).toBe("Karnataka");
      expect(matchIndianState("delhi")).toBe("Delhi");
    });

    it("should match aliases and partial strings", () => {
      expect(matchIndianState("National Capital Territory of Delhi")).toBe("Delhi");
      expect(matchIndianState("Orissa")).toBe("Odisha");
      expect(matchIndianState("Pondicherry")).toBe("Puducherry");
      expect(matchIndianState("West Bengal State")).toBe("West Bengal");
    });

    it("should return undefined for invalid states", () => {
      expect(matchIndianState("California")).toBeUndefined();
      expect(matchIndianState("")).toBeUndefined();
    });
  });

  describe("sanitizePostalCode", () => {
    it("should extract clean 6-digit postal codes", () => {
      expect(sanitizePostalCode("400070")).toBe("400070");
      expect(sanitizePostalCode("400 070")).toBe("400070");
      expect(sanitizePostalCode("PIN: 560001-India")).toBe("560001");
    });

    it("should handle partial or empty postal codes safely", () => {
      expect(sanitizePostalCode("")).toBe("");
      expect(sanitizePostalCode("abc")).toBe("");
      expect(sanitizePostalCode("400")).toBe("400");
    });
  });

  describe("reverseGeocode", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("should resolve address from Photon response", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: "FeatureCollection",
          features: [
            {
              properties: {
                name: "Janata Tawa Grill",
                street: "LBS Marg",
                locality: "Kurla",
                city: "Mumbai",
                state: "Maharashtra",
                postcode: "400070",
                country: "India",
              },
            },
          ],
        }),
      } as any);

      const result = await reverseGeocode(19.076, 72.8777);
      expect(result.city).toBe("Mumbai");
      expect(result.state).toBe("Maharashtra");
      expect(result.postalCode).toBe("400070");
      expect(result.street).toContain("LBS Marg");
      expect(result.provider).toBe("photon");
    });

    it("should fallback to BigDataCloud if Photon fails", async () => {
      // First fetch (Photon) fails
      vi.spyOn(globalThis, "fetch")
        .mockRejectedValueOnce(new Error("Photon network error"))
        // Second fetch (BigDataCloud) succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            city: "Bengaluru",
            principalSubdivision: "Karnataka",
            postcode: "560001",
            locality: "Bengaluru Urban",
            localityInfo: {
              administrative: [{ order: 10, name: "MG Road" }],
            },
          }),
        } as any);

      const result = await reverseGeocode(12.9716, 77.5946);
      expect(result.city).toBe("Bengaluru");
      expect(result.state).toBe("Karnataka");
      expect(result.postalCode).toBe("560001");
      expect(result.street).toBe("MG Road");
      expect(result.provider).toBe("bigdatacloud");
    });
  });
});

