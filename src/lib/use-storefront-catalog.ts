"use client";

import { useEffect, useState, useCallback } from "react";
import type { Category, Product } from "@/types/product";
import { DEFAULT_CATEGORIES, fetchStorefrontCategories, fetchStorefrontProducts } from "@/lib/catalog";

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
      if (typeof window !== "undefined") {
        window.removeEventListener("nxtive:catalog-invalidated", handleInvalidate);
      }
    };
  }, [loadData]);

  return { products, categories, ready, refresh: loadData };
}
