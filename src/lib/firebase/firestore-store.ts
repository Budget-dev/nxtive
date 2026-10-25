import fs from "fs";
import path from "path";
import { hasAdminCredentials, adminDb } from "./admin";
import { DEFAULT_CATEGORIES } from "@/lib/catalog";
import type { Category } from "@/types/product";

import os from "os";

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = IS_SERVERLESS
  ? path.join(os.tmpdir(), "nxtive_firestore")
  : path.join(process.cwd(), ".data", "firestore");

const MEMORY_STORE: Record<string, Record<string, any>> = {};

function ensureDirectoryExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Ignore in read-only environments
  }
}

function getCollectionFilePath(collectionName: string): string {
  ensureDirectoryExists();
  return path.join(DATA_DIR, `${collectionName}.json`);
}

function loadInitialCollectionData(collectionName: string): Record<string, any> {
  if (MEMORY_STORE[collectionName]) {
    return MEMORY_STORE[collectionName];
  }

  // 1. Check active runtime DATA_DIR (e.g. /tmp on Vercel or local .data)
  const filePath = path.join(DATA_DIR, `${collectionName}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      MEMORY_STORE[collectionName] = parsed;
      return parsed;
    } catch {
      // Fall through
    }
  }

  // 2. Fallback to bundled repository files in .data/firestore if running on Vercel
  const bundledPath = path.join(process.cwd(), ".data", "firestore", `${collectionName}.json`);
  if (fs.existsSync(bundledPath)) {
    try {
      const content = fs.readFileSync(bundledPath, "utf-8");
      const parsed = JSON.parse(content);
      MEMORY_STORE[collectionName] = parsed;
      return parsed;
    } catch {
      // Fall through
    }
  }

  // 3. Pre-populate defaults if no file exists yet
  const initialMap: Record<string, any> = {};

  if (collectionName === "categories") {
    DEFAULT_CATEGORIES.forEach((cat) => {
      initialMap[cat.id] = {
        ...cat,
        isActive: true,
      };
    });
    saveCollectionData(collectionName, initialMap);
  } else if (collectionName === "products") {
    // Zero hardcoded products; true empty catalog until added in Firestore/admin
    saveCollectionData(collectionName, initialMap);
  }

  MEMORY_STORE[collectionName] = initialMap;
  return initialMap;
}

function saveCollectionData(collectionName: string, data: Record<string, any>) {
  MEMORY_STORE[collectionName] = data;
  try {
    ensureDirectoryExists();
    const filePath = path.join(DATA_DIR, `${collectionName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    // Graceful fallback for serverless read-only disk
  }
}

import {
  firestoreRestReadCollection,
  firestoreRestReadDocument,
  firestoreRestSetDocument,
  firestoreRestDeleteDocument,
} from "./firestore-rest";

export async function storeReadCollection<T>(collectionName: string): Promise<T[]> {
  // 1. If service account is available, try adminDb first
  if (hasAdminCredentials) {
    try {
      const snapshot = await adminDb.collection(collectionName).get();
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
      // Sync local cache
      const map: Record<string, any> = {};
      docs.forEach((d: any) => { if (d.id) map[d.id] = d; });
      saveCollectionData(collectionName, map);
      return docs;
    } catch (err) {
      console.warn(`[firestore-store] adminDb read error for ${collectionName}:`, err);
    }
  }

  // 2. Direct Cloud Firestore connection via authenticated REST API
  try {
    const cloudDocs = await firestoreRestReadCollection<T>(collectionName);
    if (cloudDocs !== null) {
      // If cloud docs exist, update local cache and return live data
      const map: Record<string, any> = {};
      cloudDocs.forEach((d: any) => { if (d.id) map[d.id] = d; });
      if (cloudDocs.length > 0 || !fs.existsSync(path.join(DATA_DIR, `${collectionName}.json`))) {
        saveCollectionData(collectionName, map);
      }
      return cloudDocs;
    }
  } catch (err) {
    console.warn(`[firestore-store] cloud REST read error for ${collectionName}:`, err);
  }

  // 3. Fallback to persistent storage
  const map = loadInitialCollectionData(collectionName);
  return Object.values(map) as T[];
}

export async function storeReadDocument<T>(collectionName: string, id: string): Promise<T | null> {
  // 1. If service account is available, try adminDb
  if (hasAdminCredentials) {
    try {
      const doc = await adminDb.collection(collectionName).doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as T;
      }
    } catch (err) {
      console.warn(`[firestore-store] adminDb read doc error for ${collectionName}/${id}:`, err);
    }
  }

  // 2. Try direct Cloud Firestore REST API
  try {
    const cloudDoc = await firestoreRestReadDocument<T>(collectionName, id);
    if (cloudDoc) {
      return cloudDoc;
    }
  } catch (err) {
    console.warn(`[firestore-store] cloud REST read doc error for ${collectionName}/${id}:`, err);
  }

  // 3. Fallback to local store
  const map = loadInitialCollectionData(collectionName);
  return (map[id] as T) || null;
}

export async function storeSetDocument<T extends Record<string, any>>(
  collectionName: string,
  id: string,
  data: T,
  merge = true
): Promise<void> {
  let cloudSuccess = false;

  // 1. Try Firebase Admin SDK if service account configured
  if (hasAdminCredentials) {
    try {
      await adminDb.collection(collectionName).doc(id).set(data, { merge });
      cloudSuccess = true;
    } catch (err) {
      console.warn(`[firestore-store] adminDb set error for ${collectionName}/${id}:`, err);
    }
  }

  // 2. Try direct Cloud Firestore REST API
  if (!cloudSuccess) {
    try {
      const res = await firestoreRestSetDocument(collectionName, id, data, merge);
      if (res) cloudSuccess = true;
    } catch (err) {
      console.warn(`[firestore-store] cloud REST set error for ${collectionName}/${id}:`, err);
    }
  }

  // 3. Always update local store so local file is synchronized
  const map = loadInitialCollectionData(collectionName);
  const existing = map[id] || {};
  map[id] = merge ? { ...existing, ...data, id } : { ...data, id };
  saveCollectionData(collectionName, map);
}

export async function storeUpdateDocument(
  collectionName: string,
  id: string,
  data: Record<string, any>
): Promise<void> {
  let cloudSuccess = false;

  if (hasAdminCredentials) {
    try {
      await adminDb.collection(collectionName).doc(id).update(data);
      cloudSuccess = true;
    } catch (err) {
      console.warn(`[firestore-store] adminDb update error for ${collectionName}/${id}:`, err);
    }
  }

  if (!cloudSuccess) {
    try {
      const res = await firestoreRestSetDocument(collectionName, id, data, true);
      if (res) cloudSuccess = true;
    } catch (err) {
      console.warn(`[firestore-store] cloud REST update error for ${collectionName}/${id}:`, err);
    }
  }

  const map = loadInitialCollectionData(collectionName);
  if (map[id]) {
    map[id] = { ...map[id], ...data, id, updatedAt: new Date().toISOString() };
    saveCollectionData(collectionName, map);
  }
}

export async function storeDeleteDocument(collectionName: string, id: string): Promise<void> {
  if (hasAdminCredentials) {
    try {
      await adminDb.collection(collectionName).doc(id).delete();
    } catch (err) {
      console.warn(`[firestore-store] adminDb delete error for ${collectionName}/${id}:`, err);
    }
  }

  try {
    await firestoreRestDeleteDocument(collectionName, id);
  } catch (err) {
    console.warn(`[firestore-store] cloud REST delete error for ${collectionName}/${id}:`, err);
  }

  const map = loadInitialCollectionData(collectionName);
  if (map[id]) {
    delete map[id];
    saveCollectionData(collectionName, map);
  }
}

