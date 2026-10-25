"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Ruler,
  HelpCircle,
  ArrowRight,
  Check,
  Info,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
} from "lucide-react";

type Unit = "in" | "cm";
type CategoryKey = "tshirts" | "hoodies" | "shirts" | "bottoms" | "jackets";

interface SizeRow {
  size: string;
  chest: [number, number]; // [inches, cm]
  length: [number, number];
  shoulder: [number, number];
  sleeve: [number, number];
  waist?: [number, number];
  inseam?: [number, number];
  recommendedHeight?: string;
  recommendedWeight?: string;
}

const SIZE_DATA: Record<
  CategoryKey,
  {
    title: string;
    silhouette: string;
    rows: SizeRow[];
    columns: string[];
  }
> = {
  tshirts: {
    title: "Oversized & Boxy T-Shirts",
    silhouette: "Signature drop-shoulder drape with a structured heavyweight 240–300 GSM rib collar.",
    columns: ["Size", "Chest Width", "Body Length", "Shoulder Drop", "Sleeve Length"],
    rows: [
      { size: "S", chest: [42, 107], length: [28, 71], shoulder: [20.5, 52], sleeve: [8.5, 22], recommendedHeight: "5'5\" – 5'8\"", recommendedWeight: "55 – 68 kg" },
      { size: "M", chest: [45, 114], length: [29, 74], shoulder: [21.5, 55], sleeve: [9.0, 23], recommendedHeight: "5'8\" – 5'11\"", recommendedWeight: "68 – 78 kg" },
      { size: "L", chest: [48, 122], length: [30, 76], shoulder: [22.5, 57], sleeve: [9.5, 24], recommendedHeight: "5'10\" – 6'1\"", recommendedWeight: "78 – 88 kg" },
      { size: "XL", chest: [51, 130], length: [31, 79], shoulder: [23.5, 60], sleeve: [10.0, 25], recommendedHeight: "6'0\" – 6'3\"", recommendedWeight: "88 – 100 kg" },
      { size: "XXL", chest: [54, 137], length: [32, 81], shoulder: [24.5, 62], sleeve: [10.5, 27], recommendedHeight: "6'2\"+", recommendedWeight: "100+ kg" },
    ],
  },
  hoodies: {
    title: "Heavyweight Hoodies & Crewnecks",
    silhouette: "Double-layered hood, generous chest volume, and tight elasticated hem cuffs (380–420 GSM).",
    columns: ["Size", "Chest Width", "Body Length", "Shoulder Drop", "Sleeve Length"],
    rows: [
      { size: "S", chest: [44, 112], length: [27.5, 70], shoulder: [21.0, 53], sleeve: [23.5, 60], recommendedHeight: "5'5\" – 5'8\"", recommendedWeight: "55 – 68 kg" },
      { size: "M", chest: [47, 119], length: [28.5, 72], shoulder: [22.0, 56], sleeve: [24.5, 62], recommendedHeight: "5'8\" – 5'11\"", recommendedWeight: "68 – 78 kg" },
      { size: "L", chest: [50, 127], length: [29.5, 75], shoulder: [23.0, 58], sleeve: [25.5, 65], recommendedHeight: "5'10\" – 6'1\"", recommendedWeight: "78 – 88 kg" },
      { size: "XL", chest: [53, 135], length: [30.5, 77], shoulder: [24.0, 61], sleeve: [26.0, 66], recommendedHeight: "6'0\" – 6'3\"", recommendedWeight: "88 – 100 kg" },
      { size: "XXL", chest: [56, 142], length: [31.5, 80], shoulder: [25.0, 64], sleeve: [26.5, 67], recommendedHeight: "6'2\"+", recommendedWeight: "100+ kg" },
    ],
  },
  shirts: {
    title: "Relaxed & Cuban Collar Shirts",
    silhouette: "Straight hem boxy drape designed to be worn unbuttoned over a heavyweight tank or buttoned solo.",
    columns: ["Size", "Chest Width", "Body Length", "Shoulder Width", "Sleeve Length"],
    rows: [
      { size: "S", chest: [42, 107], length: [28.0, 71], shoulder: [19.5, 50], sleeve: [9.0, 23], recommendedHeight: "5'5\" – 5'8\"", recommendedWeight: "55 – 68 kg" },
      { size: "M", chest: [44, 112], length: [29.0, 74], shoulder: [20.5, 52], sleeve: [9.5, 24], recommendedHeight: "5'8\" – 5'11\"", recommendedWeight: "68 – 78 kg" },
      { size: "L", chest: [47, 119], length: [30.0, 76], shoulder: [21.5, 55], sleeve: [10.0, 25], recommendedHeight: "5'10\" – 6'1\"", recommendedWeight: "78 – 88 kg" },
      { size: "XL", chest: [50, 127], length: [31.0, 79], shoulder: [22.5, 57], sleeve: [10.5, 27], recommendedHeight: "6'0\" – 6'3\"", recommendedWeight: "88 – 100 kg" },
      { size: "XXL", chest: [53, 135], length: [32.0, 81], shoulder: [23.5, 60], sleeve: [11.0, 28], recommendedHeight: "6'2\"+", recommendedWeight: "100+ kg" },
    ],
  },
  bottoms: {
    title: "Wide-Leg Trousers & Articulated Cargos",
    silhouette: "Relaxed hip and thigh with a slight taper or wide pooling over sneakers. Includes elastic drawcord waist.",
    columns: ["Size", "Waist Range", "Outseam Length", "Inseam Length", "Thigh Width"],
    rows: [
      { size: "S (28–30)", chest: [30, 76], length: [40, 102], shoulder: [29, 74], sleeve: [25, 64] },
      { size: "M (31–32)", chest: [32, 81], length: [41, 104], shoulder: [30, 76], sleeve: [26, 66] },
      { size: "L (33–34)", chest: [34, 86], length: [42, 107], shoulder: [31, 79], sleeve: [27, 69] },
      { size: "XL (35–36)", chest: [36, 91], length: [43, 109], shoulder: [32, 81], sleeve: [28, 71] },
      { size: "XXL (37–38)", chest: [38, 97], length: [44, 112], shoulder: [32.5, 83], sleeve: [29, 74] },
    ],
  },
  jackets: {
    title: "Technical Jackets & Urban Outerwear",
    silhouette: "Structured shoulder silhouette with room for inner layering over an oversized hoodie or thick knit.",
    columns: ["Size", "Chest Width", "Back Length", "Shoulder Width", "Sleeve Length"],
    rows: [
      { size: "S", chest: [45, 114], length: [26.5, 67], shoulder: [20.0, 51], sleeve: [24.0, 61] },
      { size: "M", chest: [48, 122], length: [27.5, 70], shoulder: [21.0, 53], sleeve: [25.0, 64] },
      { size: "L", chest: [51, 130], length: [28.5, 72], shoulder: [22.0, 56], sleeve: [26.0, 66] },
      { size: "XL", chest: [54, 137], length: [29.5, 75], shoulder: [23.0, 58], sleeve: [26.5, 67] },
      { size: "XXL", chest: [57, 145], length: [30.5, 77], shoulder: [24.0, 61], sleeve: [27.0, 69] },
    ],
  },
};

export function SizeGuideClient() {
  const [unit, setUnit] = useState<Unit>("in");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("tshirts");

  const currentCategoryData = SIZE_DATA[activeCategory];
  const unitIdx = unit === "in" ? 0 : 1;
  const unitSuffix = unit === "in" ? "″" : " cm";

  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "100vh", paddingBottom: "100px" }}>
      {/* Header */}
      <section
        style={{
          backgroundColor: "#111110",
          color: "#FFFFFF",
          padding: "72px 20px 84px 20px",
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

        <div className="container" style={{ position: "relative", zIndex: 1, maxWidth: "760px" }}>
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
            Fit & Sizing Spec
          </span>
          <h1
            style={{
              fontSize: "clamp(30px, 4.5vw, 44px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              textTransform: "uppercase",
              marginBottom: "14px",
            }}
          >
            The NXTIVE Sizing Manual
          </h1>
          <p
            style={{
              fontSize: "14.5px",
              color: "#A8A29A",
              lineHeight: "1.65",
              maxWidth: "580px",
              margin: "0 auto",
            }}
          >
            Our garments are intentionally cut with an oversized, relaxed Asian streetwear drape. Follow our exact garment measurements below to find your intended fit.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="container" style={{ paddingTop: "44px" }}>
        {/* Controls: Category Selector & Unit Switcher */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "18px",
            marginBottom: "28px",
          }}
        >
          {/* Category Tabs */}
          <div
            className="scroll-touch no-scrollbar"
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              whiteSpace: "nowrap",
              paddingBottom: "4px",
            }}
          >
            {[
              { id: "tshirts", label: "T-Shirts" },
              { id: "hoodies", label: "Hoodies" },
              { id: "shirts", label: "Shirts" },
              { id: "bottoms", label: "Bottoms & Cargos" },
              { id: "jackets", label: "Jackets" },
            ].map((tab) => {
              const active = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id as CategoryKey)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "9999px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: active ? "1px solid #111110" : "1px solid rgba(0,0,0,0.12)",
                    backgroundColor: active ? "#111110" : "#FFFFFF",
                    color: active ? "#FFFFFF" : "#555",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Unit Switcher */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: "9999px",
              padding: "4px",
              border: "1px solid rgba(0,0,0,0.12)",
            }}
          >
            <button
              type="button"
              onClick={() => setUnit("in")}
              style={{
                padding: "6px 14px",
                borderRadius: "9999px",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                border: "none",
                backgroundColor: unit === "in" ? "#111110" : "transparent",
                color: unit === "in" ? "#FFFFFF" : "#666",
                transition: "all 0.15s ease",
              }}
            >
              Inches (in)
            </button>
            <button
              type="button"
              onClick={() => setUnit("cm")}
              style={{
                padding: "6px 14px",
                borderRadius: "9999px",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                border: "none",
                backgroundColor: unit === "cm" ? "#111110" : "transparent",
                color: unit === "cm" ? "#FFFFFF" : "#666",
                transition: "all 0.15s ease",
              }}
            >
              Centimeters (cm)
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div
          className="info-card"
          style={{
            borderRadius: "18px",
            boxShadow: "0 6px 24px rgba(0,0,0,0.02)",
            overflow: "hidden",
            marginBottom: "36px",
            padding: 0,
          }}
        >
          {/* Table Header Bar */}
          <div
            style={{
              padding: "20px 28px",
              backgroundColor: "#FAF9F5",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h2 style={{ fontSize: "17px", fontWeight: 900, textTransform: "uppercase", color: "#111110", margin: 0 }}>
                {currentCategoryData.title}
              </h2>
              <p style={{ fontSize: "12px", color: "#777", marginTop: "4px", margin: 0 }}>
                {currentCategoryData.silhouette}
              </p>
            </div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#936037", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Garment Laid Flat Measurements
            </div>
          </div>

          {/* Sizing Table */}
          <div className="scroll-touch" style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#FAF9F5", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  {currentCategoryData.columns.map((col, idx) => (
                    <th
                      key={col}
                      style={{
                        padding: "14px 24px",
                        fontSize: "11.5px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "#666",
                        textAlign: idx === 0 ? "left" : "right",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                  {currentCategoryData.rows[0]?.recommendedHeight && (
                    <th
                      style={{
                        padding: "14px 24px",
                        fontSize: "11.5px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "#666",
                        textAlign: "right",
                      }}
                    >
                      Recommended Fit
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentCategoryData.rows.map((row, idx) => (
                  <tr
                    key={row.size}
                    style={{
                      borderBottom: idx === currentCategoryData.rows.length - 1 ? "none" : "1px solid rgba(0,0,0,0.05)",
                      backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FDFCFB",
                    }}
                  >
                    <td style={{ padding: "16px 24px", fontWeight: 800, color: "#111110" }}>
                      {row.size}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right", color: "#333", fontWeight: 600 }}>
                      {row.chest[unitIdx]}
                      {unitSuffix}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right", color: "#333", fontWeight: 600 }}>
                      {row.length[unitIdx]}
                      {unitSuffix}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right", color: "#333", fontWeight: 600 }}>
                      {row.shoulder[unitIdx]}
                      {unitSuffix}
                    </td>
                    <td style={{ padding: "16px 24px", textAlign: "right", color: "#333", fontWeight: 600 }}>
                      {row.sleeve[unitIdx]}
                      {unitSuffix}
                    </td>
                    {row.recommendedHeight && (
                      <td style={{ padding: "16px 24px", textAlign: "right", color: "#777", fontSize: "12px" }}>
                        {row.recommendedHeight} ({row.recommendedWeight})
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Measuring Instructions & Fit Advice */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: "28px",
            marginBottom: "40px",
          }}
          className="responsive-split-grid"
        >
          {/* How to Measure Card */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "32px",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 4px 18px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Ruler size={18} color="#936037" />
              <h3 style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase", color: "#111110", margin: 0 }}>
                How To Measure For Best Fit
              </h3>
            </div>

            <p style={{ fontSize: "13px", color: "#6A645C", lineHeight: "1.6", marginBottom: "18px" }}>
              We recommend measuring your favorite oversized tee or sweatshirt laid completely flat on a table, rather than measuring your own body.
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px", fontSize: "12.5px", color: "#444" }}>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ fontWeight: 800, color: "#936037" }}>01.</span>
                <span><strong>Chest Width:</strong> Measure flat across the front from armpit seam to armpit seam. Double this number for full circumference.</span>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ fontWeight: 800, color: "#936037" }}>02.</span>
                <span><strong>Body Length:</strong> Measure from the highest point of the neck ribbing down to the bottom hem.</span>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ fontWeight: 800, color: "#936037" }}>03.</span>
                <span><strong>Shoulder Drop:</strong> Measure straight across the back from the left shoulder drop seam to the right shoulder seam.</span>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ fontWeight: 800, color: "#936037" }}>04.</span>
                <span><strong>Sleeve Length:</strong> Measure from the top shoulder seam down to the outer sleeve opening.</span>
              </li>
            </ul>
          </div>

          {/* Fit Philosophy Card */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "32px",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 4px 18px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <Info size={18} color="#936037" />
                <h3 style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase", color: "#111110", margin: 0 }}>
                  Fit Philosophy & Tips
                </h3>
              </div>

              <div style={{ backgroundColor: "#FAF9F5", borderRadius: "10px", padding: "16px", marginBottom: "16px", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#111110", marginBottom: "4px" }}>
                  Intended Oversized Drape
                </div>
                <div style={{ fontSize: "12.5px", color: "#666", lineHeight: "1.5" }}>
                  If you want the signature NXTIVE streetwear drape with dropped shoulders and roomy torso, <strong>take your normal size</strong>.
                </div>
              </div>

              <div style={{ backgroundColor: "#FAF9F5", borderRadius: "10px", padding: "16px", marginBottom: "16px", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#111110", marginBottom: "4px" }}>
                  More Tailored Standard Fit
                </div>
                <div style={{ fontSize: "12.5px", color: "#666", lineHeight: "1.5" }}>
                  If you prefer a closer-to-body, traditional casual cut with less drop in the shoulders, <strong>size down one size</strong>.
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#2B9348", fontWeight: 700 }}>
                <RefreshCw size={14} />
                <span>Free 7-Day Size Exchanges</span>
              </div>
              <Link
                href="/contact"
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#111110",
                  textDecoration: "underline",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <MessageSquare size={12} />
                <span>Ask Stylist Concierge</span>
              </Link>
            </div>
          </div>
        </div>

        {/* CTA Shop */}
        <div style={{ textAlign: "center", padding: "20px 0" }}>
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
            <span>Explore Heavyweight Drops</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
