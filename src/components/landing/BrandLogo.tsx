import Link from "next/link";

import { PragyaLogo } from "@/components/PragyaLogo";

export function BrandLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { logoWrap: "h-10 w-10 rounded-xl", logo: "h-7 w-7", text: "text-sm", subtext: "text-[9px]" },
    md: { logoWrap: "h-12 w-12 rounded-2xl", logo: "h-8 w-8", text: "text-base", subtext: "text-[10px]" },
    lg: { logoWrap: "h-16 w-16 rounded-[1.35rem]", logo: "h-11 w-11", text: "text-2xl", subtext: "text-xs" },
  };

  const s = sizes[size];

  return (
    <Link href="/" className="inline-flex items-center gap-3 group" aria-label="Pragya Pravah Home">
      <div
        className={`relative flex shrink-0 items-center justify-center ${s.logoWrap} saffron-gradient ring-1 ring-primary/10 shadow-[0_18px_34px_-24px_hsl(27_100%_50%/0.78)]`}
      >
        <PragyaLogo className={s.logo} />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${s.text} font-bold tracking-[0.2em] uppercase`} style={{ color: "hsl(222 47% 11% / 0.85)" }}>
          Pragya Pravah
        </span>
        <span className={`${s.subtext} mt-0.5 font-devanagari tracking-[0.15em]`} style={{ color: "hsl(24 94% 52% / 0.72)" }}>
          {"\u092A\u094D\u0930\u091C\u094D\u091E\u093E \u092A\u094D\u0930\u0935\u093E\u0939"}
        </span>
      </div>
    </Link>
  );
}
