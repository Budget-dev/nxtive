"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth";
import { NxtvieLogo } from "@/components/layout/nxtvie-logo";

export default function RegisterPage() {
  const router = useRouter();
  const { signupWithEmail, loginWithGoogle, user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-switch 127.0.0.1 to localhost to satisfy Google OAuth authorized domains
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.hostname === "127.0.0.1") {
      const newUrl = window.location.href.replace("127.0.0.1", "localhost");
      window.location.replace(newUrl);
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("Please agree to the Terms of Service to proceed.");
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      await signupWithEmail(email, password, name);
      router.push("/");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res && res.user) {
        router.push("/");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Google sign-up was cancelled or failed.");
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
          src="/images/nxtvie/banner-urban-essentials-hd.jpg"
          alt="NXTIVE Community"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 30%",
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
            Join The NXTIVE Collective
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
            Exclusive Drops.<br />
            Everyday <span style={{ color: "#D19B68" }}>Elevated</span>.
          </h2>
          <p
            style={{
              fontSize: "13.5px",
              color: "rgba(255, 255, 255, 0.75)",
              lineHeight: 1.6,
            }}
          >
            Become a member to track orders, save curated pieces, and unlock priority early access to limited seasonal runs.
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
        <div style={{ marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
        <div style={{ marginBottom: "24px" }}>
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
            Create Account
          </h1>
          <p style={{ fontSize: "13.5px", color: "#6A645C" }}>
            Join NXTIVE for personalized curation, fast checkout, and drop alerts.
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
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Full Name Field */}
          <div>
            <label
              htmlFor="name"
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
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. Aryan Sharma"
              style={{
                width: "100%",
                padding: "11px 16px",
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
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "11px 16px",
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
            <label
              htmlFor="password"
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
              Password (min. 6 characters)
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "11px 42px 11px 16px",
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

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor="confirm-password"
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
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "11px 16px",
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

          {/* Terms Agreement */}
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              fontSize: "12px",
              color: "#6B655D",
              cursor: "pointer",
              userSelect: "none",
              marginTop: "4px",
            }}
          >
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              style={{
                accentColor: "#111110",
                cursor: "pointer",
                width: "14px",
                height: "14px",
                marginTop: "2px",
              }}
            />
            <span>
              I agree to the NXTIVE <Link href="#" style={{ color: "#111110", textDecoration: "underline" }}>Terms of Service</Link> and <Link href="#" style={{ color: "#111110", textDecoration: "underline" }}>Privacy Policy</Link>.
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || googleLoading}
            style={{
              marginTop: "10px",
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
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
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
          onClick={handleGoogleSignUp}
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
          <span>Sign up with Google</span>
        </button>

        {/* Switch to Login */}
        <div style={{ marginTop: "26px", textAlign: "center", fontSize: "13px", color: "#6A645C" }}>
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              fontWeight: 700,
              color: "#121110",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Sign in
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
