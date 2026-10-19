"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, HelpCircle, ArrowRight, Package, Truck, RefreshCw, Ruler, Sparkles } from "lucide-react";

interface FAQItem {
  id: string;
  category: "orders" | "sizing" | "shipping" | "returns" | "care";
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  // Orders
  {
    id: "ord-1",
    category: "orders",
    question: "How do I track my order once placed?",
    answer:
      "Once your order has been packed and handed over to our logistics partner (Delhivery / BlueDart), you will receive an SMS and email notification containing your AWB tracking link. You can also view live tracking updates anytime by navigating to the Orders section in your account dashboard.",
  },
  {
    id: "ord-2",
    category: "orders",
    question: "Can I modify or cancel my order after confirmation?",
    answer:
      "Because our fulfillment center processes orders within hours to ensure swift transit, modifications or cancellations are only possible within 60 minutes of placing the order. Please reach out immediately to support@nxtvie.com or WhatsApp our concierge with your order number.",
  },
  {
    id: "ord-3",
    category: "orders",
    question: "Do you offer Cash on Delivery (COD)?",
    answer:
      "Yes, we provide Cash on Delivery across most serviceable Indian pin codes for orders up to ₹5,000. An OTP verification may be requested at checkout to confirm COD orders.",
  },

  // Sizing
  {
    id: "size-1",
    category: "sizing",
    question: "How does the NXTIVE oversized fit compare to standard sizing?",
    answer:
      "Our garments are intentionally tailored with an Asian-minimalist relaxed drop shoulder and generous chest volume. If you prefer the intended slouchy streetwear aesthetic, order your true size. If you prefer a cleaner, regular slim profile, we recommend sizing down one size.",
  },
  {
    id: "size-2",
    category: "sizing",
    question: "Where can I view garment measurements?",
    answer:
      "Every product detail page includes an interactive Size Guide drawer specifying exact Chest Circumference, Length, Shoulder Drop, and Sleeve dimensions in both inches and centimeters.",
  },

  // Shipping
  {
    id: "ship-1",
    category: "shipping",
    question: "How long does domestic delivery take?",
    answer:
      "Standard domestic delivery across metro cities (Mumbai, Delhi NCR, Bangalore, Pune, Hyderabad, Chennai) takes 2 to 4 business days. Non-metro locations typically arrive in 4 to 6 business days. Express priority air shipping is also available at checkout.",
  },
  {
    id: "ship-2",
    category: "shipping",
    question: "What are your shipping rates?",
    answer:
      "We offer FREE Standard Delivery on all orders of ₹999 and above. For orders under ₹999, a flat nominal fee of ₹99 is applied at checkout. Express Priority Delivery is available for ₹150.",
  },

  // Returns
  {
    id: "ret-1",
    category: "returns",
    question: "What is your return and exchange window?",
    answer:
      "We offer a 7-day hassle-free return and size exchange policy from the date of delivery. All garments must be unworn, unwashed, and returned in their original packaging with intact security tags.",
  },
  {
    id: "ret-2",
    category: "returns",
    question: "How will I receive my refund?",
    answer:
      "For prepaid orders via Razorpay, UPI, or Credit/Debit card, refunds are automatically credited back to your original payment method within 5 to 7 business days following quality inspection. For COD orders, refunds are processed via secure bank transfer (NEFT/IMPS) or instant store credit.",
  },

  // Fabric Care
  {
    id: "care-1",
    category: "care",
    question: "How should I wash my heavyweight NXTIVE tee or hoodie?",
    answer:
      "To preserve the architectural drape, screen print integrity, and 280+ GSM combed cotton fibers: Machine wash cold (inside-out) on a gentle cycle with like colors. Avoid harsh bleaching agents. Lay flat or hang dry in the shade; tumble drying on high heat may cause subtle shrinkage.",
  },
  {
    id: "care-2",
    category: "care",
    question: "Will the fabric shrink after the first wash?",
    answer:
      "All NXTIVE textiles undergo an industrial pre-shrinkage wash and silicone enzyme softening cycle prior to cutting. Residual shrinkage is limited to under 2% when washed according to care labels.",
  },
];

export function FaqClient() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<string[]>(["ord-1", "size-1"]);

  const toggleAccordion = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesQuery =
      searchQuery === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "85vh", padding: "48px 0 90px 0" }}>
      <div className="container" style={{ maxWidth: "860px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
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
            Help & Knowledge Base
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
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: "14.5px", color: "#6A645C", maxWidth: "520px", margin: "0 auto 28px auto" }}>
            Everything you need to know about our fits, ordering, domestic shipping, and sustainable craftsmanship.
          </p>

          {/* Search Box */}
          <div
            style={{
              maxWidth: "500px",
              margin: "0 auto",
              position: "relative",
            }}
          >
            <input
              type="text"
              placeholder="Search by keyword (e.g. sizing, COD, returns)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "13px 20px 13px 44px",
                borderRadius: "9999px",
                border: "1px solid rgba(0,0,0,0.12)",
                backgroundColor: "#FFFFFF",
                fontSize: "13.5px",
                outline: "none",
                boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
              }}
            />
            <Search
              size={17}
              color="#8A847C"
              style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)" }}
            />
          </div>
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "36px",
          }}
        >
          {[
            { id: "all", label: "All Questions" },
            { id: "orders", label: "Orders" },
            { id: "sizing", label: "Sizing & Fit" },
            { id: "shipping", label: "Shipping" },
            { id: "returns", label: "Returns" },
            { id: "care", label: "Fabric Care" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: "8px 18px",
                borderRadius: "9999px",
                fontSize: "12.5px",
                fontWeight: 600,
                border: "1px solid",
                borderColor: activeCategory === cat.id ? "#111110" : "rgba(0,0,0,0.1)",
                backgroundColor: activeCategory === cat.id ? "#111110" : "#FFFFFF",
                color: activeCategory === cat.id ? "#FFFFFF" : "#111110",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordions List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "48px" }}>
          {filteredFaqs.length === 0 ? (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <HelpCircle size={36} color="#A39D95" style={{ margin: "0 auto 12px auto" }} />
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111110", marginBottom: "6px" }}>
                No matching answers found
              </h3>
              <p style={{ fontSize: "13px", color: "#746E66" }}>
                Try searching with different keywords or reach out directly to our concierge team.
              </p>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openItems.includes(faq.id);

              return (
                <div
                  key={faq.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "12px",
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                    overflow: "hidden",
                    transition: "all 0.2s ease",
                  }}
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    style={{
                      width: "100%",
                      padding: "20px 24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                      backgroundColor: "transparent",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#111110" }}>
                      {faq.question}
                    </span>
                    <ChevronDown
                      size={18}
                      color="#8A847C"
                      style={{
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.25s ease",
                        flexShrink: 0,
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: "0 24px 22px 24px",
                        fontSize: "13.5px",
                        color: "#5C564E",
                        lineHeight: 1.65,
                        borderTop: "1px solid rgba(0,0,0,0.04)",
                        paddingTop: "14px",
                      }}
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Contact Banner */}
        <div
          style={{
            backgroundColor: "#161514",
            color: "#FFFFFF",
            borderRadius: "16px",
            padding: "36px",
            textAlign: "center",
          }}
        >
          <h3 style={{ fontSize: "20px", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
            Still have questions?
          </h3>
          <p style={{ fontSize: "13.5px", color: "#A8A29A", maxWidth: "440px", margin: "0 auto 20px auto" }}>
            Our stylists and customer care specialists are available 6 days a week to assist you.
          </p>
          <Link
            href="/contact"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#FFFFFF",
              color: "#111110",
              padding: "12px 26px",
              borderRadius: "9999px",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            <span>Contact Concierge</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
