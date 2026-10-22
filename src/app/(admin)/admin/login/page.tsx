"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/features/admin-dashboard/components/admin-auth-context";
import { Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const { loginAsAdmin } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    if (email.trim().toLowerCase() !== "venkateshchop14@gmail.com") {
      setError("Access denied: Only venkateshchop14@gmail.com is authorized to access the admin operations console.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await loginAsAdmin(email, password);
    } catch (err: any) {
      setError(err?.message || "Invalid credentials or unauthorized account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0A0A0A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "var(--font-display, 'Plus Jakarta Sans', sans-serif)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              background: "#FFFFFF",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0A0A0A",
              fontWeight: 900,
              fontSize: "1.3rem",
              letterSpacing: "-0.02em",
            }}
          >
            N
          </div>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "0.04em",
              marginBottom: "6px",
            }}
          >
            NXTIVE ADMIN
          </h1>
          <p style={{ fontSize: "0.82rem", color: "#6B6B6B" }}>
            Authorized portal strictly for venkateshchop14@gmail.com
          </p>
        </div>

        {/* Login Card */}
        <div
          style={{
            backgroundColor: "#141414",
            border: "1px solid #222222",
            borderRadius: "12px",
            padding: "28px",
          }}
        >
          {error && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                color: "#F87171",
                fontSize: "0.82rem",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#888888",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "6px",
                }}
              >
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={15}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#555555",
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="venkateshchop14@gmail.com"
                  style={{
                    width: "100%",
                    backgroundColor: "#0A0A0A",
                    border: "1px solid #2A2A2A",
                    borderRadius: "8px",
                    padding: "10px 12px 10px 38px",
                    fontSize: "0.88rem",
                    color: "#E5E5E5",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#444444")}
                  onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#888888",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "6px",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={15}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#555555",
                  }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: "100%",
                    backgroundColor: "#0A0A0A",
                    border: "1px solid #2A2A2A",
                    borderRadius: "8px",
                    padding: "10px 40px 10px 38px",
                    fontSize: "0.88rem",
                    color: "#E5E5E5",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#444444")}
                  onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#555555",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                marginTop: "4px",
                padding: "11px",
                borderRadius: "8px",
                background: "#FFFFFF",
                color: "#0A0A0A",
                fontWeight: 700,
                fontSize: "0.88rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                opacity: loading ? 0.6 : 1,
                transition: "opacity 0.2s ease",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <Link
            href="/"
            style={{
              fontSize: "0.8rem",
              color: "#555555",
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
          >
            ← Back to store
          </Link>
        </div>
      </div>
    </div>
  );
}
