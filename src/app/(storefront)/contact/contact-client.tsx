"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { useStore } from "@/components/store-context";

export function ContactClient() {
  const { showToast } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [subject, setSubject] = useState("Order Status & Tracking");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      showToast("Your message has been sent to NXTIVE Concierge.");
    }, 700);
  };

  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "85vh", padding: "48px 0 90px 0" }}>
      <div className="container" style={{ maxWidth: "1060px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
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
            Client Services
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
            Get In Touch
          </h1>
          <p style={{ fontSize: "14.5px", color: "#6A645C", maxWidth: "560px", margin: "0 auto" }}>
            Have a question regarding sizing, order fulfillment, or product care? Our studio team is here to assist.
          </p>
        </div>

        {/* Two-Column Grid: Form & Info */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "36px",
            alignItems: "start",
          }}
          className="contact-grid"
        >
          {/* Left: Interactive Contact Form */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "36px",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
            }}
          >
            {submitted ? (
              <div style={{ textAlign: "center", padding: "40px 10px" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(43, 147, 72, 0.1)",
                    color: "#2B9348",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px auto",
                  }}
                >
                  <CheckCircle2 size={30} strokeWidth={2.2} />
                </div>
                <h3 style={{ fontSize: "22px", fontWeight: 800, textTransform: "uppercase", color: "#111110", marginBottom: "8px" }}>
                  Message Received
                </h3>
                <p style={{ fontSize: "13.5px", color: "#6A645C", lineHeight: 1.6, marginBottom: "24px" }}>
                  Thank you, <strong>{name}</strong>. A dedicated NXTIVE specialist will respond to{" "}
                  <strong>{email}</strong> within 12–24 hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setMessage("");
                  }}
                  style={{
                    backgroundColor: "#111110",
                    color: "#FFFFFF",
                    padding: "11px 24px",
                    borderRadius: "9999px",
                    fontSize: "13px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="form-name-row">
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#4E4942", display: "block", marginBottom: "6px" }}>
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Kabir Sen"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: "8px",
                        border: "1px solid rgba(0,0,0,0.12)",
                        fontSize: "13.5px",
                        outline: "none",
                        backgroundColor: "#FAF9F6",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#4E4942", display: "block", marginBottom: "6px" }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="kabir@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: "8px",
                        border: "1px solid rgba(0,0,0,0.12)",
                        fontSize: "13.5px",
                        outline: "none",
                        backgroundColor: "#FAF9F6",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="form-subject-row">
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#4E4942", display: "block", marginBottom: "6px" }}>
                      Subject *
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: "8px",
                        border: "1px solid rgba(0,0,0,0.12)",
                        fontSize: "13.5px",
                        outline: "none",
                        backgroundColor: "#FAF9F6",
                        cursor: "pointer",
                      }}
                    >
                      <option>Order Status & Tracking</option>
                      <option>Sizing & Fit Advice</option>
                      <option>Returns & Exchanges</option>
                      <option>Custom Capsule Drops</option>
                      <option>Press & Partnerships</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#4E4942", display: "block", marginBottom: "6px" }}>
                      Order # (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NX-2026-94812"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: "8px",
                        border: "1px solid rgba(0,0,0,0.12)",
                        fontSize: "13.5px",
                        outline: "none",
                        backgroundColor: "#FAF9F6",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#4E4942", display: "block", marginBottom: "6px" }}>
                    How can we help? *
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Tell us about your sizing inquiry, shipment question, or feedback..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(0,0,0,0.12)",
                      fontSize: "13.5px",
                      outline: "none",
                      backgroundColor: "#FAF9F6",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    backgroundColor: "#111110",
                    color: "#FFFFFF",
                    padding: "13px 28px",
                    borderRadius: "9999px",
                    fontSize: "13.5px",
                    fontWeight: 700,
                    border: "none",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    opacity: isSubmitting ? 0.7 : 1,
                    transition: "all 0.2s ease",
                  }}
                  className="btn-pill-dark"
                >
                  <Send size={15} />
                  <span>{isSubmitting ? "Transmitting..." : "Send Message to Concierge"}</span>
                </button>
              </form>
            )}
          </div>

          {/* Right: Studio Details & Direct Channels */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Contact Info Card */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "30px",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: 800, textTransform: "uppercase", color: "#111110", marginBottom: "20px" }}>
                Direct Channels
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", gap: "14px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      backgroundColor: "var(--bg-sand)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: "#111110",
                    }}
                  >
                    <Mail size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#8E8880", textTransform: "uppercase" }}>
                      Customer Support
                    </div>
                    <a
                      href="mailto:support@nxtvie.com"
                      style={{ fontSize: "14px", fontWeight: 700, color: "#111110", textDecoration: "underline" }}
                    >
                      support@nxtvie.com
                    </a>
                    <div style={{ fontSize: "12px", color: "#746E66", marginTop: "2px" }}>
                      Expected response within 12 hours
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "14px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      backgroundColor: "var(--bg-sand)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: "#111110",
                    }}
                  >
                    <Phone size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#8E8880", textTransform: "uppercase" }}>
                      WhatsApp & Concierge
                    </div>
                    <a
                      href="tel:+919820199882"
                      style={{ fontSize: "14px", fontWeight: 700, color: "#111110", textDecoration: "underline" }}
                    >
                      +91 98201 99882
                    </a>
                    <div style={{ fontSize: "12px", color: "#746E66", marginTop: "2px" }}>
                      Mon – Sat, 10:00 AM – 7:00 PM IST
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "14px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      backgroundColor: "var(--bg-sand)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: "#111110",
                    }}
                  >
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#8E8880", textTransform: "uppercase" }}>
                      Mumbai Studio Atelier
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#111110", lineHeight: "1.5" }}>
                      Unit 14/B, Sun Mill Compound,
                      <br />
                      Lower Parel, Mumbai 400013
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick FAQ Prompt */}
            <div
              style={{
                backgroundColor: "#161514",
                color: "#FFFFFF",
                borderRadius: "16px",
                padding: "26px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <MessageSquare size={18} color="#C59B74" />
                <span style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase" }}>
                  Instant Answers
                </span>
              </div>
              <p style={{ fontSize: "12.5px", color: "#A8A29A", lineHeight: 1.5, marginBottom: "16px" }}>
                Looking for immediate guidance on sizing charts, COD payment options, or our 7-day domestic returns?
              </p>
              <Link
                href="/faq"
                style={{
                  display: "inline-block",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  textDecoration: "underline",
                }}
              >
                Visit FAQ Knowledge Base →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
          }
          .form-name-row,
          .form-subject-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
