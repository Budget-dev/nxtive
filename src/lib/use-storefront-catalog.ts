"use client";

import { useEffect, useState } from "react";
import type { Category, Product } from "@/types/product";
import { DEFAULT_CATEGORIES, fetchStorefrontCategories, fetchStorefrontProducts } from "@/lib/catalog";
import { MOCK_PRODUCTS } from "@/constants/mock-products";

const INITIAL_PRODUCTS: Product[] = MOCK_PRODUCTS.map((prod) => ({
  ...prod,
  isActive: true,
}));

export function useStorefrontCatalog() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [ready, setReady] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchStorefrontProducts(), fetchStorefrontCategories()]).then(([nextProducts, nextCategories]) => {
      if (cancelled) return;
      if (nextProducts && nextProducts.length > 0) setProducts(nextProducts);
      if (nextCategories && nextCategories.length > 0) setCategories(nextCategories);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, categories, ready };
}

