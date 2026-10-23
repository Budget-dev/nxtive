"use client";

import { useEffect, useState } from "react";
import type { Category, Product } from "@/types/product";
import { DEFAULT_CATEGORIES, fetchStorefrontCategories, fetchStorefrontProducts } from "@/lib/catalog";

const INITIAL_PRODUCTS: Product[] = [];

export function useStorefrontCatalog() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchStorefrontProducts(), fetchStorefrontCategories()]).then(([nextProducts, nextCategories]) => {
      if (cancelled) return;
      setProducts(nextProducts || []);
      if (nextCategories && nextCategories.length > 0) setCategories(nextCategories);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, categories, ready };
}
