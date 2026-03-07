"use client";

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, ChevronDown, ChevronRight, ExternalLink, Youtube, BookOpen,
  Swords, Shield, Target, MessagesSquare, AlertTriangle, Globe,
} from 'lucide-react';
import { useT } from '@/lib/useT';
import { useAppContext } from '@/context/AppContext';

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
      { hi: "स्वत्व", en: "स्वत्व — Indigenous identity and civilisational self-consciousness" },
      { hi: "हिंदुत्व", en: "हिंदुत्व — Philosophical, cultural and civilisational understanding" },
      { hi: "भारत बोध", en: "भारत बोध — Understanding India's civilisational identity and its global role" },
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
      { hi: "कट्टरपंथी इस्लाम", en: "Radical Islamism — extremist spread targeting Bharatiya social fabric" },
      { hi: "प्रसारवादी चर्च", en: "Missionary Church — proselytisation targeting tribal and marginalised communities" },
      { hi: "सांस्कृतिक मार्क्सवाद", en: "Cultural Marxism — ideological framework targeting Dharmic civilisation" },
      { hi: "वैश्विक बाज़ारवादी शक्तियां", en: "Global Market Forces — homogenising cultural and economic pressures" },
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
      { hi: "अनुसूचित जाति", en: "Scheduled Castes — counter divisive anti-India narratives" },
      { hi: "अनुसूचित जनजाति", en: "Scheduled Tribes — restore connection with Bharatiya identity" },
      { hi: "महिला वर्ग", en: "Women — Shakti-centred counter-narrative to western feminist frameworks" },
      { hi: "युवा वर्ग", en: "Youth — ground young Indians in civilisational values" },
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
      { hi: "उत्तर-दक्षिण", en: "North-South divide — counter Dravidian ideology's anti-Hindi/Hindu frames" },
      { hi: "उत्तर-पूर्व भारत (मणिपुर, नागालैंड)", en: "North-East — tribal integration, counter Christian separatist narratives in Manipur, Nagaland" },
      { hi: "पंजाब (खालिस्तान)", en: "Punjab — Sikh-Hindu unity narratives, counter Khalistan separatism" },
      { hi: "जम्मू कश्मीर", en: "Jammu Kashmir — restore Kashmiri Pandit history, cultural reintegration" },
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

// Resource type → display config
const RESOURCE_TYPE_CONFIG: Record<string, { label: string; labelHi: string; icon: typeof ExternalLink; color: string }> = {
  article: { label: 'Articles', labelHi: 'लेख', icon: ExternalLink, color: 'text-primary' },
  video: { label: 'Videos', labelHi: 'वीडियो', icon: Youtube, color: 'text-destructive' },
  book: { label: 'E-Library', labelHi: 'ई-पुस्तकालय', icon: BookOpen, color: 'text-success' },
};

export default function Vimarsh() {
  const tr = useT();
  const { vimarshTopics } = useAppContext();
  const isHi = tr('en', 'hi') === 'hi';
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = vimarshTopics.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
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
              {tr(`Operational Topics (${vimarshTopics.length})`, `परिचालन विषय (${vimarshTopics.length})`)}
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
            ? `ये विषय 'कार्य का स्वरूप — विमर्श' के अंतर्गत परिचालन स्तर पर कार्य की सुविधा के लिए निर्धारित हैं। प्रत्येक विषय पर लेख, वीडियो और पुस्तक संसाधन उपलब्ध हैं।`
            : 'These topics are defined as the operational layer under the Vimarsh work-stream. Each topic has curated articles, videos and book resources.'}
        </p>

        <div className="space-y-2">
          {filtered.map((topic, i) => {
            const grouped = topic.resources.reduce<Record<string, typeof topic.resources>>((acc, r) => {
              (acc[r.resourceType] ??= []).push(r);
              return acc;
            }, {});
            const types = Object.keys(grouped);

            return (
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
                        {topic.sortOrder}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm font-devanagari">{topic.title}</h3>
                        {topic.description && (
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{topic.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">{topic.resources.length} {tr('resources', 'संसाधन')}</Badge>
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
                          {topic.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed">{topic.description}</p>
                          )}
                          {types.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic font-devanagari">{tr('No resources yet.', 'अभी कोई संसाधन नहीं।')}</p>
                          ) : (
                            <div className={`grid grid-cols-1 gap-4 ${types.length >= 3 ? 'sm:grid-cols-3' : types.length === 2 ? 'sm:grid-cols-2' : ''}`}>
                              {types.map(type => {
                                const config = RESOURCE_TYPE_CONFIG[type] ?? { label: type, labelHi: type, icon: ExternalLink, color: 'text-muted-foreground' };
                                const Icon = config.icon;
                                return (
                                  <div key={type}>
                                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                                      <Icon className={`w-3 h-3 ${config.color}`} /> {tr(config.label, config.labelHi)}
                                    </h4>
                                    <div className="space-y-1.5">
                                      {grouped[type].map(r => (
                                        <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                                          className="block text-xs text-primary hover:underline truncate">
                                          {r.title}
                                        </a>
                                      ))}
                                    </div>
                                    {type === 'book' && (
                                      <Link href="/library">
                                        <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 mt-1 text-success hover:text-success">
                                          {tr('Open E-Library →', 'ई-पुस्तकालय खोलें →')}
                                        </Button>
                                      </Link>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm font-devanagari">
                {search
                  ? tr(`No topics matching "${search}"`, `"${search}" से मेल खाता कोई विषय नहीं`)
                  : tr('No topics available yet.', 'अभी कोई विषय उपलब्ध नहीं।')}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
