import React, { Suspense } from "react";
import { EditProductClient } from "@/features/admin-dashboard/components/edit-product-client";

export const metadata = {
  title: "Edit Apparel Item | NXTIVE Admin",
};

export default function EditProductPage() {
  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 0", textAlign: "center" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "3px solid #E8E5DF",
              borderTopColor: "#121110",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: "14px", fontWeight: 600 }}>Loading edit view...</div>
        </div>
      }
    >
      <EditProductClient />
    </Suspense>
  );
}

