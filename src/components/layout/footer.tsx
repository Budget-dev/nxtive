"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useStore } from "@/components/store-context";
import { NxtvieLogo } from "./nxtvie-logo";

export function Footer() {
  const { showToast } = useStore();
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes("@")) {
      setIsSubscribed(true);
      showToast("Thank you for subscribing to NXTIVE!");
      setEmail("");
    }
  };

  return (
    <footer
      style={{
        backgroundColor: "#0B0B0A",
        color: "#FFFFFF",
        paddingTop: "64px",
        paddingBottom: "32px",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        marginTop: "auto",
      }}
    >
      <div className="container">
        {/* Main Footer 5-Column Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "40px 32px",
            paddingBottom: "56px",
          }}
          className="footer-grid"
        >
          {/* Column 1: Brand Info */}
          <div className="footer-brand" style={{ maxWidth: "260px" }}>
            <Link
              href="/"
              aria-label="NXTIVE Home"
              style={{
                display: "inline-flex",
                alignItems: "center",
                minWidth: "44px",
                minHeight: "44px",
                marginBottom: "18px",
              }}
            >
              <NxtvieLogo size={22} color="#FFFFFF" />
            </Link>
            <p
              style={{
                fontSize: "12px",
                lineHeight: "1.65",
                color: "#9A948C",
                marginBottom: "22px",
              }}
            >
              Modern menswear inspired by Asian style. Minimal design. Everyday comfort. For new generations.
            </p>

            {/* Social Icons & Backlinks */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                style={{
                  color: "#D1CCC2",
                  transition: "color 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                }}
                className="footer-social-icon"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                style={{
                  color: "#D1CCC2",
                  transition: "color 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                }}
                className="footer-social-icon"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Shop */}
          <div className="footer-menu">
            <h4
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#FFFFFF",
                marginBottom: "18px",
                letterSpacing: "0.02em",
              }}
            >
              Shop
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "11px" }}>
              {["Men", "New Arrivals", "Clothing", "Accessories", "Collections", "Sale"].map((item) => (
                <li key={item}>
                  <Link
                      href={`/categories/${item.toLowerCase().replace(/\s+/g, "-")}`}
                      style={{
                        fontSize: "12.5px",
                        color: "#9A948C",
                        transition: "color 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        minHeight: "44px",
                      }}
                    className="footer-link"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Help */}
          <div className="footer-menu">
            <h4
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#FFFFFF",
                marginBottom: "18px",
                letterSpacing: "0.02em",
              }}
            >
              Help
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "11px" }}>
              {[
                { label: "Track Order", href: "/orders" },
                { label: "Shipping", href: "/shipping" },
                { label: "Returns & Exchanges", href: "/returns" },
                { label: "Size Guide", href: "/size-guide" },
                { label: "FAQs", href: "/faq" },
                { label: "Contact Us", href: "/contact" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    style={{
                      fontSize: "12.5px",
                      color: "#9A948C",
                      transition: "color 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      minHeight: "44px",
                    }}
                    className="footer-link"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: About */}
          <div className="footer-menu">
            <h4
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#FFFFFF",
                marginBottom: "18px",
                letterSpacing: "0.02em",
              }}
            >
              About
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "11px" }}>
              {[
                { label: "Our Story", href: "/about" },
                { label: "Sustainability", href: "/sustainability" },
                { label: "Careers", href: "/careers" },
                { label: "Press", href: "/press" },
                { label: "Affiliates", href: "/affiliates" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    style={{
                      fontSize: "12.5px",
                      color: "#9A948C",
                      transition: "color 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      minHeight: "44px",
                    }}
                    className="footer-link"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Newsletter */}
          <div className="footer-newsletter" style={{ minWidth: "220px" }}>
            <h4
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#FFFFFF",
                marginBottom: "8px",
                letterSpacing: "0.02em",
              }}
            >
              Newsletter
            </h4>
            <p
              style={{
                fontSize: "12px",
                color: "#9A948C",
                marginBottom: "16px",
                lineHeight: "1.5",
              }}
            >
              Get exclusive drops, offers and more.
            </p>

            {isSubscribed ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  color: "#52B788",
                  fontWeight: 600,
                }}
              >
                <Check size={14} />
                <span>You're on the exclusive drop list.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                {/* Email input box with attached button */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#171615",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    borderRadius: "6px",
                    overflow: "hidden",
                    marginBottom: "10px",
                  }}
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    aria-label="Enter your email"
                   style={{
                     flex: 1,
                     background: "transparent",
                     border: "none",
                     outline: "none",
                     color: "#FFFFFF",
                     fontSize: "12.5px",
                     minWidth: 0,
                     minHeight: "44px",
                     padding: "9px 12px",
                   }}
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe"
                    style={{
                      backgroundColor: "#FFFFFF",
                      color: "#111110",
                      border: "none",
                      width: "44px",
                      height: "44px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "opacity 0.2s ease",
                      flexShrink: 0,
                    }}
                  >
                    <ArrowRight size={15} />
                  </button>
                </div>

                {/* Checkbox agreement */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "11px",
                    color: "#858078",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    style={{
                      accentColor: "#FFFFFF",
                      cursor: "pointer",
                       width: "18px",
                       height: "18px",
                    }}
                  />
                  <span>I agree to receive marketing emails.</span>
                </label>
              </form>
            )}
          </div>
        </div>


        {/* Bottom Sub-footer */}
        <div
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            fontSize: "11.5px",
            color: "#7E7972",
          }}
        >
          <div>© {new Date().getFullYear()} NXTIVE Streetwear Inc. All rights reserved.</div>

          <div className="footer-bottom-links" style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <Link href="/privacy" className="footer-bottom-link">
              Privacy Policy
            </Link>
            <Link href="/terms" className="footer-bottom-link">
              Terms of Service
            </Link>
            <Link href="/shipping" className="footer-bottom-link">
              Shipping Policy
            </Link>
            <Link href="/returns" className="footer-bottom-link">
              Returns & Refunds
            </Link>
            <a href="/sitemap.xml" target="_blank" rel="noopener" className="footer-bottom-link" title="XML Sitemap for Search Engine Crawlers">
              XML Sitemap
            </a>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (hover: hover) and (pointer: fine) {
          .footer-link:hover {
            color: #FFFFFF !important;
          }
          .footer-social-icon:hover {
            color: #FFFFFF !important;
            transform: translateY(-1px);
          }
        }
        .footer-bottom-link {
          color: #7E7972;
          transition: color 0.2s ease;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
        }
        @media (hover: hover) and (pointer: fine) {
          .footer-bottom-link:hover {
            color: #D1CCC2;
          }
        }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 32px 20px !important;
          }
          .footer-brand,
          .footer-newsletter {
            grid-column: 1 / -1;
            max-width: none !important;
            min-width: 0 !important;
          }
          .footer-menu {
            min-width: 0;
          }
          .footer-bottom-links {
            width: 100%;
            flex-wrap: wrap;
            gap: 8px 16px !important;
          }
        }
      `}</style>
    </footer>
  );
}
