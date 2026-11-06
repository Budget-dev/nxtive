// TypeScript type definitions for Shiprocket API integration.

export type ShiprocketPaymentMethod = "COD" | "Prepaid";

export interface ShiprocketAuthCredentials {
  email: string;
  password: string;
}

export interface ShiprocketAuthTokenResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company_id: number;
  created_at: string;
  token: string;
}

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: number | string;
}

export interface ShiprocketCreateOrderPayload {
  order_id: string; // Merchant order number (e.g. NXT-20261106-9281)
  order_date: string; // Format: YYYY-MM-DD or YYYY-MM-DD HH:mm
  pickup_location: string; // Registered pickup nickname in Shiprocket
  channel_id?: string;
  comment?: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_country?: string;
  shipping_state?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: ShiprocketOrderItem[];
  payment_method: ShiprocketPaymentMethod;
  shipping_charges?: number;
  giftwrap_charges?: number;
  transaction_charges?: number;
  total_discount?: number;
  sub_total: number;
  length: number; // in cm
  breadth: number; // in cm
  height: number; // in cm
  weight: number; // in kg
}

export interface ShiprocketCreateOrderResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now?: number;
  awb_code?: string;
  courier_company_id?: number;
  courier_name?: string;
  new_channel?: boolean;
  routing_code?: string;
}

export interface ShiprocketGenerateAwbPayload {
  shipment_id: number | string;
  courier_id?: number;
  status?: string;
}

export interface ShiprocketGenerateAwbResponse {
  awb_assign_status: number;
  response?: {
    data?: {
      awb_code: string;
      courier_company_id: number;
      courier_name: string;
      shipment_id: number;
      assigned_date_time?: string;
      applied_weight?: number;
      routing_code?: string;
    };
  };
}

export interface ShiprocketTrackingActivity {
  date: string;
  status: string;
  activity: string;
  location: string;
  "sr-status"?: string;
  "sr-status-label"?: string;
}

export interface ShiprocketTrackingTrack {
  id: number;
  awb_code: string;
  courier_company_id?: number;
  courier_name: string;
  current_status: string;
  origin?: string;
  destination?: string;
  edd?: string;
  pickup_date?: string;
  delivered_date?: string;
}

export interface ShiprocketTrackingData {
  track_status: number;
  shipment_status: number;
  shipment_track?: ShiprocketTrackingTrack[];
  shipment_track_activities?: ShiprocketTrackingActivity[];
  track_url?: string;
  error?: string;
}

export interface ShiprocketTrackingResponse {
  tracking_data: ShiprocketTrackingData;
}

export interface ShiprocketWebhookPayload {
  awb?: string;
  courier_name?: string;
  current_status?: string;
  current_status_id?: number;
  shipment_status?: string;
  shipment_status_id?: number;
  order_id?: string | number;
  sr_order_id?: number;
  shipment_id?: number;
  etd?: string;
  scans?: Array<{
    date: string;
    activity: string;
    location: string;
    status: string;
  }>;
  [key: string]: any;
}
