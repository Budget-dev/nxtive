"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  DollarSign,
  Gift,
  Share2,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Send,
  Users,
  Percent,
  Calendar,
} from "lucide-react";
import { useStore } from "@/components/store-context";

export function AffiliatesClient() {
  const { showToast } = useStore();

  // Commission Calculator State
  const [estimatedSalesCount, setEstimatedSalesCount] = useState<number>(30);
  const averageOrderValue = 3200; // ₹3,200 average order
  const commissionRate = 0.12; // 12%
  const estimatedEarnings = Math.round(estimatedSalesCount * averageOrderValue * commissionRate);

  // Application Form State
  const [creatorName, setCreatorName] = useState("");
  const [creatorEmail, setCreatorEmail] = useState("");
  const [primaryPlatform, setPrimaryPlatform] = useState("Instagram");
  const [handle, setHandle] = useState("");
  const [followerCount, setFollowerCount] = useState("10k – 50k");
  const [pitch, setPitch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorName || !creatorEmail || !handle) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setSubmitted(true);
    showToast("Ambassador application received! We review profiles within 48 hours.");
  };

  const PERKS = [
    {
      icon: <Percent size={22} color="#936037" />,
      title: "10% – 15% Net Commission",
      desc: "Earn high-yield returns on every completed order made with your custom tracking link or code.",
    },
    {
      icon: <Gift size={22} color="#936037" />,
      title: "Complimentary Capsule Gifting",
      desc: "Receive complimentary garments from our unreleased seasonal drops before they go public.",
    },
    {
      icon: <Calendar size={22} color="#936037" />,
      title: "30-Day Cookie Window",
      desc: "Get credited even if your followers return and purchase up to 30 days after clicking your link.",
    },
    {
      icon: <TrendingUp size={22} color="#936037" />,
      title: "Punctual Monthly Payouts",
      desc: "Automated, transparent monthly direct deposits into your Indian or international bank account.",
    },
  ];

  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "100vh", paddingBottom: "100px" }}>
      {/* Hero Header */}
      <section
        style={{
          backgroundColor: "#111110",
          color: "#FFFFFF",
          padding: "76px 20px 92px 20px",
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
            Partnerships & Creators
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
            The NXTIVE Ambassador Program
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "#A8A29A",
              lineHeight: "1.65",
              maxWidth: "600px",
              margin: "0 auto 28px auto",
            }}
          >
            Join our curated community of fashion creators, stylists, and streetwear curators. Share your aesthetic, earn competitive commissions, and receive exclusive wardrobe drops.
          </p>

          <a
            href="#apply"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#FFFFFF",
              color: "#111110",
              padding: "12px 28px",
              borderRadius: "9999px",
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            <span>Apply For Partnership</span>
            <ArrowRight size={15} />
          </a>
        </div>
      </section>

      {/* Perks Grid */}
      <section className="container" style={{ paddingTop: "60px", paddingBottom: "40px" }}>
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
            Creator Benefits
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
            Engineered For Creative Growth
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px",
          }}
        >
          {PERKS.map((perk) => (
            <div
              key={perk.title}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "30px 24px",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 6px 20px rgba(0,0,0,0.02)",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(147, 96, 55, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                {perk.icon}
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111110", marginBottom: "8px" }}>
                {perk.title}
              </h3>
              <p style={{ fontSize: "13px", color: "#6A645C", lineHeight: "1.6", margin: 0 }}>
                {perk.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Commission Calculator */}
      <section className="container" style={{ paddingTop: "20px", paddingBottom: "50px" }}>
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "20px",
            padding: "44px 36px",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.03)",
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#936037",
              }}
            >
              Earnings Simulator
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
              Calculate Your Monthly Revenue
            </h2>
            <p style={{ fontSize: "13px", color: "#6A645C", marginTop: "4px" }}>
              Based on our average client order value of ₹3,200 and baseline 12% creator commission.
            </p>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#111110" }}>
                Estimated Monthly Orders Driven:
              </span>
              <span style={{ fontSize: "18px", fontWeight: 900, color: "#936037" }}>
                {estimatedSalesCount} Orders
              </span>
            </div>

            <input
              type="range"
              min={5}
              max={150}
              step={5}
              value={estimatedSalesCount}
              onChange={(e) => setEstimatedSalesCount(Number(e.target.value))}
              style={{
                width: "100%",
                accentColor: "#111110",
                cursor: "pointer",
                height: "6px",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8E8880", marginTop: "6px" }}>
              <span>5 Orders/mo</span>
              <span>75 Orders/mo</span>
              <span>150+ Orders/mo</span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#FAF9F5",
              borderRadius: "14px",
              padding: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <div>
              <div style={{ fontSize: "11.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666" }}>
                Estimated Monthly Payout
              </div>
              <div style={{ fontSize: "36px", fontWeight: 900, color: "#111110", marginTop: "4px" }}>
                ₹{estimatedEarnings.toLocaleString("en-IN")}
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#888" }}> / month</span>
              </div>
            </div>

            <a
              href="#apply"
              style={{
                padding: "12px 24px",
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
              Start Earning
            </a>
          </div>
        </div>
      </section>

      {/* 3 Step Process */}
      <section className="container" style={{ paddingBottom: "50px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#936037",
            }}
          >
            Simple Workflow
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
            How The Program Works
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "24px",
          }}
        >
          {[
            {
              step: "01",
              title: "Apply & Get Approved",
              desc: "Fill in our short application form with your social channels. Our partnerships team reviews aesthetic alignment within 48 hours.",
            },
            {
              step: "02",
              title: "Share Your Link & Code",
              desc: "Receive your exclusive tracking link and custom promo code (e.g. YOURNAME10) to share in Instagram bios, reels, TikToks, and YouTube descriptions.",
            },
            {
              step: "03",
              title: "Earn Payouts & Free Drops",
              desc: "Get real-time tracking on conversions. Receive monthly bank deposits alongside complimentary boxes from upcoming seasonal capsule releases.",
            },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "32px 28px",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 900,
                  color: "#936037",
                  fontFamily: "var(--font-heading), sans-serif",
                  marginBottom: "12px",
                }}
              >
                {item.step}
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#111110", marginBottom: "8px" }}>
                {item.title}
              </h3>
              <p style={{ fontSize: "13px", color: "#6A645C", lineHeight: "1.65", margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="container" style={{ maxWidth: "700px" }}>
        <div
          className="info-card"
          style={{
            borderRadius: "20px",
            padding: "clamp(20px, 4vw, 40px)",
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
              Become A Partner
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
              Ambassador Application
            </h2>
            <p style={{ fontSize: "13px", color: "#6A645C", marginTop: "4px" }}>
              Tell us about your platforms and style aesthetic.
            </p>
          </div>

          {submitted ? (
            <div style={{ textAlign: "center", padding: "30px 20px" }}>
              <CheckCircle2 size={44} color="#2B9348" style={{ margin: "0 auto 14px auto" }} />
              <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#111110", marginBottom: "6px" }}>
                Application Dispatched
              </h3>
              <p style={{ fontSize: "13.5px", color: "#666", maxWidth: "460px", margin: "0 auto" }}>
                Thank you, {creatorName}. Our partnerships team will review your channel ({handle}) and reach out via email with your affiliate portal details.
              </p>
            </div>
          ) : (
            <form onSubmit={handleApplication}>
              <div className="form-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "4px" }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="Vikram Mehta"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "4px" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={creatorEmail}
                    onChange={(e) => setCreatorEmail(e.target.value)}
                    placeholder="vikram@creator.com"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div className="form-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "4px" }}>
                    Primary Social Platform
                  </label>
                  <select
                    value={primaryPlatform}
                    onChange={(e) => setPrimaryPlatform(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13px", backgroundColor: "#FFFFFF" }}
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="YouTube">YouTube</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Pinterest">Pinterest</option>
                    <option value="Fashion Blog / Editorial">Fashion Blog / Editorial</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "4px" }}>
                    Handle / Channel URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="@vikramstyle or URL"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "4px" }}>
                  Estimated Audience Size
                </label>
                <select
                  value={followerCount}
                  onChange={(e) => setFollowerCount(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13px", backgroundColor: "#FFFFFF" }}
                >
                  <option value="1k – 10k">1,000 – 10,000 (Micro Curator)</option>
                  <option value="10k – 50k">10,000 – 50,000</option>
                  <option value="50k – 200k">50,000 – 200,000</option>
                  <option value="200k+">200,000+</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "4px" }}>
                  How do you plan to style and feature NXTIVE?
                </label>
                <textarea
                  rows={3}
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  placeholder="Share a short note on your aesthetic, outfit styling reels, lookbooks, or unboxings..."
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
                <span>{isSubmitting ? "Submitting Application…" : "Submit Partnership Application"}</span>
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
