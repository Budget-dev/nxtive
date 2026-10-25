"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Newspaper,
  Download,
  ExternalLink,
  Mail,
  ArrowRight,
  Sparkles,
  Camera,
  FileText,
  Send,
  CheckCircle2,
} from "lucide-react";
import { useStore } from "@/components/store-context";

interface PressFeature {
  publication: string;
  headline: string;
  quote: string;
  date: string;
  author: string;
  url: string;
  badge?: string;
}

const PRESS_FEATURES: PressFeature[] = [
  {
    publication: "GQ MAGAZINE",
    headline: "The 280 GSM Heavyweight Oversized Tee Every Wardrobe Demands",
    quote:
      "NXTIVE has captured the elusive sweet spot of minimalist menswear: heavyweight Japanese streetwear aesthetics manufactured with boutique Indian textile precision.",
    date: "September 2026",
    author: "Fashion & Culture Desk",
    url: "https://www.gqindia.com",
    badge: "Editor's Pick",
  },
  {
    publication: "VOGUE INDIA",
    headline: "The Rise of Quiet Streetwear: How NXTIVE Is Redefining Everyday Drapes",
    quote:
      "Rejecting loud logos in favor of impeccable dropped shoulders, custom-dyed earth tones, and compostable packaging, NXTIVE represents a new dawn for conscious Indian menswear.",
    date: "August 2026",
    author: "Style & Sustainability Editor",
    url: "https://www.vogue.in",
    badge: "Sustainability Spotlight",
  },
  {
    publication: "HIGHSNOBIETY",
    headline: "Substance Over Logos: Discovering NXTIVE's Raw Minimalism",
    quote:
      "Dense 380 GSM loopback cotton, zero microplastics, and an uncompromising dedication to Asian diaspora streetwear proportions. A brand to watch globally.",
    date: "June 2026",
    author: "International Footwear & Apparel",
    url: "https://www.highsnobiety.com",
  },
  {
    publication: "HYPEBEAST",
    headline: "NXTIVE Autumn/Winter Capsule Delivers Heavyweight Boxy Essentials",
    quote:
      "Clean lines, structured collar tension, and articulated utility pockets. NXTIVE delivers high-fashion drapes without the luxury markup.",
    date: "May 2026",
    author: "Style Editorial",
    url: "https://hypebeast.com",
  },
  {
    publication: "GRAZIA",
    headline: "10 Emerging Streetwear Labels You Need on Your Radar",
    quote:
      "From Tirupur organic cotton mills to metropolitan streets, NXTIVE's architectural silhouettes have become an instant cult favorite among fashion stylists.",
    date: "March 2026",
    author: "Trends Desk",
    url: "https://www.grazia.co.in",
  },
  {
    publication: "ELLE MAN",
    headline: "The Modern Uniform: Boxy Cuts and Earth Tones",
    quote:
      "NXTIVE has engineered the definitive weekend capsule. Effortless, tactile, and crafted for real longevity.",
    date: "February 2026",
    author: "Menswear Features",
    url: "https://elle.in",
  },
];

const PRESS_RELEASES = [
  {
    title: "NXTIVE Launches Autumn/Winter Capsule in 380 GSM Loopback Organic Terry",
    date: "October 12, 2026",
    summary:
      "NXTIVE unveils its most ambitious drop to date: seven heavyweight silhouettes dyed in proprietary mineral pigments, featuring reinforced double-layer hoods and articulated ripstop utility bottoms.",
  },
  {
    title: "NXTIVE Eliminates 100% of Single-Use Plastic in Domestic Shipping",
    date: "August 04, 2026",
    summary:
      "Transitioning all fulfillment to certified home-compostable cornstarch mailers and FSC kraft dust sleeves, reducing warehouse plastic footprint to absolute zero.",
  },
  {
    title: "NXTIVE Expands Direct-to-Consumer Distribution with Same-Day Metro Dispatch",
    date: "May 18, 2026",
    summary:
      "Scaling Mumbai and Bengaluru logistics hubs to provide guaranteed 24–48 hour express deliveries for metro consumers nationwide.",
  },
];

export function PressClient() {
  const { showToast } = useStore();
  const [prName, setPrName] = useState("");
  const [prPublication, setPrPublication] = useState("");
  const [prEmail, setPrEmail] = useState("");
  const [prMessage, setPrMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handlePrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prName || !prEmail || !prMessage) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setSubmitted(true);
    showToast("Press inquiry sent! Our PR team will respond within 24 hours.");
  };

  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "100vh", paddingBottom: "100px" }}>
      {/* Hero Header */}
      <section
        style={{
          backgroundColor: "#111110",
          color: "#FFFFFF",
          padding: "76px 20px 88px 20px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.08,
            backgroundImage: "radial-gradient(#FFFFFF 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="container" style={{ position: "relative", zIndex: 1, maxWidth: "780px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#936037",
              display: "inline-block",
              marginBottom: "12px",
            }}
          >
            Editorial & Media
          </span>
          <h1
            style={{
              fontSize: "clamp(30px, 4.5vw, 44px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            NXTIVE In The Spotlight
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "#A8A29A",
              lineHeight: "1.65",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Read what global style editors, menswear journalists, and fashion critics are saying about our architectural drapes and conscious craftsmanship.
          </p>
        </div>
      </section>

      {/* Featured Quotes Grid */}
      <section className="container" style={{ paddingTop: "56px", paddingBottom: "50px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#936037",
            }}
          >
            Critical Acclaim
          </span>
          <h2
            style={{
              fontSize: "26px",
              fontWeight: 900,
              textTransform: "uppercase",
              color: "#111110",
              marginTop: "6px",
            }}
          >
            Selected Press Features
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {PRESS_FEATURES.map((item) => (
            <div
              key={item.publication}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "32px 28px",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 6px 20px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 900,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#111110",
                      fontFamily: "var(--font-heading), sans-serif",
                    }}
                  >
                    {item.publication}
                  </span>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        padding: "3px 8px",
                        borderRadius: "9999px",
                        backgroundColor: "rgba(147, 96, 55, 0.12)",
                        color: "#936037",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111110", lineHeight: "1.4", marginBottom: "12px" }}>
                  {item.headline}
                </h3>

                <p
                  style={{
                    fontSize: "13px",
                    color: "#554F47",
                    lineHeight: "1.7",
                    fontStyle: "italic",
                    borderLeft: "2px solid #936037",
                    paddingLeft: "12px",
                    margin: "0 0 20px 0",
                  }}
                >
                  “{item.quote}”
                </p>
              </div>

              <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11.5px", color: "#8E8880" }}>
                <span>{item.author} • {item.date}</span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#111110",
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>Read Article</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Press Releases & Media Kit */}
      <section className="container" style={{ paddingBottom: "50px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "36px",
          }}
          className="responsive-split-grid"
        >
          {/* Left: Press Release Archive */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "18px",
              padding: "36px",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 4px 18px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <Newspaper size={18} color="#936037" />
              <h3 style={{ fontSize: "18px", fontWeight: 900, textTransform: "uppercase", color: "#111110", margin: 0 }}>
                Press Releases
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
              {PRESS_RELEASES.map((pr) => (
                <div key={pr.title} style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "18px" }}>
                  <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#936037", textTransform: "uppercase", marginBottom: "4px" }}>
                    {pr.date}
                  </div>
                  <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#111110", marginBottom: "6px" }}>
                    {pr.title}
                  </h4>
                  <p style={{ fontSize: "12.5px", color: "#6A645C", lineHeight: "1.6", margin: 0 }}>
                    {pr.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Media Kit Download & Brand Assets */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "18px",
                padding: "32px",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 4px 18px rgba(0,0,0,0.02)",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 900, textTransform: "uppercase", color: "#111110", marginBottom: "12px" }}>
                Brand Assets & Media Kit
              </h3>
              <p style={{ fontSize: "13px", color: "#666", lineHeight: "1.6", marginBottom: "20px" }}>
                Download high-resolution vector logos (SVG/PNG), seasonal lookbook photography, color tokens, and founder biographies for publication.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { name: "Brand Guidelines & Color Spec (PDF)", size: "4.2 MB" },
                  { name: "High-Res Vector Logos (SVG / PNG)", size: "1.8 MB" },
                  { name: "Autumn/Winter Lookbook Editorial Stills", size: "28.4 MB" },
                ].map((asset) => (
                  <div
                    key={asset.name}
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      backgroundColor: "#FAF9F5",
                      border: "1px solid rgba(0,0,0,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "12.5px",
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "#111110" }}>{asset.name}</span>
                    <span style={{ fontSize: "11px", color: "#8E8880" }}>{asset.size}</span>
                  </div>
                ))}
              </div>

              <a
                href="mailto:press@nxtive.com?subject=Media%20Kit%20Request%20%E2%80%94%20NXTIVE"
                style={{
                  marginTop: "20px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "12px",
                  borderRadius: "9999px",
                  backgroundColor: "#111110",
                  color: "#FFFFFF",
                  fontSize: "12.5px",
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                <Download size={14} />
                <span>Request Full Press Kit</span>
              </a>
            </div>

            {/* Editorial Pull Box */}
            <div
              style={{
                backgroundColor: "#111110",
                color: "#FFFFFF",
                borderRadius: "18px",
                padding: "28px",
              }}
            >
              <h4 style={{ fontSize: "15px", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.04em" }}>
                Stylist & Editorial Pulls
              </h4>
              <p style={{ fontSize: "12.5px", color: "#A8A29A", lineHeight: "1.6", marginBottom: "16px" }}>
                We provide garment samples for approved print publications, music videos, celebrity styling, and fashion shoots across Mumbai and Delhi.
              </p>
              <div style={{ fontSize: "12.5px", color: "#FFFFFF", fontWeight: 700 }}>
                Direct Concierge: <a href="mailto:press@nxtive.com" style={{ color: "#936037", textDecoration: "underline" }}>press@nxtive.com</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Media Inquiries Form */}
      <section className="container" style={{ maxWidth: "720px", paddingTop: "10px" }}>
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "20px",
            padding: "40px",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 6px 24px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#936037",
              }}
            >
              Get In Touch
            </span>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 900,
                textTransform: "uppercase",
                color: "#111110",
                marginTop: "6px",
              }}
            >
              Media & Press Inquiries
            </h2>
            <p style={{ fontSize: "13px", color: "#6A645C", marginTop: "4px" }}>
              For interview requests, podcast appearances, and feature quotes, submit your brief below.
            </p>
          </div>

          {submitted ? (
            <div style={{ textAlign: "center", padding: "30px 20px" }}>
              <CheckCircle2 size={44} color="#2B9348" style={{ margin: "0 auto 14px auto" }} />
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#111110", marginBottom: "6px" }}>
                Inquiry Dispatched
              </h3>
              <p style={{ fontSize: "13.5px", color: "#666" }}>
                Thank you, {prName}. Our PR and communications team will get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handlePrSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "4px" }}>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={prName}
                    onChange={(e) => setPrName(e.target.value)}
                    placeholder="Rhea Kapoor"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "4px" }}>
                    Publication / Outlet *
                  </label>
                  <input
                    type="text"
                    required
                    value={prPublication}
                    onChange={(e) => setPrPublication(e.target.value)}
                    placeholder="Vogue India / Independent Stylist"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "4px" }}>
                  Work Email *
                </label>
                <input
                  type="email"
                  required
                  value={prEmail}
                  onChange={(e) => setPrEmail(e.target.value)}
                  placeholder="rhea@publication.com"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13px" }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "4px" }}>
                  Inquiry Brief / Deadline *
                </label>
                <textarea
                  rows={4}
                  required
                  value={prMessage}
                  onChange={(e) => setPrMessage(e.target.value)}
                  placeholder="Tell us about your upcoming editorial story, sample loan dates, or interview questions..."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13px", resize: "vertical" }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "9999px",
                  backgroundColor: "#111110",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Send size={14} />
                <span>{isSubmitting ? "Dispatching..." : "Submit Press Request"}</span>
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
