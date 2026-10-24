"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchStorefrontProducts(), fetchStorefrontCategories()]).then(([nextProducts, nextCategories]) => {
      if (cancelled) return;
      memoryProducts = nextProducts || [];
      if (nextCategories && nextCategories.length > 0) {
        memoryCategories = nextCategories;
      }
      setProducts(memoryProducts);
      setCategories(memoryCategories || DEFAULT_CATEGORIES);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, categories, ready };
}
