import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { RefreshCw, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Truck } from "lucide-react";

export const metadata: Metadata = {
  title: "Returns & Exchanges Policy — NXTIVE Menswear",
  description: "Learn about NXTIVE 7-day domestic returns, free size exchanges, reverse pickups, and refund methods.",
};

export default function ReturnsPolicyPage() {
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
            Client Confidence
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
            Returns & Exchanges
          </h1>
          <p style={{ fontSize: "14.5px", color: "#6A645C", maxWidth: "600px" }}>
            We want you to wear your NXTIVE garments with total confidence. If your sizing isn't exact or you're unsatisfied with your piece, our 7-day domestic exchange program makes the process effortless.
          </p>
        </div>

        {/* 3 Steps Process */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "36px",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 6px 20px rgba(0,0,0,0.02)",
            marginBottom: "36px",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#111110",
              marginBottom: "24px",
            }}
          >
            How To Exchange or Return In 3 Steps
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "24px",
            }}
          >
            <div>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#111110",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "14px",
                  marginBottom: "14px",
                }}
              >
                1
              </div>
              <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#111110", marginBottom: "6px" }}>
                Initiate Request
              </h4>
              <p style={{ fontSize: "13px", color: "#6A645C", lineHeight: 1.5 }}>
                Visit your{" "}
                <Link href="/orders" style={{ color: "#111110", fontWeight: 700, textDecoration: "underline" }}>
                  Orders Page
                </Link>{" "}
                or email{" "}
                <a href="mailto:support@nxtvie.com" style={{ color: "#111110", fontWeight: 700, textDecoration: "underline" }}>
                  support@nxtvie.com
                </a>{" "}
                with your order ID and the preferred exchange size.
              </p>
            </div>

            <div>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#111110",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "14px",
                  marginBottom: "14px",
                }}
              >
                2
              </div>
              <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#111110", marginBottom: "6px" }}>
                Doorstep Reverse Pickup
              </h4>
              <p style={{ fontSize: "13px", color: "#6A645C", lineHeight: 1.5 }}>
                Our courier will arrive at your address within 24–48 hours to collect the packaged garment. No return label printing needed.
              </p>
            </div>

            <div>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#111110",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "14px",
                  marginBottom: "14px",
                }}
              >
                3
              </div>
              <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#111110", marginBottom: "6px" }}>
                Fast Inspection & Refund
              </h4>
              <p style={{ fontSize: "13px", color: "#6A645C", lineHeight: 1.5 }}>
                Once received and inspected at our studio, your replacement is dispatched immediately or your refund is credited within 5–7 business days.
              </p>
            </div>
          </div>
        </div>

        {/* Conditions Card */}
        <div
          style={{
            backgroundColor: "#FAF9F5",
            borderRadius: "14px",
            padding: "28px",
            border: "1px solid rgba(0,0,0,0.06)",
            marginBottom: "36px",
          }}
        >
          <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111110", marginBottom: "14px" }}>
            Return Criteria & Inspection Rules
          </h3>
          <ul style={{ paddingLeft: "20px", margin: 0, fontSize: "13.5px", color: "#5C564E", lineHeight: "1.7" }}>
            <li>Garments must be unwashed, unworn, and free from perfume, stains, or deodorant marks.</li>
            <li>All original designer hangtags, barcode labels, and dust pouches must remain attached and intact.</li>
            <li>Intimates, socks, or custom made-to-order capsule drops are final sale for hygiene purposes.</li>
            <li>Size exchanges are 100% complimentary on your first request per order.</li>
          </ul>
        </div>

        {/* Quick Action Button */}
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <Link
            href="/orders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#111110",
              color: "#FFFFFF",
              padding: "13px 28px",
              borderRadius: "9999px",
              fontSize: "13.5px",
              fontWeight: 700,
            }}
            className="btn-pill-dark"
          >
            <span>Go to My Orders to Request Return</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
