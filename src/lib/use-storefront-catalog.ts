"use client";

import { useEffect, useState, useCallback } from "react";
import type { Category, Product } from "@/types/product";
import { DEFAULT_CATEGORIES, fetchStorefrontCategories, fetchStorefrontProducts, normalizeProduct, normalizeCategory } from "@/lib/catalog";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

// Client-side instant memory store so page transitions happen in 0ms
let memoryProducts: Product[] | null = null;
let memoryCategories: Category[] | null = null;

export function useStorefrontCatalog() {
  const [products, setProducts] = useState<Product[]>(() => {
    if (memoryProducts !== null) return memoryProducts;
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("nxtive_cache_products");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            memoryProducts = parsed;
            return parsed;
          }
        }
      } catch {}
    }
    return [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    if (memoryCategories !== null && memoryCategories.length > 0) return memoryCategories;
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("nxtive_cache_categories");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            memoryCategories = parsed;
            return parsed;
          }
        }
      } catch {}
    }
    return DEFAULT_CATEGORIES;
  });

  const [ready, setReady] = useState<boolean>(() => {
    return memoryProducts !== null;
  });

  const loadData = useCallback(() => {
    return Promise.all([fetchStorefrontProducts(), fetchStorefrontCategories()]).then(
      ([nextProducts, nextCategories]) => {
        memoryProducts = nextProducts || [];
        if (nextCategories && nextCategories.length > 0) {
          memoryCategories = nextCategories;
        }
        setProducts(memoryProducts);
        setCategories(memoryCategories || DEFAULT_CATEGORIES);
        setReady(true);
      }
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadData();

    // 1. Direct Realtime Firestore Subscription for Products (key-based Web SDK)
    let unsubProducts: (() => void) | null = null;
    let unsubCategories: (() => void) | null = null;

    try {
      unsubProducts = onSnapshot(collection(db, "products"), (snapshot: any) => {
        if (cancelled) return;
        const liveList: Product[] = snapshot.docs
          .map((d: any) => normalizeProduct(d.id, d.data()))
          .filter((p: any): p is Product => p !== null);
        memoryProducts = liveList;
        setProducts(liveList);
        setReady(true);
        try {
          sessionStorage.setItem("nxtive_cache_products", JSON.stringify(liveList));
        } catch {}
      }, (err: any) => {
        console.warn("[useStorefrontCatalog] products onSnapshot note:", err);
      });
    } catch {}

    // 2. Direct Realtime Firestore Subscription for Categories
    try {
      unsubCategories = onSnapshot(collection(db, "categories"), (snapshot: any) => {
        if (cancelled) return;
        const liveCats: Category[] = snapshot.docs
          .map((d: any) => normalizeCategory(d.id, d.data()))
          .filter((c: any): c is Category => c !== null)
          .sort((a: any, b: any) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
        if (liveCats.length > 0) {
          memoryCategories = liveCats;
          setCategories(liveCats);
          try {
            sessionStorage.setItem("nxtive_cache_categories", JSON.stringify(liveCats));
          } catch {}
        }
      }, (err: any) => {
        console.warn("[useStorefrontCatalog] categories onSnapshot note:", err);
      });
    } catch {}

    const handleInvalidate = () => {
      if (cancelled) return;
      memoryProducts = null;
      memoryCategories = null;
      loadData();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("nxtive:catalog-invalidated", handleInvalidate);
    }

    return () => {
      cancelled = true;
      if (unsubProducts) unsubProducts();
      if (unsubCategories) unsubCategories();
      if (typeof window !== "undefined") {
        window.removeEventListener("nxtive:catalog-invalidated", handleInvalidate);
      }
    };
  }, [loadData]);

  return { products, categories, ready, refresh: loadData };
}
