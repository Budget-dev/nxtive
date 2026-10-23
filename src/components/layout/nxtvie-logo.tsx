"use client";

import React from "react";

interface NxtvieLogoProps {
  color?: string;
  size?: number;
  showText?: boolean;
  className?: string;
  style?: React.CSSProperties;
  height?: number;
}

export function NxtvieLogo({
  color = "currentColor",
  size = 28,
  className = "",
  style,
  height,
}: NxtvieLogoProps) {
  const isWhite =
    color === "#FFFFFF" ||
    color === "#FBF9F5" ||
    color === "#ffffff" ||
    color === "white";

  const logoHeight = height || Math.max(size, 26);

  return (
    <div
      className={`nxtive-logo-wrap ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        lineHeight: 1,
        userSelect: "none",
        ...style,
      }}
    >
      {/* Official NXTIVE Lightning Logo image only - no additional text */}
      <img
        src="https://justtca.sirv.com/NXTIVE%20Lightning%20Logo.png"
        alt="NXTIVE"
        height={logoHeight}
        style={{
          height: `${logoHeight}px`,
          width: "auto",
          maxWidth: "100%",
          display: "block",
          objectFit: "contain",
          filter: isWhite ? "brightness(0) invert(1)" : "none",
          transition: "filter 0.15s ease",
        }}
        onError={(e) => {
          // Fallback to local copy if network fails or offline
          (e.currentTarget as HTMLImageElement).src = isWhite
            ? "/images/logo/nxtive-lightning-logo-white.png"
            : "/images/logo/nxtive-lightning-logo.png";
        }}
      />
    </div>
  );
}

