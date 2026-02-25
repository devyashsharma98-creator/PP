"use client";

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, ChevronDown, ChevronRight, ExternalLink, Youtube, BookOpen, Library,
  Swords, Shield, Target, MessagesSquare, AlertTriangle, Globe,
} from 'lucide-react';
import { useT } from '@/lib/useT';

// ── Vimarsh Bindu data ──────────────────────────────────────────────────────

const ATMA_BODH_BINDU = [
  {
    group: "आत्म बोध",
    en: "Self-Awareness",
    icon: Target,
    color: "text-orange-500",
    border: "border-orange-500/25",
    bg: "bg-orange-500/8",
    items: [
      { hi: "स्व", en: "स्व — Indigenous identity and civilisational self-consciousness" },
      { hi: "हिंदुत्व", en: "हिंदुत्व — Philosophical, cultural and civilisational understanding" },
      { hi: "भारत शत्रु बोध", en: "Knowing the forces opposed to India and their methods" },
    ],
  },
  {
    group: "विभाजन की शक्तियाँ",
    en: "Forces of Division",
    icon: AlertTriangle,
    color: "text-red-500",
    border: "border-red-500/25",
    bg: "bg-red-500/8",
    items: [
      { hi: "Cultural Marxism", en: "Cultural Marxism — ideological framework targeting Dharmic civilisation" },
      { hi: "Global Market Forces", en: "Global Market Forces — homogenising cultural and economic pressures" },
      { hi: "अतिवादी इस्लाम", en: "Radical Islamism — extremist spread targeting Bharatiya social fabric" },
      { hi: "प्रसारवादी चर्च", en: "Missionary Church — proselytisation targeting tribal and marginalised communities" },
    ],
  },
  {
    group: "सामाजिक अलगाव के लक्षित समूह",
    en: "Targeted Groups (Social Alienation)",
    icon: Shield,
    color: "text-blue-500",
    border: "border-blue-500/25",
    bg: "bg-blue-500/8",
    items: [
      { hi: "दलित विमर्श", en: "Dalit discourse — counter divisive anti-India narratives" },
      { hi: "जनजातीय विमर्श", en: "Tribal discourse — restore connection with Bharatiya identity" },
      { hi: "युवा विमर्श", en: "Youth discourse — ground youth in civilisational values" },
      { hi: "महिला विमर्श", en: "Women's discourse — Shakti-centred counter-narrative to western feminism" },
    ],
  },
  {
    group: "भौगोलिक अलगाव के लक्षित क्षेत्र",
    en: "Targeted Regions (Geographic Alienation)",
    icon: Globe,
    color: "text-emerald-500",
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/8",
    items: [
      { hi: "पंजाब", en: "Punjab — Sikh-Hindu unity narratives, counter Khalistan propaganda" },
      { hi: "कश्मीर", en: "Kashmir — restore Kashmiri Pandit history, cultural integration" },
      { hi: "उत्तर-पूर्व भारत", en: "North-East — tribal integration, counter Christian separatist narratives" },
      { hi: "उत्तर-दक्षिण विमर्श", en: "North-South divide — counter Dravidian ideology's anti-Hindi/Hindu frames" },
    ],
  },
];

const OTHER_BINDU = [
  "राष्ट्रीय सुरक्षा",
  "राष्ट्रीय स्वयंसेवक संघ",
  "आर्थिक विकास",
  "संविधान",
  "वैश्विक विषय",
  "सिख अध्ययन",
  "पड़ौसी देश",
  "बौद्ध अध्ययन",
  "कला, संस्कृति, इतिहास",
];

// ── Topic explorer data ──────────────────────────────────────────────────────

const topics = [
  {
    id: 1, title: 'भारतीय शिक्षा पद्धति', english: 'Indian Education System',
    desc: 'NEP 2020 aligns with India\'s holistic gurukul tradition. Counter the colonial-era rote-learning narrative and promote Bharatiya shiksha drishti.',
    links: ['NEP 2020 विश्लेषण — Vishwa Samvad Kendra', 'गुरुकुल और आधुनिक शिक्षा — Shodh Aayam', 'UGC Guideline — Sangh Stand'],
    videos: ['NEP 2020 पर विस्तृत चर्चा · 45 min', 'भारतीय शिक्षा परंपरा · 30 min'],
    books: ['Arthashastra - Kautilya', 'Yoga Sutras - Patanjali'],
  },
  {
    id: 2, title: 'स्वदेशी अर्थव्यवस्था', english: 'Self-reliant Economy',
    desc: 'Atmanirbhar Bharat is rooted in Deendayal Upadhyaya\'s Integral Humanism. Counter globalization-only narrative with Swadeshi economics.',
    links: ['स्वदेशी आंदोलन और आत्मनिर्भर भारत', 'ग्रामीण अर्थव्यवस्था का पुनरुद्धार', 'Integral Humanism — Policy Analysis'],
    videos: ['स्वदेशी का अर्थशास्त्र · 38 min', 'Deendayal ji ke Vichar · 52 min'],
    books: ['Arthashastra - Kautilya'],
  },
  {
    id: 3, title: 'वैदिक गणित', english: 'Vedic Mathematics',
    desc: 'Vedic Math sutras enable significantly faster calculation. Counter the narrative that India contributed little to mathematics.',
    links: ['वैदिक गणित — 16 सूत्र', 'Brahmagupta aur Aryabhatta ke Yogdaan', 'Competitive Exams mein Vedic Math'],
    videos: ['Vedic Math Basics · 25 min', 'Brahmagupta ka Yogdaan · 20 min'],
    books: ['Shulba Sutras', 'Surya Siddhanta'],
  },
  {
    id: 4, title: 'आयुर्वेद एवं स्वास्थ्य', english: 'Ayurveda & Health',
    desc: 'Ayurveda is a complete science of life. Challenge narratives that dismiss traditional medicine as "unscientific".',
    links: ['आयुर्वेद — आधुनिक विज्ञान की कसौटी पर', 'COVID aur Ayurveda ka Yogdan', 'Charaka Samhita — Modern Relevance'],
    videos: ['Ayurveda vs Allopathy · 42 min', 'Pancha Karma Science · 28 min'],
    books: ['Charaka Samhita'],
  },
  {
    id: 5, title: 'पर्यावरण संरक्षण', english: 'Environmental Conservation',
    desc: 'India\'s ancient tradition of nature worship and forest conservation is the world\'s first environmental movement.',
    links: ['भारतीय परंपरा और पर्यावरण', 'Vriksha Ayurveda — Ancient Text', 'Climate Change aur Bharatiya Drishti'],
    videos: ['Ancient India\'s Ecology · 33 min', 'River Conservation Traditions · 27 min'],
    books: ['Brihat Samhita - Varahamihira'],
  },
  {
    id: 6, title: 'ग्राम स्वराज', english: 'Village Self-governance',
    desc: 'India\'s strength lies in self-sufficient villages. Gandhi\'s gram swaraj vision aligns with the ancient panchayat system.',
    links: ['Gram Swaraj — Gandhi aur Deendayal', 'Panchayati Raj ka Itihas', 'Adarsh Gram Yojana Analysis'],
    videos: ['Gram Swaraj Vision · 35 min', 'Panchayat System · 22 min'],
    books: ['Arthashastra - Kautilya'],
  },
  {
    id: 7, title: 'भारतीय विज्ञान परंपरा', english: 'Indian Scientific Tradition',
    desc: 'India pioneered metallurgy, astronomy, and medicine. The Delhi Iron Pillar proves superior ancient metallurgy — over a thousand years old with no rust.',
    links: ['Delhi Iron Pillar ka Rahasya', 'Varahamihira ki Khagol Vigyan', 'Nagarjuna — Rasashastra'],
    videos: ['Ancient Indian Scientists · 48 min', 'Iron Pillar Mystery Solved · 18 min'],
    books: ['Rasaratna Samucchaya', 'Brihat Samhita - Varahamihira', 'Surya Siddhanta'],
  },
  {
    id: 8, title: 'सामाजिक समरसता', english: 'Social Harmony',
    desc: 'India\'s approach is rooted in unity in diversity — not uniformity. Counter divisive identity narratives with the concept of social cohesion.',
    links: ['Samajik Samarasta — Sangh Drishti', 'Ekta aur Anekta', 'Tribal Traditions and Mainstream'],
    videos: ['Social Harmony in India · 40 min', 'Varna System Misunderstood · 30 min'],
    books: ['Natyashastra - Bharata'],
  },
  {
    id: 9, title: 'राष्ट्रीय सुरक्षा', english: 'National Security',
    desc: 'India\'s security challenges require culturally-rooted strategic thinking. Chanakya Neeti remains deeply relevant.',
    links: ['Chanakya Neeti — Modern Application', 'Border Security Analysis', 'Cyber Security — Bharatiya Drishti'],
    videos: ['Chanakya on Security · 55 min', 'India\'s Strategic Culture · 38 min'],
    books: ['Arthashastra - Kautilya'],
  },
  {
    id: 10, title: 'सांस्कृतिक विरासत', english: 'Cultural Heritage',
    desc: 'India\'s cultural heritage is a living tradition, not museum artifacts. Counter cultural colonialism with pride in Bharatiya civilization.',
    links: ['Temple Architecture — Science Behind', 'Classical Arts Revival', 'Cultural Heritage Protection'],
    videos: ['Temple Science · 45 min', 'Bharatiya Kala Parampara · 32 min'],
    books: ['Natyashastra - Bharata', 'Vastu Shastra Vimarsh'],
  },
  {
    id: 11, title: 'युवा नेतृत्व विकास', english: 'Youth Leadership Development',
    desc: 'India\'s youth must be grounded in national values while being globally competent. Vivekananda\'s vision remains the guiding light.',
    links: ['Swami Vivekananda on Youth', 'Leadership — Bharatiya Model', 'Youth and Nation Building'],
    videos: ['Yuva Shakti · 28 min', 'Vivekananda\'s Call to Youth · 42 min'],
    books: ['Yoga Sutras - Patanjali'],
  },
  {
    id: 12, title: 'महिला सशक्तिकरण', english: "Women's Empowerment",
    desc: 'India\'s tradition of Shakti worship represents the world\'s oldest feminine power philosophy. Counter imported western feminist frameworks.',
    links: ['Bharat mein Nari ka Sthan', 'Gargi aur Maitreyi — Ancient Scholars', 'Modern Women in Dharma'],
    videos: ['Nari Shakti in India · 35 min', 'Ancient Women Scholars · 25 min'],
    books: ['Natyashastra - Bharata'],
  },
  {
    id: 13, title: 'डिजिटल भारत', english: 'Digital India',
    desc: 'India must lead the digital revolution on its own cultural terms, not import Silicon Valley\'s social model wholesale.',
    links: ['AI Summit — Bharatiya Drishti', 'Data Sovereignty India', 'UPI — Digital Revolution'],
    videos: ['India\'s Digital Leap · 30 min', 'AI and Indian Values · 40 min'],
    books: ['Surya Siddhanta'],
  },
  {
    id: 14, title: 'कृषि एवं जल संरक्षण', english: 'Agriculture & Water Conservation',
    desc: 'India\'s ancient stepwells and water harvesting systems are blueprints for sustainable agriculture and water management.',
    links: ['Kisan Andolan — Sangh Stand', 'Ancient Water Harvesting Systems', 'Organic Farming — Ancient Wisdom'],
    videos: ['Stepwells of India · 22 min', 'Traditional Farming · 38 min'],
    books: ['Brihat Samhita - Varahamihira'],
  },
  {
    id: 15, title: 'भारतीय भाषाओं का संवर्धन', english: 'Promotion of Indian Languages',
    desc: 'Hindi and India\'s classical languages carry civilization-level knowledge. Counter English-only elitism in public discourse.',
    links: ['Sanskrit aur Modern Science', 'Hindi Rashtrabhasha Andolan', 'Regional Language Promotion'],
    videos: ['Sanskrit Science · 35 min', 'Language and Culture · 28 min'],
    books: ['Natyashastra - Bharata'],
  },
];

export default function Vimarsh() {
  const tr = useT();
  const isHi = tr('en', 'hi') === 'hi';
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = topics.filter(t =>
    t.title.includes(search) || t.english.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessagesSquare className="w-5 h-5 text-violet-500" />
            <h1 className="text-2xl font-bold font-devanagari">{tr('Vimarsh', 'विमर्श')}</h1>
          </div>
          <p className="text-muted-foreground text-sm font-devanagari">
            {tr('Discourse, Assertion & Counter — Mandan-Khandan', 'विचार विमर्श — मंडन और खंडन')}
          </p>
        </div>
      </div>

      {/* ── SECTION: मंडन-खंडन Framework ──────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-violet-500/30 to-transparent" />
          <span className="text-xs uppercase tracking-widest text-violet-500 font-semibold px-2 flex items-center gap-1.5">
            <Swords className="w-3 h-3" />
            {tr('Mandan-Khandan Framework', 'मंडन-खंडन की रणनीति')}
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-violet-500/30 to-transparent" />
        </div>

        {/* Framework explainer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl border border-violet-500/25 bg-violet-500/5 p-5 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/8 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="font-devanagari font-semibold text-sm text-emerald-600 dark:text-emerald-400">मंडन</span>
                <span className="text-[10px] text-muted-foreground">Mandan · Assertion</span>
              </div>
              <p className={`text-xs text-foreground/65 leading-relaxed ${isHi ? 'font-devanagari' : ''}`}>
                {isHi
                  ? 'सत्य का, भारत की परंपरा का, और भारतीय दृष्टि का सार्थक मंडन करना। तथ्यों की पुनर्स्थापना।'
                  : 'Affirming truth, India\'s tradition and the Bharatiya worldview with evidence. Restoration of historical and civilisational facts.'}
              </p>
            </div>
            <div className="rounded-lg border border-red-500/20 bg-red-500/8 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-red-500" />
                <span className="font-devanagari font-semibold text-sm text-red-600 dark:text-red-400">खंडन</span>
                <span className="text-[10px] text-muted-foreground">Khandan · Counter</span>
              </div>
              <p className={`text-xs text-foreground/65 leading-relaxed ${isHi ? 'font-devanagari' : ''}`}>
                {isHi
                  ? 'भारत एवं विश्व में चल रहे कुप्रचार का तथ्यात्मक खंडन करना। नकारात्मक विमर्शों का उत्तर देना।'
                  : 'Factual counter of anti-India propaganda circulating in India and globally. Responding to negative narratives with data and reasoning.'}
              </p>
            </div>
          </div>
          <p className={`text-xs text-muted-foreground leading-relaxed ${isHi ? 'font-devanagari' : ''}`}>
            {isHi
              ? 'यह विमर्श का मूल ढाँचा है। विमर्श बिंदुओं हेतु कार्यकर्ताओं को दायित्व दिया जाता है एवं आवश्यक कार्यक्रमों की रचना और सामग्री निर्माण होता है।'
              : 'This is the core framework of Vimarsh. Workers are assigned responsibility for specific discourse points, and necessary programmes and materials are created to address them.'}
          </p>
        </motion.div>

        {/* Vimarsh Bindu — grouped */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            {tr('Vimarsh Bindu (Discourse Points)', 'विमर्श बिंदु')}
          </h3>
          {ATMA_BODH_BINDU.map((group, gi) => (
            <motion.div
              key={gi}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + gi * 0.06 }}
              className={`glass-card rounded-xl border ${group.border} ${group.bg} p-4 space-y-3`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${group.bg} border ${group.border} flex items-center justify-center`}>
                  <group.icon className={`w-4 h-4 ${group.color}`} />
                </div>
                <div>
                  <h4 className={`font-semibold text-sm font-devanagari ${group.color}`}>{group.group}</h4>
                  <p className="text-[10px] text-muted-foreground">{group.en}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {group.items.map((item, ii) => (
                  <div key={ii} className="flex items-start gap-2">
                    <ChevronRight className={`w-3.5 h-3.5 ${group.color} mt-0.5 shrink-0`} />
                    <div>
                      <span className={`font-devanagari text-xs text-foreground/70 font-medium`}>{item.hi}</span>
                      {!isHi && <p className="text-[10px] text-muted-foreground">{item.en}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Other bindu */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="glass-card rounded-xl border border-border/60 p-4 space-y-3"
          >
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {tr('Additional Vimarsh Points', 'अन्य विमर्श बिंदु')}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {OTHER_BINDU.map((b, i) => (
                <span key={i} className="font-devanagari text-[11px] bg-muted px-2.5 py-0.5 rounded-full text-foreground/70 border border-border/50">
                  {b}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── SECTION: 15-Topic Explorer ─────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent hidden sm:block" />
            <span className="text-xs uppercase tracking-widest text-primary font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {tr('15 Operational Topics', '15 परिचालन विषय')}
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent hidden sm:block" />
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tr('Search topics...', 'विषय खोजें...')}
              className="pl-10"
            />
          </div>
        </div>

        <p className={`text-xs text-muted-foreground ${isHi ? 'font-devanagari' : ''}`}>
          {isHi
            ? `ये 15 विषय 'कार्य का स्वरूप — विमर्श' के अंतर्गत परिचालन स्तर पर कार्य की सुविधा के लिए निर्धारित हैं। प्रत्येक विषय पर लेख, वीडियो और पुस्तक संसाधन उपलब्ध हैं।`
            : 'These 15 topics are defined as the operational layer under the Vimarsh work-stream. Each topic has curated articles, videos and book resources.'}
        </p>

        <div className="space-y-2">
          {filtered.map((topic, i) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="glass-card overflow-hidden">
                <button
                  className="w-full text-left"
                  onClick={() => setExpanded(expanded === topic.id ? null : topic.id)}
                >
                  <CardContent className="py-3.5 px-4 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {topic.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm font-devanagari">{tr(topic.english, topic.title)}</h3>
                      <p className="text-[10px] text-muted-foreground font-devanagari">
                        {tr(topic.english, topic.title) === topic.english ? topic.title : topic.english}
                      </p>
                    </div>
                    {expanded === topic.id
                      ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    }
                  </CardContent>
                </button>

                <AnimatePresence>
                  {expanded === topic.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border/50 px-4 py-4 bg-muted/20 space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">{topic.desc}</p>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div>
                            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                              <ExternalLink className="w-3 h-3 text-primary" /> {tr('Articles', 'लेख')}
                            </h4>
                            <div className="space-y-1.5">
                              {topic.links.map((link, j) => (
                                <a key={j} href="#" className="block text-xs text-primary hover:underline truncate">
                                  {link}
                                </a>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                              <Youtube className="w-3 h-3 text-destructive" /> {tr('Videos', 'वीडियो')}
                            </h4>
                            <div className="space-y-1.5">
                              {topic.videos.map((v, j) => (
                                <a key={j} href="#" className="block text-xs text-primary hover:underline">
                                  {v}
                                </a>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                              <BookOpen className="w-3 h-3 text-success" /> E-Library
                            </h4>
                            <div className="space-y-1.5">
                              {topic.books.map((b, j) => (
                                <Link key={j} href="/library">
                                  <Badge variant="outline" className="text-[10px] block w-fit cursor-pointer hover:border-success/60 hover:bg-success/5 hover:text-success transition-colors">
                                    <Library className="w-2.5 h-2.5 inline mr-1 opacity-70" />{b}
                                  </Badge>
                                </Link>
                              ))}
                            </div>
                            <Link href="/library">
                              <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 mt-1 text-success hover:text-success">
                                Open E-Library →
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No topics matching &quot;{search}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
