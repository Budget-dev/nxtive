import "server-only";

import { ShipmentStatus } from "@/types/delivery";
import { ShiprocketTrackingResponse } from "./types";
import { getShiprocketAuthToken, clearShiprocketTokenCache } from "./auth";

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

export class ShiprocketTrackingError extends Error {
  constructor(message: string, public statusCode?: number, public responseData?: any) {
    super(`[ShiprocketTrackingError]: ${message}`);
    this.name = "ShiprocketTrackingError";
  }
}

/**
 * Returns public tracking URL for a given Shiprocket AWB.
 */
export function getShiprocketPublicTrackingUrl(awb: string): string {
  const cleanAwb = awb.trim();
  return `https://shiprocket.co/tracking/${encodeURIComponent(cleanAwb)}`;
}

/**
 * Fetches real-time tracking details from Shiprocket by AWB number.
 */
export async function trackShiprocketByAwb(awb: string): Promise<ShiprocketTrackingResponse> {
  const cleanAwb = awb.trim();
  if (!cleanAwb) {
    throw new ShiprocketTrackingError("AWB code is required for tracking.");
  }

  let token = await getShiprocketAuthToken();

  async function sendRequest(authToken: string) {
    return fetch(`${SHIPROCKET_BASE_URL}/courier/track/awb/${encodeURIComponent(cleanAwb)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      cache: "no-store",
    });
  }

  let res = await sendRequest(token);

  if (res.status === 401) {
    clearShiprocketTokenCache();
    token = await getShiprocketAuthToken(true);
    res = await sendRequest(token);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ShiprocketTrackingError(
      data?.message || `Failed to fetch tracking for AWB ${cleanAwb}`,
      res.status,
      data
    );
  }

  return data as ShiprocketTrackingResponse;
}

/**
 * Fetches real-time tracking details from Shiprocket by Order ID.
 */
export async function trackShiprocketByOrderId(orderId: string): Promise<ShiprocketTrackingResponse> {
  const cleanOrderId = orderId.trim();
  if (!cleanOrderId) {
    throw new ShiprocketTrackingError("Order ID is required for tracking.");
  }

  let token = await getShiprocketAuthToken();

  async function sendRequest(authToken: string) {
    return fetch(`${SHIPROCKET_BASE_URL}/courier/track?order_id=${encodeURIComponent(cleanOrderId)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      cache: "no-store",
    });
  }

  let res = await sendRequest(token);

  if (res.status === 401) {
    clearShiprocketTokenCache();
    token = await getShiprocketAuthToken(true);
    res = await sendRequest(token);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ShiprocketTrackingError(
      data?.message || `Failed to fetch tracking for Order ID ${cleanOrderId}`,
      res.status,
      data
    );
  }

  return data as ShiprocketTrackingResponse;
}

/**
 * Maps Shiprocket's carrier tracking status codes and strings to NXTIVE internal ShipmentStatus.
 */
export function mapShiprocketStatusToInternal(status: string | number): ShipmentStatus {
  if (typeof status === "number") {
    // Shiprocket numeric status codes:
    // 6 = Shipped, 7 = Delivered, 8 = Cancelled, 9 = RTO Initiated, 10 = RTO Delivered,
    // 17 = Out For Delivery, 18 = In Transit, 19 = Out For Pickup, 20 = Pickup Scheduled, etc.
    switch (status) {
      case 7:
        return "delivered";
      case 17:
        return "out_for_delivery";
      case 6:
      case 18:
        return "in_transit";
      case 19:
      case 20:
      case 42:
        return "picked_up";
      case 9:
      case 10:
      case 14:
        return "returned_to_origin";
      case 8:
      case 13:
      case 15:
        return "failed_delivery";
      default:
        return "pending";
    }
  }

  const normalized = String(status || "").trim().toUpperCase();

  if (normalized.includes("DELIVERED") && !normalized.includes("RTO")) {
    return "delivered";
  }
  if (normalized.includes("OUT FOR DELIVERY") || normalized.includes("OUT_FOR_DELIVERY")) {
    return "out_for_delivery";
  }
  if (
    normalized.includes("IN TRANSIT") ||
    normalized.includes("IN_TRANSIT") ||
    normalized.includes("SHIPPED") ||
    normalized.includes("DISPATCHED")
  ) {
    return "in_transit";
  }
  if (normalized.includes("PICKED UP") || normalized.includes("PICKUP DONE")) {
    return "picked_up";
  }
  if (normalized.includes("RTO") || normalized.includes("RETURN")) {
    return "returned_to_origin";
  }
  if (normalized.includes("CANCEL") || normalized.includes("UNDELIVERED") || normalized.includes("FAILED")) {
    return "failed_delivery";
  }

  return "pending";
}
