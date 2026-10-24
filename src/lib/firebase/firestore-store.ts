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

export async function storeReadCollection<T>(collectionName: string): Promise<T[]> {
  // If service account is available, try adminDb first
  if (hasAdminCredentials) {
    try {
      const snapshot = await adminDb.collection(collectionName).get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
    } catch (err) {
      console.warn(`[firestore-store] adminDb read error for ${collectionName}:`, err);
    }
  }

  // Load from persistent storage
  const map = loadInitialCollectionData(collectionName);
  return Object.values(map) as T[];
}

export async function storeReadDocument<T>(collectionName: string, id: string): Promise<T | null> {
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

  const map = loadInitialCollectionData(collectionName);
  return (map[id] as T) || null;
}

export async function storeSetDocument<T extends Record<string, any>>(
  collectionName: string,
  id: string,
  data: T,
  merge = true
): Promise<void> {
  if (hasAdminCredentials) {
    try {
      await adminDb.collection(collectionName).doc(id).set(data, { merge });
    } catch (err) {
      console.warn(`[firestore-store] adminDb set error for ${collectionName}/${id}:`, err);
    }
  }

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
  if (hasAdminCredentials) {
    try {
      await adminDb.collection(collectionName).doc(id).update(data);
    } catch (err) {
      console.warn(`[firestore-store] adminDb update error for ${collectionName}/${id}:`, err);
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

  const map = loadInitialCollectionData(collectionName);
  if (map[id]) {
    delete map[id];
    saveCollectionData(collectionName, map);
  }
}
