/**
 * PragyaLogo — bold lotus-inspired institutional mark.
 * Kept intentionally simple so the logo stays readable at small sizes.
 */
export function PragyaLogo({ className, mono }: { className?: string; mono?: boolean }) {
  const saffron = mono ? "currentColor" : "hsl(27 96% 52%)";
  const saffronDeep = mono ? "currentColor" : "hsl(20 86% 42%)";
  const saffronLight = mono ? "currentColor" : "hsl(39 100% 71%)";
  const base = mono ? "currentColor" : "hsl(28 78% 28%)";
  const glow = mono ? "currentColor" : "hsl(27 96% 52%)";

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pp-lotus-main" x1="32" y1="10" x2="32" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={saffronLight} />
          <stop offset="0.58" stopColor={saffron} />
          <stop offset="1" stopColor={saffronDeep} />
        </linearGradient>
        <linearGradient id="pp-lotus-side" x1="18" y1="18" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={saffronLight} />
          <stop offset="1" stopColor={saffron} />
        </linearGradient>
      </defs>

      <circle cx="32" cy="32" r="24" fill={glow} opacity={mono ? 0.12 : 0.08} />
      <path d="M32 8C38 14 39.5 22 32 30C24.5 22 26 14 32 8Z" fill={mono ? saffron : "url(#pp-lotus-main)"} />
      <path d="M18 18C26 18.5 31 24 30 32C22 31.5 17.5 26 18 18Z" fill={mono ? saffron : "url(#pp-lotus-side)"} opacity={0.95} />
      <path d="M46 18C38 18.5 33 24 34 32C42 31.5 46.5 26 46 18Z" fill={mono ? saffron : "url(#pp-lotus-side)"} opacity={0.95} />
      <path d="M24 30C29 31.5 31.5 36 30 42C24.5 41 21.5 36.5 24 30Z" fill={saffron} opacity={0.92} />
      <path d="M40 30C35 31.5 32.5 36 34 42C39.5 41 42.5 36.5 40 30Z" fill={saffron} opacity={0.92} />
      <path d="M32 20C35 24 35.5 29 32 33C28.5 29 29 24 32 20Z" fill={mono ? saffronLight : "white"} opacity={mono ? 0.85 : 0.96} />
      <circle cx="32" cy="36.5" r="2" fill={mono ? saffronLight : "white"} opacity={mono ? 0.8 : 0.9} />
      <path d="M15 39C19.5 44.5 25.5 48 32 48C38.5 48 44.5 44.5 49 39" stroke={base} strokeWidth="3.4" strokeLinecap="round" opacity={mono ? 0.65 : 0.95} />
      <path d="M20 46C23.5 49 27.6 50.5 32 50.5C36.4 50.5 40.5 49 44 46" stroke={base} strokeWidth="2.5" strokeLinecap="round" opacity={mono ? 0.48 : 0.72} />
    </svg>
  );
}

export function PragyaLogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="12" fill="hsl(27 96% 52%)" opacity="0.08" />
      <path d="M16 4.5C19 7.5 19.5 11.5 16 15.5C12.5 11.5 13 7.5 16 4.5Z" fill="hsl(27 96% 52%)" />
      <path d="M9.5 9.5C14 9.7 16.8 12.7 16.2 17C11.7 16.7 9.2 13.8 9.5 9.5Z" fill="hsl(33 100% 68%)" />
      <path d="M22.5 9.5C18 9.7 15.2 12.7 15.8 17C20.3 16.7 22.8 13.8 22.5 9.5Z" fill="hsl(33 100% 68%)" />
      <path d="M16 10C17.6 12.1 17.8 14.5 16 16.6C14.2 14.5 14.4 12.1 16 10Z" fill="white" opacity="0.95" />
      <path d="M7.5 19.5C9.8 22.2 12.7 24 16 24C19.3 24 22.2 22.2 24.5 19.5" stroke="hsl(28 78% 28%)" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 23C11.8 24.4 13.8 25.2 16 25.2C18.2 25.2 20.2 24.4 22 23" stroke="hsl(28 78% 28%)" strokeWidth="1.5" strokeLinecap="round" opacity="0.72" />
    </svg>
  );
}
