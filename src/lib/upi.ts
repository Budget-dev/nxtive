// Utility functions for UPI and PhonePe deep-linking and device detection.

export interface UpiLinkOptions {
  payeeVpa?: string | null;
  payeeName?: string | null;
  amount: number | string;
  orderId: string;
  note?: string;
}

export const DEFAULT_VPA = process.env.NEXT_PUBLIC_PHONEPE_VPA || "9700446690-2@ybl";
export const DEFAULT_NAME = process.env.NEXT_PUBLIC_PHONEPE_NAME || "PREM SANDEEP  ZAKKULA";
export const DEFAULT_QR_IMAGE = process.env.NEXT_PUBLIC_PHONEPE_QR_IMAGE || "/images/phonepe-qr-clean.jpg";
export const PHONEPE_STATIC_QR_URI = "upi://pay?pa=9700446690-2@ybl&pn=PREM%20SANDEEP%20%20ZAKKULA&mc=0000&mode=02&purpose=00";

/**
 * Builds a direct PhonePe mobile app deep-link URI (phonepe://pay).
 * On Android/iOS with PhonePe installed, navigating to this URI opens the PhonePe app with payee details pre-filled.
 */
export function buildPhonePeLink({
  payeeVpa,
  payeeName,
  amount,
  orderId,
  note,
}: UpiLinkOptions): string {
  const vpa = (payeeVpa || DEFAULT_VPA).trim();
  const name = (payeeName || DEFAULT_NAME).trim();
  const numAmount = typeof amount === "number" ? amount.toFixed(2) : Number(amount).toFixed(2);
  const transactionNote = note || `Order ${orderId}`;

  // Keep @ unencoded in pa= to comply with NPCI UPI and PhonePe intent parsing
  return `phonepe://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${encodeURIComponent(numAmount)}&cu=INR&tn=${encodeURIComponent(transactionNote)}&mc=0000&mode=02&purpose=00`;
}

/**
 * Builds a universal generic UPI intent link (upi://pay).
 * Supported by Google Pay, PhonePe, Paytm, CRED, BHIM, and all UPI QR scanners.
 */
export function buildGenericUpiLink({
  payeeVpa,
  payeeName,
  amount,
  orderId,
  note,
}: UpiLinkOptions): string {
  const vpa = (payeeVpa || DEFAULT_VPA).trim();
  const name = (payeeName || DEFAULT_NAME).trim();
  const numAmount = typeof amount === "number" ? amount.toFixed(2) : Number(amount).toFixed(2);
  const transactionNote = note || `Order ${orderId}`;

  // Keep @ unencoded in pa= to comply with NPCI UPI intent parsing
  return `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${encodeURIComponent(numAmount)}&cu=INR&tn=${encodeURIComponent(transactionNote)}&mc=0000&mode=02&purpose=00`;
}

/**
 * Checks if the current client is a mobile device (by User-Agent or viewport width).
 */
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;
  const isTouchScreen = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  return mobileRegex.test(ua) || (isTouchScreen && window.innerWidth <= 840);
}
