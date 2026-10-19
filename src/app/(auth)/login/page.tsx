"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth";
import { NxtvieLogo } from "@/components/layout/nxtvie-logo";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, loginWithGoogle, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect to account
  React.useEffect(() => {
    if (user) {
      router.push("/account");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      await loginWithEmail(email, password);
      router.push("/account");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      router.push("/account");
    } catch (err: any) {
      setErrorMessage(err.message || "Google sign-in was cancelled or failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1.1fr 1fr",
        backgroundColor: "#F5F3ED",
      }}
      className="auth-container"
    >
      {/* Left Visual Editorial Column (Desktop) */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 56px",
          overflow: "hidden",
          backgroundColor: "#151413",
        }}
        className="auth-image-col"
      >
        <img
          src="/images/nxtvie/hero-model.jpg"
          alt="NXTIVE Editorial"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 25%",
            opacity: 0.65,
          }}
        />

        {/* Dark Vignette Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(12,11,10,0.92) 0%, rgba(12,11,10,0.4) 50%, rgba(12,11,10,0.7) 100%)",
          }}
        />

        {/* Top Brand Logo */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <Link href="/" aria-label="Go to home">
            <NxtvieLogo size={26} color="#FFFFFF" />
          </Link>
        </div>

        {/* Bottom Tagline & Philosophy */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: "440px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: "rgba(255, 255, 255, 0.7)",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Indian Roots × Modern Style
          </div>
          <h2
            style={{
              fontSize: "36px",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
              textTransform: "uppercase",
              marginBottom: "14px",
            }}
          >
            Wear Your<br />
            <span style={{ color: "#D19B68" }}>Next</span> Side.
          </h2>
          <p
            style={{
              fontSize: "13.5px",
              color: "rgba(255, 255, 255, 0.75)",
              lineHeight: 1.6,
            }}
          >
            Access your orders, saved pieces, and early access to limited seasonal capsule drops.
          </p>
        </div>
      </div>

      {/* Right Form Column */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "clamp(32px, 5vw, 64px)",
          maxWidth: "520px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {/* Mobile Logo & Return Link */}
        <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12.5px",
              fontWeight: 600,
              color: "#767068",
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            className="back-home-link"
          >
            <ArrowLeft size={14} />
            <span>Back to store</span>
          </Link>

          <div className="auth-mobile-logo" style={{ display: "none" }}>
            <NxtvieLogo size={22} color="#111110" />
          </div>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: "28px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: "#121110",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Sign In
          </h1>
          <p style={{ fontSize: "13.5px", color: "#6A645C" }}>
            Enter your email and password to access your account.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              backgroundColor: "rgba(217, 83, 79, 0.1)",
              border: "1px solid rgba(217, 83, 79, 0.3)",
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "20px",
              color: "#B22222",
              fontSize: "13px",
              lineHeight: 1.4,
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0, marginTop: "1px" }} />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Email Field */}
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
                padding: "12px 16px",
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(0, 0, 0, 0.12)",
                fontSize: "14px",
                color: "#121110",
                outline: "none",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
              className="auth-input"
            />
          </div>

          {/* Password Field */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <label
                htmlFor="password"
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "#2C2926",
                }}
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                style={{
                  fontSize: "11.5px",
                  color: "#7E7870",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Forgot password?
              </Link>
            </div>

            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "12px 42px 12px 16px",
                  borderRadius: "8px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  fontSize: "14px",
                  color: "#121110",
                  outline: "none",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                }}
                className="auth-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#857F76",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || googleLoading}
            style={{
              marginTop: "8px",
              padding: "13px 24px",
              backgroundColor: "#111110",
              color: "#FFFFFF",
              borderRadius: "9999px",
              fontSize: "13.5px",
              fontWeight: 700,
              letterSpacing: "0.02em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.25s ease",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
              opacity: loading ? 0.8 : 1,
            }}
            className="auth-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            margin: "24px 0",
          }}
        >
          <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(0,0,0,0.08)" }} />
          <span style={{ fontSize: "11.5px", color: "#8C867E", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            or continue with
          </span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(0,0,0,0.08)" }} />
        </div>

        {/* Google Sign-in Option */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            backgroundColor: "#FFFFFF",
            color: "#181716",
            border: "1px solid rgba(0, 0, 0, 0.12)",
            borderRadius: "9999px",
            padding: "11px 20px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: googleLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
          }}
          className="google-btn"
        >
          {googleLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Sign in with Google</span>
        </button>

        {/* Switch to Signup */}
        <div style={{ marginTop: "28px", textAlign: "center", fontSize: "13px", color: "#6A645C" }}>
          Don't have an account?{" "}
          <Link
            href="/register"
            style={{
              fontWeight: 700,
              color: "#121110",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Create an account
          </Link>
        </div>
      </div>

      <style jsx global>{`
        .auth-input:focus {
          border-color: #111110 !important;
          box-shadow: 0 0 0 3px rgba(17, 17, 16, 0.08) !important;
        }
        .auth-submit-btn:hover:not(:disabled) {
          background-color: #2E2B27 !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18) !important;
        }
        .google-btn:hover:not(:disabled) {
          background-color: #FAF9F6 !important;
          border-color: rgba(0, 0, 0, 0.25) !important;
        }
        .back-home-link:hover {
          color: #121110 !important;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @media (max-width: 900px) {
          .auth-container {
            grid-template-columns: 1fr !important;
          }
          .auth-image-col {
            display: none !important;
          }
          .auth-mobile-logo {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
