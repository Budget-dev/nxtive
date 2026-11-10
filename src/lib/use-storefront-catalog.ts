"use client";

import { useEffect, useState, useCallback } from "react";
import type { Category, Product } from "@/types/product";
import {
  DEFAULT_CATEGORIES,
  fetchStorefrontCategories,
  fetchStorefrontProducts,
  normalizeProduct,
  normalizeCategory,
} from "@/lib/catalog";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

// Global in-memory singleton cache to guarantee 0ms instant page navigations
let memoryProducts: Product[] | null = null;
let memoryCategories: Category[] | null = null;
let globalSubscriptionsStarted = false;

const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}

let hasHydrated = false;

function initMemoryFromSession() {
  if (typeof window === "undefined") return;
  try {
    if (!memoryProducts) {
      const storedP = sessionStorage.getItem("nxtive_cache_products");
      if (storedP) {
        const parsedP = JSON.parse(storedP);
        if (Array.isArray(parsedP)) {
          memoryProducts = parsedP;
        }
      }
    }
    if (!memoryCategories) {
      const storedC = sessionStorage.getItem("nxtive_cache_categories");
      if (storedC) {
        const parsedC = JSON.parse(storedC);
        if (Array.isArray(parsedC) && parsedC.length > 0) {
          memoryCategories = parsedC;
        }
      }
    }
  } catch {}
}

export async function refreshGlobalCatalog(): Promise<void> {
  try {
    const [nextProducts, nextCategories] = await Promise.all([
      fetchStorefrontProducts(),
      fetchStorefrontCategories(),
    ]);
    memoryProducts = nextProducts || [];
    if (nextCategories && nextCategories.length > 0) {
      memoryCategories = nextCategories;
    }
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("nxtive_cache_products", JSON.stringify(memoryProducts));
        if (memoryCategories) {
          sessionStorage.setItem("nxtive_cache_categories", JSON.stringify(memoryCategories));
        }
      } catch {}
    }
    notifySubscribers();
  } catch (err) {
    console.warn("[useStorefrontCatalog] refresh note:", err);
  }
}

function ensureGlobalSubscriptions() {
  if (globalSubscriptionsStarted || typeof window !== "undefined" && !window) return;
  if (globalSubscriptionsStarted) return;
  globalSubscriptionsStarted = true;

  // Real-time Firestore Subscription for Products (Single shared listener)
  try {
    onSnapshot(
      collection(db, "products"),
      (snapshot: any) => {
        const liveList: Product[] = snapshot.docs
          .map((d: any) => normalizeProduct(d.id, d.data()))
          .filter((p: any): p is Product => p !== null);
        memoryProducts = liveList;
        try {
          sessionStorage.setItem("nxtive_cache_products", JSON.stringify(liveList));
        } catch {}
        notifySubscribers();
      },
      (err: any) => {
        console.warn("[useStorefrontCatalog] products subscription note:", err);
      }
    );
  } catch {}

  // Real-time Firestore Subscription for Categories (Single shared listener)
  try {
    onSnapshot(
      collection(db, "categories"),
      (snapshot: any) => {
        const liveCats: Category[] = snapshot.docs
          .map((d: any) => normalizeCategory(d.id, d.data()))
          .filter((c: any): c is Category => c !== null)
          .sort((a: any, b: any) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
        if (liveCats.length > 0) {
          memoryCategories = liveCats;
          try {
            sessionStorage.setItem("nxtive_cache_categories", JSON.stringify(liveCats));
          } catch {}
          notifySubscribers();
        }
      },
      (err: any) => {
        console.warn("[useStorefrontCatalog] categories subscription note:", err);
      }
    );
  } catch {}

  if (typeof window !== "undefined") {
    window.addEventListener("nxtive:catalog-invalidated", () => {
      refreshGlobalCatalog();
    });
  }

  // Initial fetch if memory was empty
  if (!memoryProducts || !memoryCategories) {
    refreshGlobalCatalog();
  }
}

export function useStorefrontCatalog() {
  const [products, setProducts] = useState<Product[]>(() =>
    hasHydrated && memoryProducts ? memoryProducts : []
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    hasHydrated && memoryCategories ? memoryCategories : DEFAULT_CATEGORIES
  );
  const [ready, setReady] = useState<boolean>(() =>
    hasHydrated && memoryProducts !== null
  );

  useEffect(() => {
    hasHydrated = true;
    initMemoryFromSession();
    ensureGlobalSubscriptions();

    const update = () => {
      if (memoryProducts !== null) setProducts(memoryProducts);
      if (memoryCategories !== null) setCategories(memoryCategories);
      setReady(true);
    };

    update();
    subscribers.add(update);
    return () => {
      subscribers.delete(update);
    };
  }, []);

  const refresh = useCallback(() => refreshGlobalCatalog(), []);

  return { products, categories, ready, refresh };
}
