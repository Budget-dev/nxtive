import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Truck, Clock, ShieldCheck, Box, AlertCircle, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy — NXTIVE Menswear",
  description: "Learn about NXTIVE domestic transit times, dispatch schedules, free shipping thresholds, and courier handling.",
};

export default function ShippingPolicyPage() {
  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "85vh", padding: "48px 0 90px 0" }}>
      <div className="container" style={{ maxWidth: "860px" }}>
        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#936037",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Logistics & Delivery
          </span>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#111110",
              marginBottom: "12px",
            }}
          >
            Shipping Policy
          </h1>
          <p style={{ fontSize: "14.5px", color: "#6A645C", maxWidth: "600px" }}>
            Every NXTIVE garment is inspected, packaged in custom dust sleeves, and dispatched from our primary fulfillment facility in Mumbai.
          </p>
        </div>

        {/* 3 Metric Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            marginBottom: "36px",
          }}
        >
          <div
            className="legal-card"
            style={{
              padding: "24px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.02)",
            }}
          >
            <Truck size={22} color="#936037" style={{ marginBottom: "12px" }} />
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#111110" }}>FREE Standard Delivery</div>
            <div style={{ fontSize: "12.5px", color: "#746E66", marginTop: "4px" }}>
              On all domestic orders across India over ₹999.
            </div>
          </div>

          <div
            className="legal-card"
            style={{
              padding: "24px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.02)",
            }}
          >
            <Clock size={22} color="#936037" style={{ marginBottom: "12px" }} />
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#111110" }}>Same-Day Dispatch</div>
            <div style={{ fontSize: "12.5px", color: "#746E66", marginTop: "4px" }}>
              For all orders placed before 1:00 PM IST (Mon–Sat).
            </div>
          </div>

          <div
            className="legal-card"
            style={{
              padding: "24px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.02)",
            }}
          >
            <Box size={22} color="#936037" style={{ marginBottom: "12px" }} />
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#111110" }}>Recyclable Packaging</div>
            <div style={{ fontSize: "12.5px", color: "#746E66", marginTop: "4px" }}>
              Shipped in durable, compostable matte black mailers.
            </div>
          </div>
        </div>

        {/* Detailed Shipping Table */}
        <div
          className="legal-card"
          style={{
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            overflow: "hidden",
            marginBottom: "36px",
            padding: 0,
          }}
        >
          <div style={{ padding: "20px 28px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, textTransform: "uppercase", color: "#111110" }}>
              Transit Methods & Pricing
            </h3>
          </div>

          <div className="scroll-touch" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#FAF9F5", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <th style={{ padding: "14px 28px", fontWeight: 700, color: "#111110" }}>Method</th>
                  <th style={{ padding: "14px 20px", fontWeight: 700, color: "#111110" }}>Delivery Time</th>
                  <th style={{ padding: "14px 20px", fontWeight: 700, color: "#111110" }}>Service Area</th>
                  <th style={{ padding: "14px 28px", fontWeight: 700, color: "#111110", textAlign: "right" }}>Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  <td style={{ padding: "16px 28px", fontWeight: 700, color: "#111110" }}>
                    Standard Ground (Delhivery / BlueDart)
                  </td>
                  <td style={{ padding: "16px 20px", color: "#6A645C" }}>2 – 4 Business Days</td>
                  <td style={{ padding: "16px 20px", color: "#6A645C" }}>All India (26,000+ Pin codes)</td>
                  <td style={{ padding: "16px 28px", textAlign: "right", fontWeight: 700, color: "#111110" }}>
                    FREE (Orders ≥ ₹999) / ₹99
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  <td style={{ padding: "16px 28px", fontWeight: 700, color: "#111110" }}>
                    Priority Air Express
                  </td>
                  <td style={{ padding: "16px 20px", color: "#6A645C" }}>1 – 2 Business Days</td>
                  <td style={{ padding: "16px 20px", color: "#6A645C" }}>Metro Cities & Tier 1 Hubs</td>
                  <td style={{ padding: "16px 28px", textAlign: "right", fontWeight: 700, color: "#111110" }}>
                    ₹150
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "16px 28px", fontWeight: 700, color: "#111110" }}>
                    Cash On Delivery (COD)
                  </td>
                  <td style={{ padding: "16px 20px", color: "#6A645C" }}>3 – 5 Business Days</td>
                  <td style={{ padding: "16px 20px", color: "#6A645C" }}>Serviceable COD areas (Up to ₹5,000)</td>
                  <td style={{ padding: "16px 28px", textAlign: "right", fontWeight: 700, color: "#111110" }}>
                    Standard Rate Applies
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Content Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px", fontSize: "14px", color: "#5C564E", lineHeight: "1.7" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#111110", marginBottom: "8px" }}>
              Live Tracking & Notification
            </h3>
            <p>
              Once your parcel leaves our Mumbai warehouse, you will receive an automatic dispatch notification containing your direct courier tracking link via SMS and email. You can also view real-time milestone checkpoints by visiting your{" "}
              <Link href="/orders" style={{ color: "#111110", fontWeight: 700, textDecoration: "underline" }}>
                Order History
              </Link>{" "}
              page.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#111110", marginBottom: "8px" }}>
              Package Inspection on Delivery
            </h3>
            <p>
              All shipments are secured with tamper-evident security tape. If you observe that your outer parcel has been significantly compromised, punctured, or opened prior to delivery, we request you to reject receipt or document photographs before opening and contact us within 24 hours at{" "}
              <a href="mailto:support@nxtive.com" style={{ color: "#111110", fontWeight: 700, textDecoration: "underline" }}>
                support@nxtive.com
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
