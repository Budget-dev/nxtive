import React from "react";

interface NxtvieLogoProps {
  color?: string;
  size?: number;
  showText?: boolean;
  className?: string;
}

export function NxtvieLogo({
  color = "currentColor",
  size = 28,
  showText = true,
  className = "",
}: NxtvieLogoProps) {
  return (
    <div
      className={`nxtvie-logo-wrap ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        textDecoration: "none",
        color: color,
        userSelect: "none",
      }}
    >
      {/* Stylized Double Slanted Lightning Bolt Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", flexShrink: 0 }}
      >
        {/* Left Lightning Bolt */}
        <polygon
          points="14,4 5,22 13,22 8,36 21,16 13,16"
          fill={color}
        />
        {/* Right Lightning Bolt */}
        <polygon
          points="27,4 18,22 26,22 21,36 34,16 26,16"
          fill={color}
        />
      </svg>

      {showText && (
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 800,
            fontSize: `${Math.round(size * 0.72)}px`,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            lineHeight: 1,
            color: color,
          }}
        >
          NXTIVE
        </span>
      )}
    </div>
  );
}
