"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * PageTransition — wraps page content with a smooth fade + slide animation.
 * Use in layout or individual page wrappers.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <motion.div
            key={pathname}
            // Keep content visible on first paint (critical for slow/mobile hydration).
            // A hidden SSR shell can appear as a blank page on some mobile devices.
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
}
