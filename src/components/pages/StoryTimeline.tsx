"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent, type MotionValue } from "framer-motion";
import { Compass, BookOpen, CheckCircle, Network, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";

function StoryMandala({ className }: { className?: string }) {
  const petals = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg viewBox="0 0 240 240" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="120" cy="120" r="112" stroke="currentColor" strokeWidth="0.8" opacity="0.18" />
      <circle cx="120" cy="120" r="78" stroke="currentColor" strokeWidth="0.8" opacity="0.22" />
      <circle cx="120" cy="120" r="42" stroke="currentColor" strokeWidth="0.8" opacity="0.28" />
      {petals.map((angle) => (
        <ellipse
          key={angle}
          cx="120"
          cy="62"
          rx="14"
          ry="44"
          fill="currentColor"
          fillOpacity="0.07"
          stroke="currentColor"
          strokeOpacity="0.28"
          strokeWidth="0.8"
          transform={`rotate(${angle} 120 120)`}
        />
      ))}
      <circle cx="120" cy="120" r="16" fill="currentColor" fillOpacity="0.18" />
    </svg>
  );
}

type Chapter = {
  id: string;
  date: string;
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  icon: typeof Compass;
};

const chapters: Chapter[] = [
  {
    id: "genesis",
    date: "1980s",
    titleEn: "The Genesis",
    titleHi: "उद्गम (१९८० दशक)",
    descEn: "Founded under the leadership of Balasaheb Deoras as a platform dedicated to Indian cultural and intellectual heritage, planting the seeds for a continuous civilisational discourse.",
    descHi: "भारतीय सांस्कृतिक और बौद्धिक धरोहर को समर्पित मंच के रूप में इसकी स्थापना हुई, जिसने निरंतर सभ्यतागत विमर्श के बीज बोए।",
    icon: Compass,
  },
  {
    id: "narrative",
    date: "1990s",
    titleEn: "The Intellectual Narrative",
    titleHi: "बौद्धिक विमर्श का निर्माण",
    descEn: "Establishing a pro-Bharat narrative to challenge colonial viewpoints in academia and public spaces. Framing modern questions through indigenous categories.",
    descHi: "अकादमिक और सार्वजनिक स्थानों पर औपनिवेशिक दृष्टिकोण को चुनौती देने के लिए भारत-समर्थक विमर्श की स्थापना। आधुनिक प्रश्नों को स्वदेशी आधार पर देखना।",
    icon: BookOpen,
  },
  {
    id: "action",
    date: "2010s",
    titleEn: "Pillars of Action",
    titleHi: "कार्य के स्तंभ",
    descEn: "Structuring the vision into action through Vimarsh (discourse), Shodh (research), and Prachar (outreach) across numerous universities and state frameworks.",
    descHi: "विमर्श, शोध और प्रचार के माध्यम से पूरे देश के विश्वविद्यालयों और राज्य संरचनाओं में दृष्टि को संगठित कार्य-रूप देना।",
    icon: Network,
  },
  {
    id: "manthan",
    date: "2016 - Present",
    titleEn: "Lok Manthan & Beyond",
    titleHi: "लोकमंथन और व्यापक संवाद",
    descEn: "Organising massive symposia like Lok Manthan to gather diverse thinkers, artists, and scholars to deliberate on the nation's ethos.",
    descHi: "राष्ट्र के मूल विचारों पर चर्चा करने के लिए विविध विचारकों, कलाकारों और विद्वानों को एकत्रित करने के लिए 'लोकमंथन' जैसे बड़े आयोजनों का प्रारंभ।",
    icon: Flame,
  },
  {
    id: "future",
    date: "Today",
    titleEn: "Institutional Discipline",
    titleHi: "संस्थागत अनुशासन",
    descEn: "Moving forward, the organisation acts as a disciplined engine ensuring that philosophical reflection translates into verified publication and public reach.",
    descHi: "वर्तमान में संस्था एक अनुशासित इकाई के रूप में कार्य कर रही है, जो यह सुनिश्चित करती है कि दार्शनिक चिंतन प्रमाणित प्रकाशन और समाज तक पहुँचे।",
    icon: CheckCircle,
  },
];

export default function StoryTimeline() {
  const { lang } = useAppContext();
  const isHi = lang === "hi";
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Calculate dynamic properties based on scroll
  const mandalaRotate = useTransform(smoothProgress, [0, 1], [0, 360]);
  const activeChapterIndexRaw = useTransform(smoothProgress, (val) => Math.min(chapters.length - 1, Math.max(0, Math.floor(val * chapters.length))));

  return (
    <section className="relative overflow-hidden bg-muted/20 border-y border-border/40 pb-20">
      {/* Background Lattice */}
      <div className="absolute inset-0 pravah-lattice-bg opacity-40 pointer-events-none" />

      <div className="home-section-shell pt-24 pb-12 relative z-10">
        <div className="max-w-4xl space-y-4 mb-16">
          <p className="home-editorial-eyebrow">
            <span>Our History</span>
            <span className="font-devanagari tracking-[0.12em]">इतिहास</span>
          </p>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl lg:leading-[1.1]">
              The Story of Pragya Pravah
            </h2>
            <p className="font-devanagari text-xl font-medium text-foreground/90">
              प्रज्ञा प्रवाह की यात्रा: विचार से कार्य तक
            </p>
          </div>
        </div>

        {/* Scrollytelling Container */}
        <div ref={containerRef} className="relative flex flex-col md:flex-row gap-12 lg:gap-24 items-start">
          
          {/* Mobile Visual Progress (Sticky) */}
          <div className="md:hidden sticky top-20 z-20 w-full pt-4 pb-2 bg-gradient-to-b from-background/90 via-background/80 to-transparent backdrop-blur-md">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
               <motion.div 
                 className="h-full bg-primary" 
                 style={{ width: useTransform(smoothProgress, [0, 1], ["0%", "100%"]) }}
               />
            </div>
          </div>

          {/* Chapters (Left Side Scrolling) */}
          <div className="flex-1 w-full relative z-10 pt-4 md:py-[20vh] pb-[10vh]">
            {chapters.map((chapter, i) => (
              <TimelineCard key={chapter.id} chapter={chapter} index={i} isHi={isHi} total={chapters.length} />
            ))}
          </div>

          {/* Desktop Visual Map (Right Side Sticky) */}
          <div className="hidden md:flex sticky top-32 h-[75vh] flex-1 w-full flex-col justify-center items-center institution-panel-textured shadow-2xl p-8 lg:p-12 border-primary/20 bg-background/50">
            {/* The animated dynamic visual core */}
            <div className="relative w-full aspect-square flex items-center justify-center pointer-events-none">
              
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                 <motion.div style={{ rotate: mandalaRotate }} className="w-[120%] h-[120%] text-primary max-w-[600px]">
                    <StoryMandala className="w-full h-full" />
                 </motion.div>
              </div>

              {/* Central Glowing Icon that shifts based on scroll */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-6">
                 <DynamicCenter displayIndex={activeChapterIndexRaw} chapters={chapters} isHi={isHi} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Separate component to handle the dynamic visual center without violating hooks rules
function DynamicCenter({ displayIndex, chapters, isHi }: { displayIndex: MotionValue<number>; chapters: Chapter[]; isHi: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  useMotionValueEvent(displayIndex, "change", (latest: number) => {
    setActiveIndex(latest);
  });

  const activeChapter = chapters[activeIndex] || chapters[0];
  const Icon = activeChapter.icon;

  return (
    <motion.div 
      key={activeIndex}
      initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center z-10"
    >
       <div className="flex w-24 h-24 items-center justify-center rounded-[2rem] bg-background border-2 border-primary/20 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)] text-primary mb-6">
          <Icon strokeWidth={1.5} className="w-12 h-12" />
       </div>
       <p className="text-xl font-bold font-serif text-primary tracking-widest">{activeChapter.date}</p>
       <h3 className="text-2xl font-bold mt-2">{activeChapter.titleEn}</h3>
       <p className="text-lg font-devanagari text-foreground/80 mt-1">{activeChapter.titleHi}</p>
    </motion.div>
  );
}

// Sub-component for each scroll block
function TimelineCard({ chapter, index, isHi, total }: { chapter: any; index: number; isHi: boolean; total: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start 80%", "center center"]
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0.3, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.95, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [50, 0]);

  return (
    <motion.div 
      ref={cardRef}
      style={{ opacity, scale, y }}
      className="mb-[20vh] md:mb-[40vh] last:mb-0 relative group"
    >
      <div className="hidden md:block absolute -left-12 top-0 bottom-[-40vh] w-0.5 bg-border/40 last:hidden" />
      <div className="hidden md:flex absolute -left-12 w-10 md:w-16 h-10 md:h-16 -translate-x-[55%] items-center justify-center rounded-full bg-background border border-primary/30 text-primary z-10 font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-all">
        {index + 1}
      </div>

      <div className="parchment-panel-textured p-8 md:p-10 rounded-[2rem] border border-border/50 shadow-sm hover:border-primary/40 transition-all hover-lift">
        <div className="flex items-center gap-3 mb-4 md:hidden">
          <div className="flex w-10 h-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <chapter.icon className="w-5 h-5" />
          </div>
          <p className="text-lg font-serif font-bold text-primary">{chapter.date}</p>
        </div>

        <h3 className="text-2xl md:text-3xl font-bold tracking-tight">{chapter.titleEn}</h3>
        <p className="font-devanagari text-lg md:text-xl text-foreground/80 mt-1 mb-6">{chapter.titleHi}</p>
        
        <div className="space-y-4 border-l-2 border-primary/20 pl-4 py-2">
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{chapter.descEn}</p>
          <p className="font-devanagari text-base md:text-lg text-foreground/80 leading-relaxed">{chapter.descHi}</p>
        </div>
      </div>
    </motion.div>
  );
}
