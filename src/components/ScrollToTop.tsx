"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";

/**
 * ScrollToTop — Floating button that appears after scrolling 300px.
 * O(1) event handler, RAF-throttled for performance.
 */
export function ScrollToTop() {
    const [visible, setVisible] = useState(false);
    const mainRef = useRef<Element | null>(null);

    useEffect(() => {
        mainRef.current = document.querySelector("main");

        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const scrollY = mainRef.current ? mainRef.current.scrollTop : window.scrollY;
                setVisible(scrollY > 300);
                ticking = false;
            });
        };

        const target = mainRef.current || window;
        target.addEventListener("scroll", onScroll, { passive: true });
        return () => target.removeEventListener("scroll", onScroll);
    }, []);

    const scrollUp = useCallback(() => {
        if (mainRef.current) {
            mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
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
