import Link from "next/link";
import { PragyaLogo } from "@/components/PragyaLogo";

export function BrandLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { logo: "h-7 w-7", text: "text-sm", subtext: "text-[9px]" },
    md: { logo: "h-9 w-9", text: "text-base", subtext: "text-[10px]" },
    lg: { logo: "h-14 w-14", text: "text-2xl", subtext: "text-xs" },
  };

  const s = sizes[size];

  return (
    <Link href="/" className="inline-flex items-center gap-3 group" aria-label="Pragya Pravah Home">
      <div className="relative shrink-0 rounded-xl saffron-gradient shadow-lg shadow-primary/20 flex items-center justify-center p-0.5">
        <PragyaLogo className={s.logo} />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${s.text} font-bold tracking-[0.2em] uppercase`} style={{ color: "hsl(222 47% 11% / 0.85)" }}>
          Pragya Pravah
        </span>
        <span className={`${s.subtext} font-devanagari tracking-[0.15em] mt-0.5`} style={{ color: "hsl(24 94% 52% / 0.5)" }}>
          प्रज्ञा प्रवाह
        </span>
      </div>
    </Link>
  );
}
