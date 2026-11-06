import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { mapShiprocketStatusToInternal, getShiprocketPublicTrackingUrl } from "@/server/delivery/tracking";

describe("Shiprocket Delivery Service Unit Tests", () => {
  describe("getShiprocketPublicTrackingUrl", () => {
    it("generates correct public tracking URL for standard AWB", () => {
      const url = getShiprocketPublicTrackingUrl("143256789012");
      expect(url).toBe("https://shiprocket.co/tracking/143256789012");
    });

    it("encodes special characters in AWB", () => {
      const url = getShiprocketPublicTrackingUrl("SR-NXT-998877");
      expect(url).toBe("https://shiprocket.co/tracking/SR-NXT-998877");
    });
  });

  describe("mapShiprocketStatusToInternal", () => {
    it("maps numeric codes correctly", () => {
      expect(mapShiprocketStatusToInternal(7)).toBe("delivered");
      expect(mapShiprocketStatusToInternal(17)).toBe("out_for_delivery");
      expect(mapShiprocketStatusToInternal(6)).toBe("in_transit");
      expect(mapShiprocketStatusToInternal(18)).toBe("in_transit");
      expect(mapShiprocketStatusToInternal(19)).toBe("picked_up");
      expect(mapShiprocketStatusToInternal(9)).toBe("returned_to_origin");
      expect(mapShiprocketStatusToInternal(8)).toBe("failed_delivery");
    });

    it("maps status strings correctly", () => {
      expect(mapShiprocketStatusToInternal("DELIVERED")).toBe("delivered");
      expect(mapShiprocketStatusToInternal("OUT FOR DELIVERY")).toBe("out_for_delivery");
      expect(mapShiprocketStatusToInternal("IN TRANSIT")).toBe("in_transit");
      expect(mapShiprocketStatusToInternal("SHIPPED")).toBe("in_transit");
      expect(mapShiprocketStatusToInternal("PICKED UP")).toBe("picked_up");
      expect(mapShiprocketStatusToInternal("RTO INITIATED")).toBe("returned_to_origin");
      expect(mapShiprocketStatusToInternal("CANCELLED")).toBe("failed_delivery");
      expect(mapShiprocketStatusToInternal("UNKNOWN_STATUS")).toBe("pending");
    });
  });
});
