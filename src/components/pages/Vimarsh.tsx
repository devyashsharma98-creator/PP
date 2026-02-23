"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, ChevronRight, ExternalLink, Youtube, BookOpen } from 'lucide-react';

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
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = topics.filter(t =>
    t.title.includes(search) || t.english.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Vimarsh <span className="font-devanagari text-muted-foreground text-lg">विमर्श</span>
          </h1>
          <p className="text-muted-foreground text-sm">15 Core Discourse Topics — मंडन और खंडन की रणनीति</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search topics..."
            className="pl-10"
          />
        </div>
      </div>

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
                    <h3 className="font-medium text-sm font-devanagari">{topic.title}</h3>
                    <p className="text-[10px] text-muted-foreground">{topic.english}</p>
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
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3 text-primary" /> Articles
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
                            <Youtube className="w-3 h-3 text-destructive" /> Videos
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
                              <Badge key={j} variant="outline" className="text-[10px] block w-fit">{b}</Badge>
                            ))}
                          </div>
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
    </motion.div>
  );
}
