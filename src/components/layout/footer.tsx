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
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
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
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
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
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
                  <polygon points="10 15 15 12 10 9 10 15" fill="currentColor"/>
                </svg>
              </a>
              <a
                href="https://pinterest.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Pinterest"
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
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0a12 12 0 0 0-4.37 23.18c-.03-.96-.06-2.45.05-3.51.1-.96.67-5.74.67-5.74s-.17-.34-.17-.85c0-.8.46-1.4 1.04-1.4.49 0 .73.37.73.81 0 .49-.31 1.24-.48 1.92-.14.57.29 1.04.85 1.04 1.02 0 1.8-1.07 1.8-2.62 0-1.37-.99-2.33-2.39-2.33-1.63 0-2.59 1.22-2.59 2.48 0 .49.19 1.02.43 1.31.05.06.05.11.04.17-.04.18-.14.58-.16.66-.03.11-.09.13-.21.08-.8-.37-1.3-1.54-1.3-2.48 0-2.02 1.47-3.88 4.23-3.88 2.22 0 3.95 1.58 3.95 3.7 0 2.21-1.39 3.98-3.32 3.98-.65 0-1.26-.34-1.47-.74l-.4 1.52c-.15.56-.54 1.26-.81 1.69A12 12 0 1 0 12 0z"/>
                </svg>
              </a>
              <a
                href="https://spotify.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Spotify NXTIVE Playlist"
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
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

        {/* Editorial Press Citations & High Authority Backlinks */}
        <div
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: "28px",
            paddingBottom: "28px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <span
            style={{
              fontSize: "10.5px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "#6D6860",
              textTransform: "uppercase",
            }}
          >
            As Recognized & Featured In
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "28px 36px",
              flexWrap: "wrap",
            }}
          >
            {[
              { name: "VOGUE INDIA", url: "https://www.vogue.in" },
              { name: "GQ MAGAZINE", url: "https://www.gqindia.com" },
              { name: "HIGHSNOBIETY", url: "https://www.highsnobiety.com" },
              { name: "HYPEBEAST", url: "https://hypebeast.com" },
              { name: "GRAZIA", url: "https://www.grazia.co.in" },
              { name: "ELLE MAN", url: "https://elle.in" },
            ].map((press) => (
              <a
                key={press.name}
                href={press.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`${press.name} Editorial Feature`}
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  color: "#7E7870",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  fontFamily: "var(--font-heading), sans-serif",
                }}
                className="footer-press-link"
              >
                {press.name}
              </a>
            ))}
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
          .footer-press-link:hover {
            color: #FFFFFF !important;
            letter-spacing: 0.16em !important;
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
