import { motion, useScroll, useTransform } from "framer-motion";

export function DeepMandala({ className }: { className?: string }) {
  const petals = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <svg viewBox="0 0 240 240" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="120" cy="120" r="112" stroke="currentColor" strokeWidth="0.8" opacity="0.12" />
      <circle cx="120" cy="120" r="78" stroke="currentColor" strokeWidth="1" opacity="0.18" />
      <circle cx="120" cy="120" r="42" stroke="currentColor" strokeWidth="1.2" opacity="0.25" />
      {petals.map((angle) => (
        <ellipse
          key={angle}
          cx="120"
          cy="62"
          rx="12"
          ry="48"
          fill="currentColor"
          fillOpacity="0.04"
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="0.5"
          transform={`rotate(${angle} 120 120)`}
        />
      ))}
      <circle cx="120" cy="120" r="16" fill="currentColor" fillOpacity="0.15" />
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
