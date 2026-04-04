"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Compass, BookOpen, CheckCircle, Network, Flame } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

type Chapter = {
  id: string;
  date: string;
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  icon: typeof Compass;
  bgImage: string;
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
    bgImage: "/assets/story/genesis.png",
  },
  {
    id: "narrative",
    date: "1990s",
    titleEn: "The Intellectual Narrative",
    titleHi: "बौद्धिक विमर्श का निर्माण",
    descEn: "Establishing a pro-Bharat narrative to challenge colonial viewpoints in academia and public spaces. Framing modern questions through indigenous categories.",
    descHi: "अकादमिक और सार्वजनिक स्थानों पर औपनिवेशिक दृष्टिकोण को चुनौती देने के लिए भारत-समर्थक विमर्श की स्थापना। आधुनिक प्रश्नों को स्वदेशी आधार पर देखना।",
    icon: BookOpen,
    bgImage: "/assets/story/narrative.png",
  },
  {
    id: "action",
    date: "2010s",
    titleEn: "Pillars of Action",
    titleHi: "कार्य के स्तंभ",
    descEn: "Structuring the vision into action through Vimarsh (discourse), Shodh (research), and Prachar (outreach) across numerous universities and state frameworks.",
    descHi: "विमर्श, शोध और प्रचार के माध्यम से पूरे देश के विश्वविद्यालयों और राज्य संरचनाओं में दृष्टि को संगठित कार्य-रूप देना।",
    icon: Network,
    bgImage: "/assets/story/action.png",
  },
  {
    id: "manthan",
    date: "2016 - Present",
    titleEn: "Lok Manthan & Beyond",
    titleHi: "लोकमंथन और व्यापक संवाद",
    descEn: "Organising massive symposia like Lok Manthan to gather diverse thinkers, artists, and scholars to deliberate on the nation's ethos.",
    descHi: "राष्ट्र के मूल विचारों पर चर्चा करने के लिए विविध विचारकों, कलाकारों और विद्वानों को एकत्रित करने के लिए 'लोकमंथन' जैसे बड़े आयोजनों का प्रारंभ।",
    icon: Flame,
    bgImage: "/assets/story/manthan.png",
  },
  {
    id: "future",
    date: "Today",
    titleEn: "Institutional Discipline",
    titleHi: "संस्थागत अनुशासन",
    descEn: "Moving forward, the organisation acts as a disciplined engine ensuring that philosophical reflection translates into verified publication and public reach.",
    descHi: "वर्तमान में संस्था एक अनुशासित इकाई के रूप में कार्य कर रही है, जो यह सुनिश्चित करती है कि दार्शनिक चिंतन प्रमाणित प्रकाशन और समाज तक पहुँचे।",
    icon: CheckCircle,
    bgImage: "/assets/story/future.png",
  },
];

export default function StoryTimeline() {
  const { lang } = useAppContext();
  const isHi = lang === "hi";

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Total segments is chapters.length.
  // The first section is at scroll 0, the last at scroll 100%.
  // So there are `chapters.length - 1` scroll steps.
  const total = chapters.length;

  return (
    <section 
      ref={containerRef} 
      className="relative w-full bg-black text-white" 
      style={{ height: `${total * 100}vh` }}
    >
      {/* 1. Sticky Camera Frame */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        {chapters.map((chapter, i) => (
          <ScrollBackgroundImage
            key={chapter.id}
            chapter={chapter}
            index={i}
            total={total}
            scrollYProgress={scrollYProgress}
          />
        ))}
        {/* Atmospheric vignette over images to ensure text pops */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />
      </div>

      {/* 2. Scrollable Content Stream */}
      <div className="absolute top-0 left-0 w-full" style={{ height: `${total * 100}vh` }}>
        {chapters.map((chapter, i) => (
          <div 
            key={chapter.id} 
            className="h-[100vh] w-full flex items-center justify-center md:justify-start px-4 md:px-[12vw] relative"
          >
            <div className="w-full max-w-2xl mt-32 md:mt-0">
              <ChapterCard chapter={chapter} scrollYProgress={scrollYProgress} index={i} total={total} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Background layer crossfade + scale
function ScrollBackgroundImage({ chapter, index, total, scrollYProgress }: any) {
  const center = index / (total - 1);
  const step = 1 / (total - 1);

  // Crossfade triangle: fades in just before center, fades out just after
  const opacity = useTransform(
    scrollYProgress,
    [center - step * 0.7, center - step * 0.1, center + step * 0.1, center + step * 0.7],
    [0, 1, 1, 0]
  );

  // Slow majestic scale tracking global scroll progress to feel like a slow cinematic push
  // Alternatively, track local progress. 
  // Map this specific chapter's scroll range [center - step, center + step] to scale [1, 1.1]
  const scale = useTransform(
    scrollYProgress,
    [center - step, center + step],
    [1, 1.15]
  );

  return (
    <motion.img
      src={chapter.bgImage}
      style={{ opacity, scale }}
      className="absolute inset-0 w-full h-full object-cover"
      alt={chapter.titleEn}
    />
  );
}

// Glass-morphism card taking full advantage of textures.css
function ChapterCard({ chapter, index, total, scrollYProgress }: any) {
  const Icon = chapter.icon;

  const center = index / (total - 1);
  const step = 1 / (total - 1);

  // Reveal physics: Cards pop in scale and opacity when crossing their center
  const yOffset = useTransform(
    scrollYProgress,
    [center - step * 0.5, center, center + step * 0.5],
    [50, 0, -50]
  );
  
  const opacity = useTransform(
    scrollYProgress,
    [center - step * 0.3, center, center + step * 0.3],
    [0, 1, 0]
  );

  const blurValue = useTransform(
    scrollYProgress,
    [center - step * 0.3, center, center + step * 0.3],
    ["blur(10px)", "blur(0px)", "blur(10px)"]
  );

  // It's already moving physically with native scrolling, 
  // but applying a localized transform heightens the "floating" feeling.
  
  return (
    <motion.div 
      style={{ opacity, y: yOffset, filter: blurValue }}
      className="institution-panel-textured p-8 md:p-12 rounded-[2rem] border border-white/20 shadow-[-10px_10px_50px_rgba(0,0,0,0.5)] hover-lift group"
    >
      <div className="absolute inset-0 bg-black/40 rounded-[2rem] pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex w-16 h-16 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30 group-hover:bg-primary group-hover:text-black transition-colors duration-500">
            <Icon strokeWidth={1.5} className="w-8 h-8" />
          </div>
          <div className="w-0.5 h-12 bg-white/20" />
          <p className="text-xl md:text-2xl font-serif font-bold tracking-widest text-[#FFF3E3]">{chapter.date}</p>
        </div>

        <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-white">{chapter.titleEn}</h3>
        <p className="font-devanagari text-xl md:text-2xl text-white/90 mt-2 mb-8">{chapter.titleHi}</p>
        
        <div className="space-y-5 border-l-2 border-primary/40 pl-5">
          <p className="text-lg md:text-xl text-[#E5E7EB] leading-relaxed font-light block opacity-90">{chapter.descEn}</p>
          <p className="font-devanagari text-lg md:text-xl text-[#D1D5DB] leading-relaxed block opacity-90">{chapter.descHi}</p>
        </div>
      </div>
    </motion.div>
  );
}
