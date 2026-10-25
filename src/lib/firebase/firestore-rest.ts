import "server-only";

import fs from "fs";
import path from "path";
import os from "os";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "nxtive-80349";
const OAUTH_CLIENT_ID = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const OAUTH_CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Retrieve a valid Google Cloud / Firebase OAuth2 access token.
 * Reads refresh token from environment variable or local Firebase CLI config.
 */
export async function getFirestoreAccessToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  let refreshToken = process.env.FIREBASE_AUTH_REFRESH_TOKEN;

  if (!refreshToken) {
    // Check ~/.config/configstore/firebase-tools.json (standard Linux / macOS / Windows bash)
    const p1 = path.join(os.homedir(), ".config", "configstore", "firebase-tools.json");
    if (fs.existsSync(p1)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(p1, "utf8"));
        refreshToken = parsed.tokens?.refresh_token;
      } catch {
        // Fall through
      }
    }
  }

  if (!refreshToken && process.env.APPDATA) {
    // Check %APPDATA%/configstore/firebase-tools.json
    const p2 = path.join(process.env.APPDATA, "configstore", "firebase-tools.json");
    if (fs.existsSync(p2)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(p2, "utf8"));
        refreshToken = parsed.tokens?.refresh_token;
      } catch {
        // Fall through
      }
    }
  }

  if (!refreshToken) {
    return null;
  }

  try {
    const params = new URLSearchParams();
    params.append("client_id", OAUTH_CLIENT_ID);
    params.append("client_secret", OAUTH_CLIENT_SECRET);
    params.append("refresh_token", refreshToken);
    params.append("grant_type", "refresh_token");

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("[firestore-rest] OAuth token refresh response error:", res.status);
      return null;
    }

    const data = await res.json();
    if (!data.access_token) {
      return null;
    }

    cachedAccessToken = data.access_token;
    tokenExpiresAt = now + ((data.expires_in || 3600) * 1000);
    return cachedAccessToken;
  } catch (err) {
    console.warn("[firestore-rest] OAuth token refresh network failure:", err);
    return null;
  }
}

export function toFirestoreValue(val: unknown): Record<string, unknown> {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === "string") return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === "object") {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export function fromFirestoreValue(val: any): any {
  if (!val || typeof val !== "object") return null;
  if ("nullValue" in val) return null;
  if ("booleanValue" in val) return val.booleanValue;
  if ("integerValue" in val) return parseInt(val.integerValue, 10);
  if ("doubleValue" in val) return Number(val.doubleValue);
  if ("stringValue" in val) return val.stringValue;
  if ("timestampValue" in val) return val.timestampValue;
  if ("arrayValue" in val) return (val.arrayValue.values || []).map(fromFirestoreValue);
  if ("mapValue" in val) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      res[k] = fromFirestoreValue(v);
    }
    return res;
  }
  return null;
}

export function fromFirestoreDocument<T = Record<string, any>>(doc: any): T {
  const parts = (doc.name || "").split("/");
  const id = parts[parts.length - 1];
  const data: Record<string, any> = { id };
  if (doc.fields) {
    for (const [k, v] of Object.entries(doc.fields)) {
      data[k] = fromFirestoreValue(v);
    }
  }
  return data as T;
}

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/**
 * Read all documents from a Firestore collection via REST API.
 */
export async function firestoreRestReadCollection<T = any>(collectionName: string): Promise<T[] | null> {
  const token = await getFirestoreAccessToken();
  if (!token) return null;

  try {
    const url = `${BASE_URL}/${collectionName}?pageSize=300`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      if (res.status === 404) return [];
      console.warn(`[firestore-rest] Read collection ${collectionName} error status:`, res.status);
      return null;
    }

    const json = await res.json();
    const documents = json.documents || [];
    return documents.map(fromFirestoreDocument) as T[];
  } catch (err) {
    console.warn(`[firestore-rest] Read collection ${collectionName} failed:`, err);
    return null;
  }
}

/**
 * Read a single document from a Firestore collection via REST API.
 */
export async function firestoreRestReadDocument<T = any>(
  collectionName: string,
  id: string
): Promise<T | null> {
  const token = await getFirestoreAccessToken();
  if (!token) return null;

  try {
    const url = `${BASE_URL}/${collectionName}/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      console.warn(`[firestore-rest] Read document ${collectionName}/${id} status:`, res.status);
      return null;
    }

    const doc = await res.json();
    return fromFirestoreDocument<T>(doc);
  } catch (err) {
    console.warn(`[firestore-rest] Read document ${collectionName}/${id} failed:`, err);
    return null;
  }
}

/**
 * Create or replace/merge a document in Firestore via REST API.
 */
export async function firestoreRestSetDocument(
  collectionName: string,
  id: string,
  data: Record<string, any>,
  merge = true
): Promise<boolean> {
  const token = await getFirestoreAccessToken();
  if (!token) return false;

  try {
    const fields: Record<string, unknown> = {};
    const fieldPaths: string[] = [];

    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
        fieldPaths.push(k);
      }
    }

    let url = `${BASE_URL}/${collectionName}/${encodeURIComponent(id)}`;
    if (merge && fieldPaths.length > 0) {
      const masks = fieldPaths.map((p) => `updateMask.fieldPaths=${encodeURIComponent(p)}`).join("&");
      url += `?${masks}`;
    }

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[firestore-rest] Set document ${collectionName}/${id} error:`, res.status, errText);
      return false;
    }

    return true;
  } catch (err) {
    console.warn(`[firestore-rest] Set document ${collectionName}/${id} failed:`, err);
    return false;
  }
}

/**
 * Delete a document from Firestore via REST API.
 */
export async function firestoreRestDeleteDocument(
  collectionName: string,
  id: string
): Promise<boolean> {
  const token = await getFirestoreAccessToken();
  if (!token) return false;

  try {
    const url = `${BASE_URL}/${collectionName}/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    return res.ok || res.status === 404;
  } catch (err) {
    console.warn(`[firestore-rest] Delete document ${collectionName}/${id} failed:`, err);
    return false;
  }
}

/**
 * Check live connection status to Cloud Firestore.
 */
export async function firestoreRestCheckConnection(): Promise<{
  connected: boolean;
  project: string;
  source: "service_account" | "oauth_token" | "none";
  error?: string;
}> {
  const token = await getFirestoreAccessToken();
  if (!token) {
    return {
      connected: false,
      project: PROJECT_ID,
      source: "none",
      error: "No Google Cloud / Firebase credentials found in environment or CLI config.",
    };
  }

  try {
    const res = await fetch(`${BASE_URL}?pageSize=1`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.ok) {
      return {
        connected: true,
        project: PROJECT_ID,
        source: "oauth_token",
      };
    }

    const errText = await res.text();
    return {
      connected: false,
      project: PROJECT_ID,
      source: "oauth_token",
      error: `Firestore API returned HTTP ${res.status}: ${errText.slice(0, 150)}`,
    };
  } catch (err: any) {
    return {
      connected: false,
      project: PROJECT_ID,
      source: "oauth_token",
      error: err?.message || "Network connection error",
    };
  }
}
