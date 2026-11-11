"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { normalizeProduct } from "@/lib/catalog";
import type { Product } from "@/types/product";
import { ProductForm } from "./product-form";
import { AdminDataState } from "@/app/(admin)/admin/_components/admin-data-state";
import { ArrowLeft } from "lucide-react";

interface EditProductClientProps {
  productId?: string;
}

export function EditProductClient({ productId }: EditProductClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Extract ID from prop, search param (?id=...), or URL segment (/admin/products/[id])
  const resolvedId =
    productId ||
    searchParams?.get("id") ||
    pathname?.split("/").filter(Boolean).pop();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchProduct() {
      if (!resolvedId || resolvedId === "edit" || resolvedId === "products") {
        if (isMounted) {
          setError("No product identifier was provided.");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1. Direct doc lookup by ID in Firestore
        const docRef = doc(db, "products", resolvedId);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const norm = normalizeProduct(snap.id, snap.data());
          if (norm && isMounted) {
            setProduct(norm);
            setLoading(false);
            return;
          }
        }

        // 2. Query fallback (by slug or search all docs)
        const allSnap = await getDocs(collection(db, "products"));
        const matchedDoc = (allSnap.docs as any[]).find((d: any) => {
          const data = d.data();
          return (
            d.id === resolvedId ||
            data.slug === resolvedId ||
            data.id === resolvedId ||
            (data.sku && data.sku === resolvedId)
          );
        });

        if (matchedDoc) {
          const norm = normalizeProduct(matchedDoc.id, matchedDoc.data());
          if (norm && isMounted) {
            setProduct(norm);
            setLoading(false);
            return;
          }
        }

        // 3. Fallback to /api/products
        try {
          const apiRes = await fetch("/api/products");
          const contentType = apiRes.headers.get("content-type") || "";
          if (apiRes.ok && contentType.includes("application/json")) {
            const apiData = await apiRes.json();
            const list: Product[] = apiData.products || [];
            const found = list.find(
              (p) =>
                p.id === resolvedId ||
                p.slug === resolvedId ||
                (p.sku && p.sku === resolvedId)
            );
            if (found && isMounted) {
              setProduct(found);
              setLoading(false);
              return;
            }
          }
        } catch {
          // Ignore API error
        }

        if (isMounted) {
          setError(`Product "${resolvedId}" was not found in Firestore.`);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("[EditProductClient] Error loading product:", err);
        if (isMounted) {
          setError(err?.message || "Failed to load product from Firestore.");
          setLoading(false);
        }
      }
    }

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [resolvedId]);

  if (loading) {
    return (
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <Link href="/admin/products" className="admin-btn-secondary admin-btn-sm">
            <ArrowLeft size={14} /> Back to Products
          </Link>
        </div>
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid var(--adm-border)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "3px solid #E8E5DF",
              borderTopColor: "#121110",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--adm-text)" }}>
            Loading apparel item details...
          </div>
          <div style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>
            Connecting to Firestore catalog
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <Link href="/admin/products" className="admin-btn-secondary admin-btn-sm">
            <ArrowLeft size={14} /> Back to Products
          </Link>
        </div>
        <AdminDataState
          title="Product Unavailable"
          message={error || "The requested clothing item could not be found."}
          actionLabel="Return to Product Catalog"
          onAction={() => router.push("/admin/products")}
        />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--adm-text)" }}>
          Edit: {product.title}
        </h2>
        <p style={{ fontSize: "0.82rem", color: "var(--adm-text-muted)" }}>
          Modify apparel details, stock levels, size guide, and retail price.
        </p>
      </div>

      <ProductForm initialProduct={product} isEdit={true} />
    </div>
  );
}

