import React from "react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — NXTIVE Menswear",
  description: "Terms and conditions governing the purchase, browsing, and use of NXTIVE services and products.",
};

export default function TermsOfServicePage() {
  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "85vh", padding: "48px 0 90px 0" }}>
      <div className="container" style={{ maxWidth: "800px" }}>
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
            Terms & Conditions
          </span>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#111110",
              marginBottom: "10px",
            }}
          >
            Terms of Service
          </h1>
          <div style={{ fontSize: "12.5px", color: "#8E8880" }}>
            Last Updated: September 2026 • Effective Date: September 2026
          </div>
        </div>

        {/* Legal Card */}
        <div
          className="legal-card"
          style={{
            padding: "clamp(20px, 4vw, 40px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
            fontSize: "14px",
            color: "#554F47",
            lineHeight: "1.75",
          }}
        >
          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#111110", marginBottom: "10px" }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, or purchasing products on NXTIVE ("nxtive.com"), you agree to be legally bound by these Terms of Service, our Privacy Policy, and our Shipping and Returns guidelines. If you do not agree to all provisions, you should refrain from using our platforms.
            </p>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#111110", marginBottom: "10px" }}>
              2. Intellectual Property
            </h2>
            <p>
              All trademarks, product designs, garment typography, campaign photographs, lookbook layouts, and digital code are the exclusive property of NXTIVE Apparel. Reproduction, reverse engineering, redistribution, or commercial use of our media without explicit written authorization is strictly prohibited.
            </p>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#111110", marginBottom: "10px" }}>
              3. Pricing, Taxes & Availability
            </h2>
            <p>
              All prices displayed on NXTIVE are in Indian Rupees (₹ INR) and include applicable Goods and Services Tax (GST) unless explicitly noted otherwise. We reserve the right to revise pricing, discontinue colorways, or limit purchase quantities on limited-edition capsule drops without prior notice.
            </p>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#111110", marginBottom: "10px" }}>
              4. Order Confirmation & Fraud Verification
            </h2>
            <p>
              Receipt of an electronic order confirmation does not signify our final acceptance of your order. NXTIVE reserves the right to decline or cancel any order suspected of fraudulent activity, unauthorized coupon manipulation, reselling, or inventory discrepancies. In the event of cancellation, all charged amounts will be refunded immediately.
            </p>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#111110", marginBottom: "10px" }}>
              5. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms and any dispute or claim arising out of your purchases shall be governed by and construed in accordance with the laws of India. Any legal proceedings shall be subject to the exclusive jurisdiction of the competent courts in Mumbai, Maharashtra, India.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#111110", marginBottom: "10px" }}>
              6. Client Care Contact
            </h2>
            <p>
              For legal inquiries or customer clarifications, contact us via email at{" "}
              <a href="mailto:support@nxtvie.com" style={{ color: "#111110", fontWeight: 700, textDecoration: "underline" }}>
                support@nxtvie.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
