"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { NxtvieLogo } from "@/components/layout/nxtvie-logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Please provide the email address registered with your account.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
    } catch (err: any) {
      // If user-not-found or invalid email, provide user friendly message or still show success to prevent account enumeration
      if (err.code === "auth/user-not-found") {
        setSubmitted(true); // Don't leak registered emails
      } else if (err.code === "auth/invalid-email") {
        setErrorMessage("Please enter a valid email address.");
      } else {
        // Generic error fallback to prevent enumeration
        setSubmitted(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.05fr 1fr",
        minHeight: "100vh",
        backgroundColor: "var(--bg-sand)",
      }}
      className="auth-split-layout"
    >
      {/* Left Column: Form Panel */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 60px",
          minHeight: "100%",
        }}
        className="auth-form-container"
      >
        {/* Top Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" aria-label="NXTIVE Home">
            <NxtvieLogo size={24} color="#111110" />
          </Link>

          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12.5px",
              fontWeight: 600,
              color: "#5D5750",
              transition: "color 0.2s ease",
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Sign In</span>
          </Link>
        </div>

        {/* Center: Reset Form */}
        <div style={{ maxWidth: "420px", width: "100%", margin: "40px auto" }}>
          {submitted ? (
            <div style={{ textAlign: "center" }}>
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

              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                  color: "#121110",
                  marginBottom: "12px",
                }}
              >
                Check Your Inbox
              </h1>

              <p style={{ fontSize: "14px", color: "#6A645C", lineHeight: "1.6", marginBottom: "32px" }}>
                We've sent a password reset link to <strong>{email}</strong>. Follow the instructions in the email to regain access to your NXTIVE account.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <Link
                  href="/login"
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
                  }}
                  className="btn-pill-dark"
                >
                  <span>Return to Sign In</span>
                  <ArrowRight size={14} />
                </Link>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "#777169",
                    textDecoration: "underline",
                    cursor: "pointer",
                    padding: "8px",
                  }}
                >
                  Did not receive an email? Try again
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--accent-next)",
                  marginBottom: "8px",
                }}
              >
                Account Recovery
              </div>

              <h1
                style={{
                  fontSize: "30px",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  textTransform: "uppercase",
                  color: "#121110",
                  marginBottom: "8px",
                }}
              >
                Reset Password
              </h1>

              <p style={{ fontSize: "13.5px", color: "#6A645C", marginBottom: "28px", lineHeight: "1.5" }}>
                Enter the email address associated with your NXTIVE account and we'll send you a link to reset your credentials.
              </p>

              {errorMessage && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    backgroundColor: "rgba(220, 38, 38, 0.08)",
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    marginBottom: "20px",
                    color: "#B91C1C",
                    fontSize: "13px",
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <label
                    htmlFor="email"
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "#2C2926",
                      marginBottom: "6px",
                    }}
                  >
                    Email Address
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={{
                        width: "100%",
                        padding: "12px 16px 12px 40px",
                        borderRadius: "8px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid rgba(0, 0, 0, 0.12)",
                        fontSize: "14px",
                        color: "#121110",
                        outline: "none",
                      }}
                      className="auth-input"
                    />
                    <Mail
                      size={16}
                      color="#8E8880"
                      style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "13px 24px",
                    borderRadius: "9999px",
                    backgroundColor: "#111110",
                    color: "#FFFFFF",
                    fontSize: "13.5px",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    marginTop: "6px",
                  }}
                  className="btn-pill-dark"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Instructions</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ fontSize: "11.5px", color: "#8B857D", textAlign: "center" }}>
          Protected by Firebase Security. Need immediate support?{" "}
          <Link href="/contact" style={{ color: "#111110", fontWeight: 600, textDecoration: "underline" }}>
            Contact Concierge
          </Link>
        </div>
      </div>

      {/* Right Column: Editorial Hero Banner */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#111110",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px",
        }}
        className="auth-hero-banner"
      >
        <Image
          src="/images/nxtvie/hero-model.jpg"
          alt="NXTIVE Fashion Campaign"
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center 20%", opacity: 0.65 }}
          sizes="50vw"
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.4) 100%)",
          }}
        />

        <div style={{ position: "relative", zIndex: 10, maxWidth: "440px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#C59B74",
              marginBottom: "10px",
            }}
          >
            Account Security
          </div>
          <h2
            style={{
              fontSize: "32px",
              fontWeight: 900,
              lineHeight: 1.15,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
              marginBottom: "14px",
            }}
          >
            Seamless Access.
            <br />
            Every Season.
          </h2>
          <p style={{ fontSize: "13.5px", color: "#D6D1C9", lineHeight: 1.6 }}>
            Your account gives you early drop reservations, private sale access, and real-time shipping tracking across all your devices.
          </p>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .auth-split-layout {
            grid-template-columns: 1fr !important;
          }
          .auth-hero-banner {
            display: none !important;
          }
          .auth-form-container {
            padding: 32px 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
