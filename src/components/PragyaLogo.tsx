/**
 * PragyaLogo — compact lotus + meditating figures icon
 * Used in sidebar, navbar, login, and as brand mark throughout the app.
 * Renders in saffron/white to match the institutional colour palette.
 */
export function PragyaLogo({ className, mono }: { className?: string; mono?: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Back petals */}
      <ellipse cx="32" cy="16" rx="7" ry="18" fill={mono ? "currentColor" : "hsl(24 94% 52%)"} opacity="0.18" transform="rotate(-35 32 32)" />
      <ellipse cx="32" cy="16" rx="7" ry="18" fill={mono ? "currentColor" : "hsl(24 94% 52%)"} opacity="0.18" transform="rotate(35 32 32)" />
      <ellipse cx="32" cy="16" rx="7" ry="18" fill={mono ? "currentColor" : "hsl(24 94% 52%)"} opacity="0.18" transform="rotate(-65 32 32)" />
      <ellipse cx="32" cy="16" rx="7" ry="18" fill={mono ? "currentColor" : "hsl(24 94% 52%)"} opacity="0.18" transform="rotate(65 32 32)" />
      {/* Mid petals */}
      <ellipse cx="32" cy="18" rx="6" ry="15" fill={mono ? "currentColor" : "hsl(24 94% 52%)"} opacity="0.3" transform="rotate(-22 32 32)" />
      <ellipse cx="32" cy="18" rx="6" ry="15" fill={mono ? "currentColor" : "hsl(24 94% 52%)"} opacity="0.3" transform="rotate(22 32 32)" />
      {/* Front petal */}
      <ellipse cx="32" cy="20" rx="5" ry="12" fill={mono ? "currentColor" : "hsl(24 94% 52%)"} opacity="0.45" />
      {/* Left figure */}
      <g transform="translate(24.5, 30)" fill={mono ? "currentColor" : "white"} opacity={mono ? "0.7" : "0.95"}>
        <circle cx="3" cy="0" r="2.2" />
        <path d="M3 2.2 C3 2.2 1 4.5 0 6.5 C-0.5 7.5 1 8 3 7.5 C5 8 6.5 7.5 6 6.5 C5 4.5 3 2.2 3 2.2Z" />
        <path d="M0 5.5 C-1.5 5 -2 6 -1 6.5" stroke={mono ? "currentColor" : "white"} strokeWidth="0.8" strokeLinecap="round" fill="none" />
        <path d="M6 5.5 C7.5 5 8 6 7 6.5" stroke={mono ? "currentColor" : "white"} strokeWidth="0.8" strokeLinecap="round" fill="none" />
      </g>
      {/* Right figure */}
      <g transform="translate(33.5, 30)" fill={mono ? "currentColor" : "hsl(24 94% 52%)"} opacity={mono ? "0.7" : "0.95"}>
        <circle cx="3" cy="0" r="2.2" />
        <path d="M3 2.2 C3 2.2 1 4.5 0 6.5 C-0.5 7.5 1 8 3 7.5 C5 8 6.5 7.5 6 6.5 C5 4.5 3 2.2 3 2.2Z" />
        <path d="M0 5.5 C-1.5 5 -2 6 -1 6.5" stroke={mono ? "currentColor" : "hsl(24 94% 52%)"} strokeWidth="0.8" strokeLinecap="round" fill="none" />
        <path d="M6 5.5 C7.5 5 8 6 7 6.5" stroke={mono ? "currentColor" : "hsl(24 94% 52%)"} strokeWidth="0.8" strokeLinecap="round" fill="none" />
      </g>
      {/* Base arc */}
      <path d="M20 40 Q32 46 44 40" stroke={mono ? "currentColor" : "hsl(24 94% 52%)"} strokeWidth="1" strokeLinecap="round" opacity="0.2" fill="none" />
    </svg>
  );
}

/** Compact icon-only version for favicon-sized use */
export function PragyaLogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Back petals */}
      <ellipse cx="16" cy="8" rx="3.5" ry="9" fill="hsl(24 94% 52%)" opacity="0.2" transform="rotate(-35 16 16)" />
      <ellipse cx="16" cy="8" rx="3.5" ry="9" fill="hsl(24 94% 52%)" opacity="0.2" transform="rotate(35 16 16)" />
      <ellipse cx="16" cy="8" rx="3.5" ry="9" fill="hsl(24 94% 52%)" opacity="0.2" transform="rotate(-65 16 16)" />
      <ellipse cx="16" cy="8" rx="3.5" ry="9" fill="hsl(24 94% 52%)" opacity="0.2" transform="rotate(65 16 16)" />
      {/* Mid petals */}
      <ellipse cx="16" cy="9" rx="3" ry="7.5" fill="hsl(24 94% 52%)" opacity="0.35" transform="rotate(-22 16 16)" />
      <ellipse cx="16" cy="9" rx="3" ry="7.5" fill="hsl(24 94% 52%)" opacity="0.35" transform="rotate(22 16 16)" />
      {/* Front petal */}
      <ellipse cx="16" cy="10" rx="2.5" ry="6" fill="hsl(24 94% 52%)" opacity="0.5" />
      {/* Left figure */}
      <g transform="translate(12, 15)" fill="white" opacity="0.9">
        <circle cx="1.5" cy="0" r="1.2" />
        <path d="M1.5 1.2 C1.5 1.2 0.5 2.4 0 3.4 C-0.3 4 0.5 4.2 1.5 4 C2.5 4.2 3.3 4 3 3.4 C2.5 2.4 1.5 1.2 1.5 1.2Z" />
      </g>
      {/* Right figure */}
      <g transform="translate(16.5, 15)" fill="hsl(24 94% 52%)" opacity="0.9">
        <circle cx="1.5" cy="0" r="1.2" />
        <path d="M1.5 1.2 C1.5 1.2 0.5 2.4 0 3.4 C-0.3 4 0.5 4.2 1.5 4 C2.5 4.2 3.3 4 3 3.4 C2.5 2.4 1.5 1.2 1.5 1.2Z" />
      </g>
    </svg>
  );
}
