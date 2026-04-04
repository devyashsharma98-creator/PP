import Link from "next/link";
import { DeepMandala } from "./shared";

export function BrandLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { mandala: "h-6 w-6", text: "text-sm", subtext: "text-[9px]" },
    md: { mandala: "h-8 w-8", text: "text-base", subtext: "text-[10px]" },
    lg: { mandala: "h-12 w-12", text: "text-2xl", subtext: "text-xs" },
  };

  const s = sizes[size];

  return (
    <Link href="/" className="inline-flex items-center gap-3 group" aria-label="Pragya Pravah Home">
      <div className="relative">
        <DeepMandala className={`${s.mandala} text-primary transition-transform duration-700 group-hover:rotate-45`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-1 w-1 rounded-full bg-primary" />
        </div>
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
