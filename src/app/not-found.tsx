"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/useT";

export default function NotFound() {
  const t = useT();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md space-y-6"
      >
        {/* Animated mandala-style 404 */}
        <div className="relative inline-block">
          <motion.div
            className="w-32 h-32 rounded-full border-2 border-dashed border-primary/30 mx-auto flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            <motion.div
              className="w-24 h-24 rounded-full border border-primary/20"
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-bold bg-gradient-to-br from-primary to-amber-600 bg-clip-text text-transparent">
              404
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold font-devanagari">
            {t("Page Not Found", "पृष्ठ नहीं मिला")}
          </h1>
          <p className="text-sm text-muted-foreground font-devanagari leading-relaxed">
            {t(
              "The page you're looking for doesn't exist or has been moved.",
              "जो पृष्ठ आप खोज रहे हैं वह मौजूद नहीं है या स्थानांतरित कर दिया गया है।"
            )}
          </p>
          <p className="text-xs text-muted-foreground/60 italic font-devanagari">
            {t(
              '"Not all who wander are lost." — but this page definitely is.',
              '"भटकने वाले सभी खोए नहीं होते" — पर यह पृष्ठ जरूर खो गया है।'
            )}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <Button className="gap-2">
              <Home className="w-4 h-4" />
              {t("Go Home", "मुख्य पृष्ठ")}
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2">
              <Compass className="w-4 h-4" />
              {t("Dashboard", "डैशबोर्ड")}
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
