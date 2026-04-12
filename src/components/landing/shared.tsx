import { motion, useScroll, useTransform } from "framer-motion";

export function DeepMandala({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 240" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Outer petals (back layer) */}
      <ellipse cx="120" cy="58" rx="22" ry="56" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.6" transform="rotate(-30 120 120)" />
      <ellipse cx="120" cy="58" rx="22" ry="56" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.6" transform="rotate(30 120 120)" />
      <ellipse cx="120" cy="58" rx="22" ry="56" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.6" transform="rotate(-60 120 120)" />
      <ellipse cx="120" cy="58" rx="22" ry="56" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.6" transform="rotate(60 120 120)" />
      {/* Middle petals */}
      <ellipse cx="120" cy="66" rx="18" ry="46" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.7" transform="rotate(-20 120 120)" />
      <ellipse cx="120" cy="66" rx="18" ry="46" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.7" transform="rotate(20 120 120)" />
      <ellipse cx="120" cy="66" rx="18" ry="46" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.7" transform="rotate(-45 120 120)" />
      <ellipse cx="120" cy="66" rx="18" ry="46" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.7" transform="rotate(45 120 120)" />
      {/* Front petals */}
      <ellipse cx="120" cy="74" rx="14" ry="38" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.8" transform="rotate(-10 120 120)" />
      <ellipse cx="120" cy="74" rx="14" ry="38" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.8" transform="rotate(10 120 120)" />
      <ellipse cx="120" cy="74" rx="14" ry="38" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.8" />
      {/* Left meditating figure */}
      <g transform="translate(100, 105)" opacity="0.35">
        <circle cx="6" cy="0" r="4" fill="currentColor" />
        <path d="M6 4 C6 4 2 8 0 12 C-1 14 2 15 6 14 C10 15 13 14 12 12 C10 8 6 4 6 4Z" fill="currentColor" />
        <path d="M0 10 C-3 9 -4 11 -2 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M12 10 C15 9 16 11 14 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      </g>
      {/* Right meditating figure */}
      <g transform="translate(122, 105)" opacity="0.35">
        <circle cx="6" cy="0" r="4" fill="currentColor" />
        <path d="M6 4 C6 4 2 8 0 12 C-1 14 2 15 6 14 C10 15 13 14 12 12 C10 8 6 4 6 4Z" fill="currentColor" />
        <path d="M0 10 C-3 9 -4 11 -2 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M12 10 C15 9 16 11 14 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

export function EditorialHeading({
  eyebrowEn,
  eyebrowHi,
  titleEn,
  titleHi,
  bodyEn,
  bodyHi,
  align = "left",
}: {
  eyebrowEn: string;
  eyebrowHi: string;
  titleEn: string;
  titleHi: string;
  bodyEn: string;
  bodyHi: string;
  align?: "left" | "center";
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className={align === "center" ? "mx-auto max-w-5xl space-y-6 text-center" : "max-w-5xl space-y-6"}
    >
      <p className="flex items-center justify-center gap-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
        <span>{eyebrowEn}</span>
        <span className="h-px w-8 bg-primary/40"></span>
        <span className="font-devanagari tracking-[0.15em]">{eyebrowHi}</span>
      </p>
      <div className="space-y-4">
        <h2 className="text-deep-ink text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.05]">
          {titleEn}
        </h2>
        <p className="font-devanagari text-2xl font-medium text-foreground/85">
          {titleHi}
        </p>
      </div>
      <div className={align === "center" ? "mx-auto grid max-w-5xl gap-8 pt-4 lg:grid-cols-[1fr_1fr]" : "grid gap-8 pt-4 lg:grid-cols-[1fr_1fr]"}>
        <p className="text-base leading-loose text-muted-foreground sm:text-lg">
          {bodyEn}
        </p>
        <p className="font-devanagari text-base leading-loose text-foreground/80 sm:text-lg">
          {bodyHi}
        </p>
      </div>
    </motion.div>
  );
}
