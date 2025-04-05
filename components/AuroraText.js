"use client";

import React, { memo } from "react";

/**
 * AuroraText - Component that applies beautiful aurora gradient text effect
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Text content to display with aurora effect
 * @param {string} props.className - Additional class names to apply
 * @param {string[]} props.colors - Array of colors used in the gradient
 * @param {number} props.speed - Animation speed multiplier (1 is default)
 */
export const AuroraText = memo(
  ({
    children,
    className = "",
    colors = ["#FF0080", "#7928CA", "#0070F3", "#38bdf8"],
    speed = 1,
  }) => {
    const gradientStyle = {
      backgroundImage: `linear-gradient(135deg, ${colors.join(", ")}, ${colors[0]})`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      animationDuration: `${10 / speed}s`,
    };

    return (
      <span className={`relative inline-block ${className}`}>
        <span className="sr-only">{children}</span>
        <span
          className="relative animate-aurora bg-[length:200%_auto] bg-clip-text text-transparent"
          style={gradientStyle}
          aria-hidden="true"
        >
          {children}
        </span>
      </span>
    );
  }
);

AuroraText.displayName = "AuroraText"; 