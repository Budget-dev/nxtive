"use client";

import { useEffect, useState } from "react";
import type { Category, Product } from "@/types/product";
import { fetchStorefrontCategories, fetchStorefrontProducts } from "@/lib/catalog";

export function useStorefrontCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchStorefrontProducts(), fetchStorefrontCategories()]).then(([nextProducts, nextCategories]) => {
      if (cancelled) return;
      setProducts(nextProducts);
      setCategories(nextCategories);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, categories, ready };
}
