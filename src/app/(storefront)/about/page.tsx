import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowRight, Compass, Shield, Feather, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Our Story — NXTIVE Menswear",
  description: "Modern menswear inspired by Asian style. Minimal design. Everyday comfort. For new generations.",
};

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "100vh", paddingBottom: "100px" }}>
      {/* Hero Section */}
      <section
        style={{
          position: "relative",
          height: "68vh",
          minHeight: "480px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#111110",
          color: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        <Image
          src="/images/nxtvie/banner-urban-essentials-hd.jpg"
          alt="NXTIVE Design Studio"
          fill
          priority
          style={{ objectFit: "cover", opacity: 0.45 }}
          sizes="100vw"
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(17,17,16,0.6) 0%, rgba(17,17,16,0.85) 100%)",
          }}
        />

        <div className="container" style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: "780px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--accent-next)",
              marginBottom: "16px",
            }}
          >
            The NXTIVE Philosophy
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 5.5vw, 56px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              lineHeight: 1.08,
              marginBottom: "20px",
            }}
          >
            More Than Clothing.
            <br />
            An Aesthetic Identity.
          </h1>

          <p
            style={{
              fontSize: "clamp(14px, 1.8vw, 17px)",
              color: "#D4CEC3",
              lineHeight: 1.65,
              maxWidth: "640px",
              margin: "0 auto",
            }}
          >
            Born at the intersection of Tokyo streetwear precision and Mumbai creative pulse, NXTIVE crafts silhouettes that redefine casual modern luxury for the next generation.
          </p>
        </div>
      </section>

      {/* Manifesto Section */}
      <section style={{ padding: "80px 0" }}>
        <div className="container" style={{ maxWidth: "1080px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 1fr",
              gap: "56px",
              alignItems: "center",
            }}
            className="about-split"
          >
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#936037",
                  display: "block",
                  marginBottom: "12px",
                }}
              >
                Our Origins
              </span>
              <h2
                style={{
                  fontSize: "36px",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                  lineHeight: 1.15,
                  color: "#111110",
                  marginBottom: "24px",
                }}
              >
                Engineered For Daily Utility & Visual Calm
              </h2>
              <p
                style={{
                  fontSize: "15px",
                  color: "#5C564E",
                  lineHeight: 1.7,
                  marginBottom: "18px",
                }}
              >
                NXTIVE was founded in 2024 to dismantle the cycle of disposable fast fashion. We observed that contemporary men were constantly forced to choose between stiff formal tailoring and generic, ill-fitting loungewear.
              </p>
              <p
                style={{
                  fontSize: "15px",
                  color: "#5C564E",
                  lineHeight: 1.7,
                  marginBottom: "28px",
                }}
              >
                Every garment begins with bespoke yarn spinning. From our signature 280 GSM combed cottons to our dense water-repellent nylon twills, we engineer drape, density, and longevity into every single seam.
              </p>

              <div style={{ display: "flex", gap: "24px" }}>
                <div>
                  <div style={{ fontSize: "28px", fontWeight: 900, color: "#111110" }}>280+</div>
                  <div style={{ fontSize: "12px", color: "#837D74", textTransform: "uppercase", fontWeight: 600 }}>
                    GSM Heavyweight French Terry
                  </div>
                </div>
                <div style={{ borderLeft: "1px solid rgba(0,0,0,0.1)", paddingLeft: "24px" }}>
                  <div style={{ fontSize: "28px", fontWeight: 900, color: "#111110" }}>100%</div>
                  <div style={{ fontSize: "12px", color: "#837D74", textTransform: "uppercase", fontWeight: 600 }}>
                    Pre-Shrunk Ring-Spun Cotton
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                position: "relative",
                height: "520px",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)",
              }}
            >
              <Image
                src="/images/nxtvie/story-back-print-nxtive.jpg?v=20261023"
                alt="NXTIVE Garment Back Detail"
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pillars Grid */}
      <section style={{ padding: "40px 0 80px 0" }}>
        <div className="container" style={{ maxWidth: "1120px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#936037",
              }}
            >
              The 4 Standards
            </span>
            <h2
              style={{
                fontSize: "32px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                color: "#111110",
                marginTop: "6px",
              }}
            >
              What Makes NXTIVE Different
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "24px",
            }}
          >
            {[
              {
                icon: <Feather size={24} color="#936037" />,
                title: "Custom Heavyweight Knits",
                desc: "We engineer dense loopback terry and structured jerseys that hold their architectural silhouette after countless washes.",
              },
              {
                icon: <Compass size={24} color="#936037" />,
                title: "Subtle Asian-Minimalist Cuts",
                desc: "Drop shoulders, boxy torsos, and clean necklines designed around natural movement rather than restrictive tailoring.",
              },
              {
                icon: <Sparkles size={24} color="#936037" />,
                title: "Strict Monochrome Palettes",
                desc: "Curated mineral tones: Pitch Black, Raw Bone, Vintage Olive, and Washed Charcoal. Everything pairs effortlessly.",
              },
              {
                icon: <Shield size={24} color="#936037" />,
                title: "Conscious Small-Batch Drops",
                desc: "We release limited capsules to minimize textile waste, ensuring fair atelier craftsmanship and zero deadstock dumping.",
              },
            ].map((pillar) => (
              <div
                key={pillar.title}
                className="info-card"
                style={{
                  padding: "32px 26px",
                  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.02)",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "10px",
                    backgroundColor: "var(--bg-sand)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "20px",
                  }}
                >
                  {pillar.icon}
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111110", marginBottom: "10px" }}>
                  {pillar.title}
                </h3>
                <p style={{ fontSize: "13px", color: "#6C665D", lineHeight: 1.6 }}>
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lookbook Strip */}
      <section style={{ padding: "20px 0 80px 0" }}>
        <div className="container" style={{ maxWidth: "1120px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "20px",
            }}
            className="lookbook-grid"
          >
            <div style={{ position: "relative", height: "380px", borderRadius: "12px", overflow: "hidden" }}>
              <Image
                src="/images/nxtvie/promo-jackets-hd.jpg"
                alt="NXTIVE Outerwear Lookbook"
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div style={{ position: "relative", height: "380px", borderRadius: "12px", overflow: "hidden" }}>
              <Image
                src="/images/nxtvie/hero-model.jpg"
                alt="NXTIVE Everyday Essentials"
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div style={{ position: "relative", height: "380px", borderRadius: "12px", overflow: "hidden" }}>
              <Image
                src="/images/nxtvie/promo-asian-minimal-hd.jpg"
                alt="NXTIVE Asian Minimal Collection"
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section style={{ textAlign: "center", padding: "40px 0 20px 0" }}>
        <div className="container" style={{ maxWidth: "600px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 900, textTransform: "uppercase", color: "#111110", marginBottom: "12px" }}>
            Experience The Next Cut
          </h2>
          <p style={{ fontSize: "14px", color: "#6A645C", marginBottom: "26px" }}>
            Explore our curated drops designed for daily repetition and quiet confidence.
          </p>
          <Link
            href="/products"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#111110",
              color: "#FFFFFF",
              padding: "14px 32px",
              borderRadius: "9999px",
              fontSize: "14px",
              fontWeight: 700,
            }}
            className="btn-pill-dark"
          >
            <span>Explore All Products</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
