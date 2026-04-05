"use client";

import { useRef, ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import CountUp from "react-countup";

export function SutraMarquee() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none flex flex-col justify-center gap-12 z-0 select-none opacity-[0.04] mix-blend-screen">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 100 }}
        className="flex whitespace-nowrap text-[6rem] sm:text-[10rem] lg:text-[20rem] font-devanagari font-bold leading-none tracking-widest text-[#FFF3E3]"
      >
        <span className="mx-12 block">विमर्श • शोध • प्रसार • समन्वय •</span>
        <span className="mx-12 block">विमर्श • शोध • प्रसार • समन्वय •</span>
      </motion.div>
    </div>
  );
}

export function OrbitalNetwork() {
  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto flex items-center justify-center my-8">
      {/* Pulse Rings */}
      <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-20" style={{ animationDuration: '4s' }} />
      <div className="absolute inset-4 rounded-full border border-primary/10 animate-ping opacity-10" style={{ animationDuration: '6s' }} />

      {/* Central Hub */}
      <div className="absolute z-10 flex flex-col items-center justify-center w-28 h-28 rounded-full bg-background/90 backdrop-blur-md border-2 border-primary shadow-[0_0_40px_rgba(234,115,23,0.4)]">
        <span className="font-devanagari font-bold text-primary text-2xl drop-shadow-md">प्रज्ञा</span>
        <span className="font-devanagari font-bold text-primary text-xl opacity-90 drop-shadow-md">प्रवाह</span>
      </div>

      {/* Orbit 1: Scholars */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
        className="absolute w-[65%] h-[65%] border border-primary/20 rounded-full flex items-start justify-center"
      >
         <motion.div 
             animate={{ rotate: -360 }} // Counter-rotate so text stays upright
             transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
             className="absolute -top-6 bg-background/80 backdrop-blur-xl border border-primary/30 px-5 py-2.5 rounded-2xl flex flex-col items-center min-w-[130px] shadow-lg shadow-black/40"
         >
            <p className="text-2xl font-bold text-foreground">
               <CountUp end={12000} separator="," suffix="+" duration={3.5} enableScrollSpy scrollSpyOnce />
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium mt-0.5">Scholars</p>
         </motion.div>
      </motion.div>

      {/* Orbit 2: Prants */}
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 55, ease: "linear" }}
        className="absolute w-[85%] h-[85%] border border-primary/20 rounded-full flex items-center justify-end"
      >
         <motion.div 
             animate={{ rotate: 360 }} // Counter-rotate
             transition={{ repeat: Infinity, duration: 55, ease: "linear" }}
             className="absolute -right-8 bg-background/80 backdrop-blur-xl border border-primary/30 px-5 py-2.5 rounded-2xl flex flex-col items-center min-w-[110px] shadow-lg shadow-black/40"
         >
            <p className="text-2xl font-bold text-foreground">
               <CountUp end={42} suffix="+" duration={3} enableScrollSpy scrollSpyOnce />
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium mt-0.5">Regions</p>
         </motion.div>
      </motion.div>

      {/* Orbit 3: Papers */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 75, ease: "linear" }}
        className="absolute w-[100%] h-[100%] border border-dashed border-primary/20 rounded-full flex items-end justify-start"
      >
         <motion.div 
             animate={{ rotate: -360 }} // Counter-rotate
             transition={{ repeat: Infinity, duration: 75, ease: "linear" }}
             className="absolute -left-2 -bottom-2 bg-background/80 backdrop-blur-xl border border-primary/30 px-5 py-2.5 rounded-2xl flex flex-col items-center min-w-[120px] shadow-lg shadow-black/40"
         >
            <p className="text-2xl font-bold text-foreground">
               <CountUp end={350} suffix="+" duration={4} enableScrollSpy scrollSpyOnce />
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium mt-0.5">Published</p>
         </motion.div>
      </motion.div>
    </div>
  );
}

export function MagneticDashboard({ children }: { children: ReactNode }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove({ clientX, clientY }: React.MouseEvent) {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = (clientX - left - width / 2) / 20; 
    const y = (clientY - top - height / 2) / 20;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  // Map the mouse position to rotation values
  const rotateX = useSpring(useTransform(mouseY, [-20, 20], [10, -10]), { damping: 30, stiffness: 150 });
  const rotateY = useSpring(useTransform(mouseX, [-20, 20], [-10, 10]), { damping: 30, stiffness: 150 });

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1500 }}
      className="relative w-full z-20"
    >
      <div 
         style={{ transform: "translateZ(30px)" }} 
         className="institution-panel-textured border border-primary/30 p-5 sm:p-10 rounded-3xl sm:rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] backdrop-blur-2xl bg-background/80 hover:border-primary/50 transition-colors group"
      >
        {children}
      </div>
    </motion.div>
  );
}
