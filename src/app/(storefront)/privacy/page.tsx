import React from "react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — NXTIVE Menswear",
  description: "Read about how NXTIVE collects, stores, protects, and handles your personal data.",
};

export default function PrivacyPolicyPage() {
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
            Legal & Compliance
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
            Privacy Policy
          </h1>
          <div style={{ fontSize: "12.5px", color: "#8E8880" }}>
            Last Updated: September 2026 • Effective Date: September 2026
          </div>
        </div>

        {/* Legal Text Card */}
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
              1. Overview
            </h2>
            <p>
              At NXTIVE ("we", "our", or "us"), we value your trust and are committed to safeguarding your personal data. This Privacy Policy details the types of information we collect through our website (nxtive.com), our client concierge, and checkout gateways, and explains how that data is stored, processed, and respected.
            </p>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#111110", marginBottom: "10px" }}>
              2. Information We Collect
            </h2>
            <p>When you browse, register, or complete a transaction on NXTIVE, we collect:</p>
            <ul style={{ paddingLeft: "20px", marginTop: "8px" }}>
              <li>
                <strong>Identity & Contact Information:</strong> Your name, email address, delivery phone number, and residential shipping address.
              </li>
              <li>
                <strong>Account Credentials:</strong> Secure authentication tokens handled via Google Cloud Firebase Auth. We never store raw passwords.
              </li>
              <li>
                <strong>Transaction & Payment Details:</strong> Card brand, last 4 digits, and UPI IDs tokenized securely via RBI-licensed, PCI-DSS Level 1 payment partners (Razorpay). Full card numbers are never stored on our servers.
              </li>
              <li>
                <strong>Browsing & Technical Data:</strong> IP address, device type, browser metadata, and interaction events utilized to optimize page load speeds and visual experience.
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#111110", marginBottom: "10px" }}>
              3. How Your Data Is Utilized
            </h2>
            <p>Your information is used strictly to fulfill e-commerce services, including:</p>
            <ul style={{ paddingLeft: "20px", marginTop: "8px" }}>
              <li>Processing, manufacturing dispatch, and logistics delivery of your orders.</li>
              <li>Sending live SMS and email shipping updates and delivery status notifications.</li>
              <li>Providing personalized sizing recommendations and client concierge assistance.</li>
              <li>Preventing fraudulent transactions and unauthorized chargebacks.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#111110", marginBottom: "10px" }}>
              4. Third-Party Disclosures
            </h2>
            <p>
              We do not sell, rent, or monetize your personal data. We only share necessary data with trusted logistics and infrastructure partners (e.g. Delhivery, BlueDart, Razorpay, Google Firebase) strictly to process your orders and maintain website security.
            </p>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#111110", marginBottom: "10px" }}>
              5. Your Rights & Data Deletion
            </h2>
            <p>
              You maintain the right to inspect, correct, export, or request the permanent deletion of your personal data from our systems. To request deletion, please contact our Data Protection Officer at{" "}
              <a href="mailto:privacy@nxtvie.com" style={{ color: "#111110", fontWeight: 700, textDecoration: "underline" }}>
                privacy@nxtvie.com
              </a>.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#111110", marginBottom: "10px" }}>
              6. Contact Our Legal Concierge
            </h2>
            <p>
              If you have any questions regarding this policy or our data practices, reach us at{" "}
              <a href="mailto:support@nxtvie.com" style={{ color: "#111110", fontWeight: 700, textDecoration: "underline" }}>
                support@nxtvie.com
              </a>{" "}
              or by postal mail to: NXTIVE Atelier, Unit 14/B Sun Mill Compound, Lower Parel, Mumbai 400013.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
