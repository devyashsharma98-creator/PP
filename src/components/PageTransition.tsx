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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
}
