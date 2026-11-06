import "server-only";

import {
  ShiprocketCreateOrderPayload,
  ShiprocketCreateOrderResponse,
  ShiprocketGenerateAwbResponse,
  ShiprocketOrderItem,
} from "./types";
import { getShiprocketAuthToken, clearShiprocketTokenCache } from "./auth";

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

export class ShiprocketOrderError extends Error {
  constructor(message: string, public statusCode?: number, public responseData?: any) {
    super(`[ShiprocketOrderError]: ${message}`);
    this.name = "ShiprocketOrderError";
  }
}

/**
 * Creates an ad-hoc custom shipment order in Shiprocket.
 * Automatically retries once if a 401 Unauthorized token expiration is encountered.
 */
export async function createShiprocketOrder(
  payload: ShiprocketCreateOrderPayload
): Promise<ShiprocketCreateOrderResponse> {
  let token = await getShiprocketAuthToken();

  async function sendRequest(authToken: string) {
    return fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  }

  let res = await sendRequest(token);

  // If unauthorized, token might have expired externally: refresh once and retry
  if (res.status === 401) {
    clearShiprocketTokenCache();
    token = await getShiprocketAuthToken(true);
    res = await sendRequest(token);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg =
      data?.message ||
      data?.error ||
      data?.errors?.[0]?.message ||
      `Shiprocket order creation failed with HTTP ${res.status}`;
    throw new ShiprocketOrderError(errorMsg, res.status, data);
  }

  return data as ShiprocketCreateOrderResponse;
}

/**
 * Maps a NXTIVE Firestore order to Shiprocket's order creation payload and submits it.
 */
export async function createShiprocketOrderFromNxtiveOrder(
  order: any,
  options?: {
    pickupLocation?: string;
    customDimensions?: { length: number; breadth: number; height: number; weight: number };
  }
): Promise<ShiprocketCreateOrderResponse> {
  const address = order.shippingAddress || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const now = new Date();

  // Extract customer name parts
  const rawFullName = address.fullName || order.customerName || "NXTIVE Customer";
  const nameParts = rawFullName.trim().split(" ");
  const firstName = nameParts[0] || "Valued";
  const lastName = nameParts.slice(1).join(" ") || "Customer";

  // Check if Cash on Delivery
  const isCod =
    order.paymentMethod === "cod" ||
    order.paymentMethod === "cod_partial" ||
    order.paymentMethod?.toLowerCase().includes("cod");

  // Determine subtotal and balance due
  const totalAmount = Number(order.total || order.totalAmount || order.amount || 0);
  const codBalanceDue = Number(order.codBalanceDue ?? (isCod ? Math.max(0, totalAmount - 149) : 0));

  // Shiprocket order items
  const shiprocketItems: ShiprocketOrderItem[] = items.length
    ? items.map((item: any, idx: number) => ({
        name: item.title || item.name || `NXTIVE Apparel Item ${idx + 1}`,
        sku: item.sku || item.productId || `NXT-${idx + 1}`,
        units: Math.max(1, Number(item.quantity || 1)),
        selling_price: Math.max(1, Number(item.price || totalAmount)),
        discount: 0,
      }))
    : [
        {
          name: "NXTIVE Luxury Streetwear",
          sku: "NXT-STANDARD",
          units: 1,
          selling_price: totalAmount > 0 ? totalAmount : 999,
          discount: 0,
        },
      ];

  const payload: ShiprocketCreateOrderPayload = {
    order_id: String(order.orderNumber || order.id),
    order_date: now.toISOString().split("T")[0],
    pickup_location:
      options?.pickupLocation ||
      process.env.SHIPROCKET_PICKUP_LOCATION ||
      "Primary",
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: address.street || address.addressLine1 || "Customer Address",
    billing_address_2: address.apartment || address.addressLine2 || "",
    billing_city: address.city || "Hyderabad",
    billing_pincode: String(address.postalCode || address.pincode || "500001"),
    billing_state: address.state || "Telangana",
    billing_country: "India",
    billing_email: address.email || order.customerEmail || "orders@nxtiveclothing.com",
    billing_phone: String(address.phone || order.customerPhone || "9999999999").replace(/\D/g, "").slice(-10),
    shipping_is_billing: true,
    order_items: shiprocketItems,
    payment_method: isCod ? "COD" : "Prepaid",
    sub_total: isCod && codBalanceDue > 0 ? codBalanceDue : totalAmount,
    length: options?.customDimensions?.length || 30,
    breadth: options?.customDimensions?.breadth || 25,
    height: options?.customDimensions?.height || 5,
    weight: options?.customDimensions?.weight || 0.5,
  };

  return createShiprocketOrder(payload);
}

/**
 * Requests AWB assignment for an active Shiprocket shipment.
 */
export async function generateShiprocketAwb(
  shipmentId: number | string,
  courierId?: number
): Promise<ShiprocketGenerateAwbResponse> {
  const token = await getShiprocketAuthToken();

  const res = await fetch(`${SHIPROCKET_BASE_URL}/courier/assign/awb`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      shipment_id: shipmentId,
      ...(courierId ? { courier_id: courierId } : {}),
    }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.awb_assign_status === 0) {
    const errorMsg = data?.message || "Failed to generate AWB with Shiprocket";
    throw new ShiprocketOrderError(errorMsg, res.status, data);
  }

  return data as ShiprocketGenerateAwbResponse;
}

/**
 * Requests courier pickup for one or more shipments.
 */
export async function requestShipmentPickup(shipmentIds: (number | string)[]): Promise<any> {
  const token = await getShiprocketAuthToken();

  const res = await fetch(`${SHIPROCKET_BASE_URL}/courier/generate/pickup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      shipment_id: shipmentIds,
    }),
    cache: "no-store",
  });

  return res.json().catch(() => ({}));
}

/**
 * Cancels an order in Shiprocket.
 */
export async function cancelShiprocketOrder(orderIds: (string | number)[]): Promise<any> {
  const token = await getShiprocketAuthToken();

  const res = await fetch(`${SHIPROCKET_BASE_URL}/orders/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ids: orderIds,
    }),
    cache: "no-store",
  });

  return res.json().catch(() => ({}));
}
