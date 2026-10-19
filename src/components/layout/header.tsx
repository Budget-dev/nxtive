"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Heart, ShoppingBag, User, Menu, X, ArrowRight, Moon, Sun } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useStore } from "@/components/store-context";
import { useAuth } from "@/features/auth";
import { NxtvieLogo } from "./nxtvie-logo";

const THEME_STORAGE_KEY = "nxtvie-theme";

export function Header() {
  const { totalCartCount, wishlist, setIsCartOpen, setIsSearchOpen } = useStore();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    let storedTheme: string | null = null;
    try {
      storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      // Continue with the light theme when storage is unavailable.
    }
    const shouldUseDarkMode = storedTheme === "dark";

    setIsDarkMode(shouldUseDarkMode);
    document.documentElement.dataset.theme = shouldUseDarkMode ? "dark" : "light";
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((currentValue) => {
      const nextValue = !currentValue;
      document.documentElement.dataset.theme = nextValue ? "dark" : "light";
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextValue ? "dark" : "light");
      } catch {
        // The visual toggle still works when storage is unavailable.
      }
      return nextValue;
    });
  };

  const navLinks = [
    { label: "Men", href: "/categories/men" },
    { label: "New Arrivals", href: "/categories/new-arrivals" },
    { label: "Clothing", href: "/categories/clothing" },
    { label: "Accessories", href: "/categories/accessories" },
    { label: "Collections", href: "/categories/collections" },
    { label: "Sale", href: "/categories/sale" },
  ];

  return (
    <>
      <header
        className="site-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: isScrolled ? "rgba(245, 243, 237, 0.95)" : "var(--bg-sand)",
          backdropFilter: isScrolled ? "blur(12px)" : "none",
          borderBottom: isScrolled ? "1px solid var(--border-light)" : "1px solid transparent",
          transition: "background-color 0.25s ease, border-color 0.25s ease, backdrop-filter 0.25s ease",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "72px",
            gap: "20px",
          }}
        >
          {/* Left: Mobile Menu Trigger + Brand Logo */}
          <div className="header-brand-group" style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
              style={{
                display: "none",
                color: "var(--text-dark)",
                width: "44px",
                height: "44px",
                padding: 0,
                alignItems: "center",
                justifyContent: "center",
              }}
              className="mobile-menu-btn"
               aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            <Link
              href="/"
              aria-label="NXTIVE Home"
              style={{
                minWidth: "44px",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <NxtvieLogo size={24} color={isDarkMode ? "#FBF9F5" : "#121110"} />
            </Link>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "28px",
            }}
            className="desktop-nav"
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                style={{
                  fontSize: "13.5px",
                  fontWeight: 500,
                  color: "#1E1C1A",
                  letterSpacing: "0.01em",
                  transition: "color 0.2s ease, opacity 0.2s ease",
                  whiteSpace: "nowrap",
                }}
                className="nav-link"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: Search Pill + Action Icons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "var(--text-dark)",
            }}
            className="header-actions"
          >
            {/* Search Pill Input (Desktop) */}
            <div
              onClick={() => setIsSearchOpen(true)}
              role="button"
              tabIndex={0}
              aria-label="Search products"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsSearchOpen(true);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#EBE7DF",
                borderRadius: "9999px",
                padding: "7px 16px",
                width: "220px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              className="header-search-pill"
            >
              <Search size={15} color="#857F76" strokeWidth={2} />
              <span
                style={{
                  fontSize: "12.5px",
                  color: "#857F76",
                  fontWeight: 400,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  userSelect: "none",
                }}
              >
                Search for products...
              </span>
            </div>

            {/* Mobile Search Icon Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search products"
              style={{
                display: "none",
                color: "var(--text-dark)",
                width: "44px",
                height: "44px",
                padding: 0,
                alignItems: "center",
                justifyContent: "center",
              }}
              className="mobile-search-btn action-icon-btn"
            >
              <Search size={19} strokeWidth={1.8} />
            </button>

            {/* Profile Icon */}
            <Link
              href={user ? "/account" : "/login"}
              aria-label={user ? "My Account" : "Sign In"}
              style={{
                color: "var(--text-dark)",
                width: "44px",
                height: "44px",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "opacity 0.2s ease",
              }}
              className="action-icon-btn"
            >
              <User size={19} strokeWidth={1.8} />
            </Link>

            {/* Wishlist Heart Icon */}
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              style={{
                color: "var(--text-dark)",
                position: "relative",
                width: "44px",
                height: "44px",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "opacity 0.2s ease",
              }}
              className="action-icon-btn"
            >
              <Heart
                size={19}
                strokeWidth={1.8}
                fill={wishlist.length > 0 ? "var(--text-dark)" : "none"}
              />
              {wishlist.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "1px",
                    right: "1px",
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    backgroundColor: "var(--text-dark)",
                    color: "#FFFFFF",
                    fontSize: "9px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Bag Icon with Badge "0" matching reference */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label="Shopping Bag"
              style={{
                color: "var(--text-dark)",
                position: "relative",
                width: "44px",
                height: "44px",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "opacity 0.2s ease",
              }}
              className="action-icon-btn"
            >
              <ShoppingBag size={19} strokeWidth={1.8} />
              <span
                style={{
                  position: "absolute",
                  top: "0px",
                  right: "-2px",
                  width: "15px",
                  height: "15px",
                  borderRadius: "50%",
                  backgroundColor: "var(--text-dark)",
                  color: "#FFFFFF",
                  fontSize: "9.5px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                {totalCartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence initial={false}>
        {mobileMenuOpen && (
        <motion.div
          key="mobile-menu"
          id="mobile-navigation-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
           animate={shouldReduceMotion ? undefined : { opacity: 1 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: "easeOut" }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
          }}
        >
          {/* Backdrop */}
          <motion.div
            onClick={() => setMobileMenuOpen(false)}
            initial={shouldReduceMotion ? false : { opacity: 0 }}
             animate={shouldReduceMotion ? undefined : { opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Drawer Content */}
          <motion.div
            className="mobile-menu-drawer"
            initial={shouldReduceMotion ? false : { x: "-100%" }}
             animate={shouldReduceMotion ? undefined : { x: 0 }}
            exit={shouldReduceMotion ? undefined : { x: "-100%" }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "relative",
              width: "82%",
              maxWidth: "340px",
              height: "100%",
              overflowY: "auto",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
              backgroundColor: "var(--bg-sand)",
              display: "flex",
              flexDirection: "column",
              padding: "max(24px, env(safe-area-inset-top)) 24px max(24px, env(safe-area-inset-bottom))",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "28px",
                paddingBottom: "16px",
                borderBottom: "1px solid var(--border-light)",
              }}
            >
              <NxtvieLogo size={22} color={isDarkMode ? "#FBF9F5" : "#121110"} />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                style={{
                  color: "var(--text-dark)",
                  width: "44px",
                  height: "44px",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Mobile Search */}
            <button
              type="button"
              className="mobile-menu-search"
              onClick={() => {
                setMobileMenuOpen(false);
                setIsSearchOpen(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#EBE7DF",
                borderRadius: "9999px",
                 padding: "10px 16px",
                 marginBottom: "24px",
                 cursor: "pointer",
                 minHeight: "44px",
                 width: "100%",
                 textAlign: "left",
               }}
             >
              <Search size={16} color="#857F76" />
              <span style={{ fontSize: "13px", color: "#857F76" }}>
                Search for products...
              </span>
            </button>

            {/* Mobile Nav Links */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--text-dark)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: "44px",
                  }}
                >
                  <span>{link.label}</span>
                  <ArrowRight size={16} color="#A39D95" />
                </Link>
              ))}
            </div>

            {/* Mobile Bottom Links */}
            <div
              style={{
                marginTop: "auto",
                paddingTop: "24px",
                borderTop: "1px solid var(--border-light)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <Link
                href={user ? "/account" : "/login"}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: "14px",
                  color: "var(--text-dark)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  minHeight: "44px",
                }}
              >
                <User size={18} />
                <span>{user ? "My Account" : "Sign In / Register"}</span>
              </Link>
              <button
                type="button"
                onClick={toggleDarkMode}
                aria-pressed={isDarkMode}
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                style={{
                  fontSize: "14px",
                  color: "var(--text-dark)",
                  display: "flex",
                  alignItems: "center",
                   justifyContent: "space-between",
                   width: "100%",
                   gap: "10px",
                   minHeight: "44px",
                 }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                  <span>{isDarkMode ? "Light mode" : "Dark mode"}</span>
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    width: "34px",
                    height: "20px",
                    borderRadius: "9999px",
                    padding: "3px",
                    display: "flex",
                    justifyContent: isDarkMode ? "flex-end" : "flex-start",
                    backgroundColor: isDarkMode ? "var(--text-dark)" : "var(--bg-sand-muted)",
                    transition: "background-color 0.2s ease",
                  }}
                >
                  <span
                    style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      backgroundColor: isDarkMode ? "var(--bg-sand)" : "var(--text-light)",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                    }}
                  />
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @media (max-width: 900px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
          .header-search-pill {
            display: none !important;
          }
          .mobile-search-btn {
            display: flex !important;
          }
        }
        @media (max-width: 480px) {
          .site-header > .container {
            gap: 0 !important;
          }
          .header-brand-group {
            gap: 8px !important;
          }
          .header-brand-group .nxtvie-logo-wrap {
            gap: 0 !important;
          }
          .header-brand-group .nxtvie-logo-wrap > span {
            display: none !important;
          }
          .header-actions {
            gap: 0 !important;
          }
        }
        @media (hover: hover) and (pointer: fine) {
          .nav-link:hover {
            color: #000000 !important;
            opacity: 0.75;
          }
          .action-icon-btn:hover {
            opacity: 0.7;
            transform: translateY(-1px);
          }
        }
      `}</style>
    </>
  );
}
