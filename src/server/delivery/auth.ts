import "server-only";

import { ShiprocketAuthTokenResponse } from "./types";

const SHIPROCKET_LOGIN_URL = "https://apiv2.shiprocket.in/v1/external/auth/login";

let cachedToken: string | null = null;
let tokenExpiresAt = 0; // Epoch timestamp in ms

export class ShiprocketAuthError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(`[ShiprocketAuthError]: ${message}`);
    this.name = "ShiprocketAuthError";
  }
}

/**
 * Retrieves a valid Shiprocket authentication bearer token.
 * Tokens are cached in-memory and automatically refreshed upon expiration (7-day cycle).
 */
export async function getShiprocketAuthToken(forceRefresh = false): Promise<string> {
  const email =
    process.env.SHIPROCKET_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_SHIPROCKET_EMAIL?.trim() ||
    "hr@budgetdev.in";
  const password =
    process.env.SHIPROCKET_PASSWORD?.trim() ||
    process.env.NEXT_PUBLIC_SHIPROCKET_PASSWORD?.trim() ||
    "OYoF07Ja^VYXlnGi^Ph8uAETn2Y0ugG1";

  // If credentials are not provided, fallback to direct static token if provided
  if (!email || !password) {
    const staticToken = process.env.SHIPROCKET_TOKEN?.trim();
    if (staticToken) return staticToken;

    throw new ShiprocketAuthError(
      "Missing Shiprocket credentials. Please ensure SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD are set."
    );
  }

  // Return cached token if still valid and force refresh is not requested
  if (!forceRefresh && cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  try {
    const res = await fetch(SHIPROCKET_LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new ShiprocketAuthError(
        `Shiprocket login failed with HTTP ${res.status}: ${errorText || res.statusText}`,
        res.status
      );
    }

    const data: ShiprocketAuthTokenResponse = await res.json();

    if (!data?.token) {
      throw new ShiprocketAuthError("Shiprocket authentication response did not contain a valid token.");
    }

    cachedToken = data.token;
    // Shiprocket tokens expire in 10 days; cache for 7 days to refresh safely in advance
    tokenExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    return cachedToken;
  } catch (err: any) {
    if (err instanceof ShiprocketAuthError) {
      throw err;
    }
    throw new ShiprocketAuthError(`Failed to authenticate with Shiprocket API: ${err?.message || err}`);
  }
}

/**
 * Clears the in-memory token cache. Call this when receiving an HTTP 401 Unauthorized
 * to force re-authentication on the subsequent request.
 */
export function clearShiprocketTokenCache(): void {
  cachedToken = null;
  tokenExpiresAt = 0;
}
