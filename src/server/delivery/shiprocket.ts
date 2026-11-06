import "server-only";

import { storeReadDocument, storeUpdateDocument, storeSetDocument } from "@/lib/firebase/firestore-store";
import * as auth from "./auth";
import * as orders from "./orders";
import * as tracking from "./tracking";
import { ShiprocketWebhookPayload } from "./types";

export class ShiprocketService {
  public auth = auth;
  public orders = orders;
  public tracking = tracking;

  /**
   * Complete fulfillment workflow:
   * 1. Loads order from Firestore.
   * 2. Registers order with Shiprocket external API.
   * 3. Assigns AWB if not assigned during order creation.
   * 4. Updates Firestore `orders` and `shipments` collections with courier details, AWB, and tracking URL.
   */
  async createShipmentForOrder(
    orderId: string,
    options?: { pickupLocation?: string }
  ) {
    const order = await storeReadDocument<any>("orders", orderId);
    if (!order) {
      throw new Error(`Order #${orderId} was not found in database.`);
    }

    const now = new Date().toISOString();

    // 1. Submit order to Shiprocket
    const srOrderResponse = await orders.createShiprocketOrderFromNxtiveOrder(order, options);

    let awbCode = srOrderResponse.awb_code;
    let courierName = srOrderResponse.courier_name || "Shiprocket Express";

    // 2. If AWB not automatically assigned in creation, assign it via AWB API
    if (!awbCode && srOrderResponse.shipment_id) {
      try {
        const awbRes = await orders.generateShiprocketAwb(srOrderResponse.shipment_id);
        if (awbRes.response?.data?.awb_code) {
          awbCode = awbRes.response.data.awb_code;
          courierName = awbRes.response.data.courier_name || courierName;
        }
      } catch (awbErr) {
        console.warn(`[ShiprocketService]: Automatic AWB generation deferred for shipment ${srOrderResponse.shipment_id}:`, awbErr);
      }
    }

    // Default fallback identifier if pending courier assignment in Shiprocket dashboard
    const finalAwb = awbCode || `SR-${srOrderResponse.shipment_id || srOrderResponse.order_id}`;
    const trackingUrl = tracking.getShiprocketPublicTrackingUrl(finalAwb);

    const currentHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    const updatedHistory = [
      ...currentHistory,
      {
        status: "shipped",
        timestamp: now,
        note: `Shiprocket consignment created (${courierName}, AWB: ${finalAwb})`,
        updatedBy: "system",
      },
    ];

    // 3. Update Firestore order document
    const orderUpdates = {
      shiprocketOrderId: srOrderResponse.order_id,
      shipmentId: srOrderResponse.shipment_id,
      awbCode: finalAwb,
      trackingNumber: finalAwb,
      carrier: courierName,
      trackingUrl,
      status: "shipped",
      statusHistory: updatedHistory,
      updatedAt: now,
    };

    await storeUpdateDocument("orders", orderId, orderUpdates);

    // 4. Record in shipments collection
    const shipmentId = `shp_${orderId}`;
    const shipmentRecord = {
      id: shipmentId,
      orderId,
      orderNumber: order.orderNumber || orderId,
      customerName: order.customerName || order.shippingAddress?.fullName || "Customer",
      destinationCity: order.shippingAddress?.city || "India",
      provider: "shiprocket",
      providerName: courierName,
      trackingNumber: finalAwb,
      trackingUrl,
      status: "in_transit",
      events: [
        {
          status: "in_transit",
          location: options?.pickupLocation || "Warehouse",
          timestamp: now,
          description: `Consignment registered with ${courierName}`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    await storeSetDocument("shipments", shipmentId, shipmentRecord);

    return {
      orderId,
      shiprocketOrderId: srOrderResponse.order_id,
      shipmentId: srOrderResponse.shipment_id,
      awbCode: finalAwb,
      courierName,
      trackingUrl,
    };
  }

  /**
   * Fetches real-time tracking from Shiprocket and syncs current state with Firestore.
   */
  async syncTracking(awbOrOrderId: string) {
    const isAwb = !awbOrOrderId.includes("-") && awbOrOrderId.length >= 8;
    const trackingRes = isAwb
      ? await tracking.trackShiprocketByAwb(awbOrOrderId)
      : await tracking.trackShiprocketByOrderId(awbOrOrderId);

    const trackData = trackingRes.tracking_data;
    const trackInfo = trackData?.shipment_track?.[0];
    const activities = trackData?.shipment_track_activities || [];

    return {
      trackStatus: trackData?.track_status,
      awbCode: trackInfo?.awb_code || awbOrOrderId,
      courierName: trackInfo?.courier_name || "Shiprocket Express",
      currentStatus: trackInfo?.current_status || "In Transit",
      internalStatus: tracking.mapShiprocketStatusToInternal(
        trackInfo?.current_status || trackData?.shipment_status || ""
      ),
      edd: trackInfo?.edd,
      trackingUrl: trackData?.track_url || tracking.getShiprocketPublicTrackingUrl(trackInfo?.awb_code || awbOrOrderId),
      activities,
    };
  }

  /**
   * Processes an incoming Shiprocket delivery webhook and updates the matching Firestore order.
   */
  async handleWebhook(payload: ShiprocketWebhookPayload) {
    const awb = payload.awb || payload.awb_code;
    const orderId = payload.order_id;
    const currentStatus = payload.current_status || payload.shipment_status || "";
    const internalStatus = tracking.mapShiprocketStatusToInternal(currentStatus);
    const courierName = payload.courier_name || "Shiprocket Express";
    const now = new Date().toISOString();

    if (!awb && !orderId) {
      throw new Error("Webhook payload missing AWB and order_id.");
    }

    // Locate the matching order document
    let order: any = null;
    let docId: string | null = null;

    if (orderId) {
      order = await storeReadDocument<any>("orders", String(orderId));
      if (order) docId = String(orderId);
    }

    if (!order && awb) {
      // Lookup by AWB in shipments or orders
      const { storeReadCollection } = await import("@/lib/firebase/firestore-store");
      const ordersList = await storeReadCollection<any>("orders");
      const match = ordersList.find((o) => o.awbCode === awb || o.trackingNumber === awb);
      if (match) {
        order = match;
        docId = match.id;
      }
    }

    if (!docId || !order) {
      return { handled: false, reason: "Order not found in database for webhook." };
    }

    const currentHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    const note = `Shiprocket Update: ${currentStatus} (${courierName})`;

    const updates: any = {
      status: internalStatus,
      statusHistory: [
        ...currentHistory,
        {
          status: internalStatus,
          timestamp: now,
          note,
          updatedBy: "shiprocket_webhook",
        },
      ],
      updatedAt: now,
    };

    if (internalStatus === "delivered") {
      updates.deliveredAt = now;
      if (order.paymentMethod === "cod" || order.paymentMethod === "cod_partial") {
        updates.paymentStatus = "paid";
      }
    }

    await storeUpdateDocument("orders", docId, updates);

    return {
      handled: true,
      orderId: docId,
      awb,
      currentStatus,
      internalStatus,
    };
  }
}

export const shiprocket = new ShiprocketService();
