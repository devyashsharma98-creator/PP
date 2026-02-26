"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";

/**
 * ScrollToTop — Floating button that appears after scrolling 300px.
 * O(1) event handler, RAF-throttled for performance.
 */
export function ScrollToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                // Check the main scrollable element (the <main> tag)
                const main = document.querySelector("main");
                const scrollY = main ? main.scrollTop : window.scrollY;
                setVisible(scrollY > 300);
                ticking = false;
            });
        };

        const main = document.querySelector("main");
        const target = main || window;
        target.addEventListener("scroll", onScroll, { passive: true });
        return () => target.removeEventListener("scroll", onScroll);
    }, []);

    const scrollUp = useCallback(() => {
        const main = document.querySelector("main");
        if (main) {
            main.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    transition={{ duration: 0.2 }}
                    onClick={scrollUp}
                    className="fixed bottom-20 md:bottom-6 right-4 z-50 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center hover:scale-110 transition-transform"
                    aria-label="Scroll to top"
                >
                    <ChevronUp className="w-5 h-5" />
                </motion.button>
            )}
        </AnimatePresence>
    );
}
