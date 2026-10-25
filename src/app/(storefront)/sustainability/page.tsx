import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import {
  Leaf,
  Droplets,
  Recycle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  HeartHandshake,
  Shirt,
  Compass,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Sustainability & Conscious Craft — NXTIVE Menswear",
  description:
    "Learn about NXTIVE sustainable practices: 100% GOTS organic cotton, closed-loop dyeing, zero-plastic compostable packaging, and ethical boutique mills.",
};

export default function SustainabilityPage() {
  const PILLARS = [
    {
      icon: <Leaf size={24} color="#2B9348" />,
      title: "100% GOTS Organic Cotton",
      stat: "Zero Synthetic Pesticides",
      description:
        "We source certified organic long-staple cotton cultivated without harmful pesticides or synthetic fertilizers, protecting agricultural soil and farm communities.",
    },
    {
      icon: <Droplets size={24} color="#0077B6" />,
      title: "Closed-Loop Reactive Dyeing",
      stat: "45% Less Water Usage",
      description:
        "Our dyeing houses recycle process water through advanced reverse-osmosis filtration, preventing toxic runoff and saving millions of liters annually.",
    },
    {
      icon: <Recycle size={24} color="#936037" />,
      title: "Zero-Plastic Circular Packaging",
      stat: "100% Home Compostable",
      description:
        "Every garment ships in plant-derived cornstarch mailers and recyclable FSC-certified kraft dust sleeves that break down completely in under 180 days.",
    },
    {
      icon: <HeartHandshake size={24} color="#D90429" />,
      title: "Fair-Wage Ethical Mills",
      stat: "100% Audited Partners",
      description:
        "We partner exclusively with boutique garment factories in Tirupur and Mumbai that provide living wages, safe climate-controlled studios, and healthcare benefits.",
    },
  ];

  const ROADMAP = [
    {
      year: "2024",
      milestone: "Eliminated 100% of single-use virgin plastic from all domestic consumer shipping mailers.",
      achieved: true,
    },
    {
      year: "2025",
      milestone: "Shifted all core collection tees (240–300 GSM) to 100% certified organic combed cotton.",
      achieved: true,
    },
    {
      year: "2026",
      milestone: "Implemented full solar-powered knitting lines at our primary Tirupur textile production partner.",
      achieved: true,
    },
    {
      year: "2027",
      milestone: "Launching the NXTIVE Archive Circularity Program: garment buyback and recycled loopback terry yarn.",
      achieved: false,
    },
  ];

  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "100vh", paddingBottom: "100px" }}>
      {/* Hero Header */}
      <section
        style={{
          backgroundColor: "#111110",
          color: "#FFFFFF",
          padding: "84px 20px 96px 20px",
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
            backgroundSize: "28px 28px",
          }}
        />

        <div className="container" style={{ position: "relative", zIndex: 1, maxWidth: "780px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#52B788",
              display: "inline-block",
              marginBottom: "14px",
            }}
          >
            Sustainable Streetwear
          </span>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              textTransform: "uppercase",
              marginBottom: "18px",
            }}
          >
            Engineered For Longevity, Not The Landfill
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "#A8A29A",
              lineHeight: "1.7",
              maxWidth: "620px",
              margin: "0 auto",
            }}
          >
            We reject the fast-fashion cycle of planned obsolescence. By pairing heavyweight textiles with sustainable closed-loop processing, we create garments that look better and last years longer.
          </p>
        </div>
      </section>

      {/* 4 Pillars Grid */}
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
            Our Core Commitments
          </span>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              color: "#111110",
              marginTop: "8px",
            }}
          >
            The Four Pillars of Conscious Craft
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "24px",
          }}
        >
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="info-card"
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "clamp(20px, 4vw, 32px) clamp(18px, 3.5vw, 28px)",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 6px 20px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(0,0,0,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "18px",
                  }}
                >
                  {pillar.icon}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#936037",
                    marginBottom: "6px",
                  }}
                >
                  {pillar.stat}
                </div>

                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#111110", marginBottom: "10px" }}>
                  {pillar.title}
                </h3>

                <p style={{ fontSize: "13px", color: "#6A645C", lineHeight: "1.65", margin: 0 }}>
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Heavyweight Durability Philosophy */}
      <section className="container" style={{ paddingTop: "30px", paddingBottom: "50px" }}>
        <div
          className="responsive-split-grid info-card"
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "20px",
            padding: "clamp(20px, 4vw, 44px) clamp(18px, 4vw, 40px)",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.03)",
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "40px",
            alignItems: "center",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#936037",
              }}
            >
              The Science Of Weight
            </span>
            <h2
              style={{
                fontSize: "26px",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                color: "#111110",
                marginTop: "8px",
                marginBottom: "16px",
              }}
            >
              Why 280+ GSM Is An Environmental Choice
            </h2>
            <p style={{ fontSize: "14px", color: "#554F47", lineHeight: "1.75", marginBottom: "16px" }}>
              Commercial fast fashion relies on fragile 140–160 GSM lightweight fabrics that pill, warp, and deform after three washes, forcing consumers into a disposable repurchase loop.
            </p>
            <p style={{ fontSize: "14px", color: "#554F47", lineHeight: "1.75", marginBottom: "24px" }}>
              Every NXTIVE piece starts with dense, tightly spun combed cotton yarns weighing <strong>240 GSM to 420 GSM</strong>. This structured gauge holds its collar tension, maintains its drop-shoulder drape, and lasts for years without seam degradation.
            </p>

            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#111110" }}>100+</div>
                <div style={{ fontSize: "12px", color: "#8E8880", marginTop: "2px" }}>Wash Cycles Durability</div>
              </div>
              <div style={{ width: "1px", height: "40px", backgroundColor: "rgba(0,0,0,0.1)" }} />
              <div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#111110" }}>0%</div>
                <div style={{ fontSize: "12px", color: "#8E8880", marginTop: "2px" }}>Synthetic Microplastics</div>
              </div>
              <div style={{ width: "1px", height: "40px", backgroundColor: "rgba(0,0,0,0.1)" }} />
              <div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "#111110" }}>3x</div>
                <div style={{ fontSize: "12px", color: "#8E8880", marginTop: "2px" }}>Lifespan vs Fast Fashion</div>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#FAF9F5",
              borderRadius: "16px",
              padding: "32px",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111110", marginBottom: "16px", textTransform: "uppercase" }}>
              Garment Care For Maximum Life
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px", color: "#554F47" }}>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ color: "#2B9348", fontWeight: 800 }}>✓</span>
                <span><strong>Wash Cold (30°C):</strong> Saves energy and preserves dense cotton fiber structure and rich reactive dye luster.</span>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ color: "#2B9348", fontWeight: 800 }}>✓</span>
                <span><strong>Wash Inside Out:</strong> Prevents surface friction, safeguarding graphic prints and knit textures.</span>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ color: "#2B9348", fontWeight: 800 }}>✓</span>
                <span><strong>Hang Dry in Shade:</strong> Avoid high-heat tumble dryers to eliminate shrinkage and cut household emissions.</span>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ color: "#2B9348", fontWeight: 800 }}>✓</span>
                <span><strong>Warm Iron on Reverse:</strong> Keeps oversized collars and hems crisp without scorching outer fibers.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Sustainability Roadmap */}
      <section className="container" style={{ paddingTop: "20px" }}>
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
            Continuous Progress
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
            Circularity Roadmap
          </h2>
        </div>

        <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          {ROADMAP.map((item) => (
            <div
              key={item.year}
              className="info-card"
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                padding: "clamp(14px, 3vw, 20px) clamp(16px, 3.5vw, 24px)",
                border: "1px solid rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                gap: "clamp(12px, 3vw, 20px)",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 900,
                  color: item.achieved ? "#2B9348" : "#936037",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  backgroundColor: item.achieved ? "rgba(43,147,72,0.1)" : "rgba(147,96,55,0.1)",
                  flexShrink: 0,
                }}
              >
                {item.year}
              </div>
              <div style={{ fontSize: "13.5px", color: "#444", lineHeight: "1.5" }}>
                {item.milestone}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <Link
            href="/products"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#111110",
              color: "#FFFFFF",
              padding: "13px 30px",
              borderRadius: "9999px",
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            <span>Explore Conscious Drops</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
