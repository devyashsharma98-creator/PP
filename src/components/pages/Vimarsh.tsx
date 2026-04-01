"use client";

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, ChevronDown, ChevronRight, ExternalLink, Youtube, BookOpen,
  Swords, Shield, Target, MessagesSquare, AlertTriangle, Globe,
  TrendingUp, Library, Sparkles, Compass
} from 'lucide-react';
import { useT } from '@/lib/useT';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { Masthead } from '@/components/Masthead';


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

interface VimarshContextItem {
  labelEn: string;
  labelHi: string;
  valueEn: string;
  valueHi?: string;
  detailEn: string;
  detailHi: string;
}

function VimarshMasthead({
  t,
  contexts,
}: {
  t: (en: string, hi: string) => string;
  contexts: VimarshContextItem[];
}) {
  return (
    <div className="vimarsh-masthead space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="section-seal">{t('Vimarsh Command Center', 'विमर्श संचालन कक्ष')}</p>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {t('Discourse, Assertion & Counter', 'विमर्श, मंडन एवं खंडन')}
            </h1>
            <p className="max-w-2xl text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
              {t(
                'Shape the narrative, affirm the civilisational truth, and counter misinformation through disciplined intellectual action.',
                'कथ्य को आकार दें, सभ्यतागत सत्य का मंडन करें और अनुशासित बौद्धिक कार्य के माध्यम से कुप्रचार का खंडन करें।'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="vimarsh-context-grid">
        {contexts.map((ctx) => (
          <div key={ctx.labelEn} className="vimarsh-context-card">
            <p className="shell-copy">{t(ctx.labelEn, ctx.labelHi)}</p>
            <p className="vimarsh-context-value">
              {t(ctx.valueEn, ctx.valueHi ?? ctx.valueEn)}
            </p>
            <p className="vimarsh-context-detail">
              {t(ctx.detailEn, ctx.detailHi)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Vimarsh() {
  const tr = useT();
  const { vimarshTopics } = useAppContext();
  const isHi = tr('en', 'hi') === 'hi';
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => vimarshTopics.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
  ), [vimarshTopics, search]);

  const contexts: VimarshContextItem[] = [
    {
      labelEn: "Core Framework",
      labelHi: "मूल ढाँचा",
      valueEn: "Mandan-Khandan",
      valueHi: "मंडन-खंडन",
      detailEn: "Restoring truth while countering divisive narratives.",
      detailHi: "सत्य की पुनर्स्थापना और नकारात्मक विमर्शों का उत्तर।",
    },
    {
      labelEn: "Active Topics",
      labelHi: "सक्रिय विषय",
      valueEn: `${vimarshTopics.length} Operational Topics`,
      valueHi: `${vimarshTopics.length} परिचालन विषय`,
      detailEn: "Curated discourse points for institutional focus.",
      detailHi: "संस्थागत विमर्श हेतु निर्धारित मुख्य बिंदु।",
    },
    {
      labelEn: "Institutional Role",
      labelHi: "संस्थागत भूमिका",
      valueEn: "Narrative Engagement",
      valueHi: "कथ्य एवं विमर्श संचालन",
      detailEn: "Translating civilisational values into public thought.",
      detailHi: "सभ्यतागत मूल्यों को सार्वजनिक चिंतन में परिवर्तित करना।",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-10">
      <VimarshMasthead t={tr} contexts={contexts} />

      {/* ── SECTION: Mandan-Khandan Framework ─────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="section-seal">{tr('Strategic Framework', 'रणनीतिक ढाँचा')}</p>
            <div className="space-y-1">
              <h2 className="dashboard-section-heading">
                <Shield className="w-5 h-5 text-primary" />
                {tr('Mandan-Khandan: The Narrative Strategy', 'मंडन-खंडन: विमर्श की रणनीति')}
              </h2>
            </div>
          </div>
          <div className="home-sequence-strip">
            <span>{tr('Observe', 'अवलोकन')}</span>
            <span>•</span>
            <span>{tr('Analyze', 'विश्लेषण')}</span>
            <span>•</span>
            <span>{tr('Respond', 'प्रतिसाद')}</span>
          </div>
        </div>

        <Card className="institution-panel overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-violet-500 to-red-500" />
          <CardContent className="pt-8 pb-8 space-y-8 px-6 md:px-8">
            <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {tr(
                'The intellectual methodology of Pragya Pravah involves two simultaneous actions: affirming our civilisational identity and countering ideological distortions.',
                'प्रज्ञा प्रवाह की बौद्धिक कार्यपद्धति में दो समानांतर क्रियाएं शामिल हैं: अपनी सभ्यतागत पहचान का मंडन और वैचारिक विकृतियों का खंडन।'
              )}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-4 group hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-devanagari font-bold text-xl text-emerald-700 dark:text-emerald-300 leading-none">मंडन</h3>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5">Assertion · Affirmation</p>
                  </div>
                </div>
                <p className={`text-sm md:text-base text-foreground/75 leading-relaxed ${isHi ? 'font-devanagari' : ''}`}>
                  {isHi
                    ? 'सत्य का, भारत की परंपरा का, और भारतीय दृष्टि का सार्थक मंडन करना। तथ्यों की पुनर्स्थापना और स्व-बोध का जागरण।'
                    : 'Affirming truth, India\'s tradition and the Bharatiya worldview. Restoration of civilisational facts and awakening of self-consciousness.'}
                </p>
              </div>

              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 space-y-4 group hover:border-red-500/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Swords className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-devanagari font-bold text-xl text-red-700 dark:text-red-300 leading-none">खंडन</h3>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5">Counter · Deconstruction</p>
                  </div>
                </div>
                <p className={`text-sm md:text-base text-foreground/75 leading-relaxed ${isHi ? 'font-devanagari' : ''}`}>
                  {isHi
                    ? 'भारत एवं विश्व में चल रहे कुप्रचार का तथ्यात्मक खंडन करना। औपनिवेशिक एवं विभाजनकारी विमर्शों का तार्किक प्रत्युत्तर।'
                    : 'Factual counter of anti-India propaganda. Logical response to colonial and divisive narratives through rigorous research and data.'}
                </p>
              </div>
            </div>
            
            <div className="sutra-divider" />
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted/30 p-5 rounded-2xl border border-border/50">
              <Compass className="w-6 h-6 text-violet-500 shrink-0" />
              <p className={cn("leading-relaxed", isHi ? 'font-devanagari' : '')}>
                {isHi
                  ? 'विमर्श का यह मूल ढाँचा कार्यकर्ताओं को वैचारिक स्पष्टता प्रदान करता है, जिससे वे अपने दायित्व का निर्वहन प्रभावी ढंग से कर सकें।'
                  : 'This core framework provides workers with ideological clarity, enabling them to fulfill their responsibilities effectively.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── SECTION: Vimarsh Bindu ───────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="section-seal">{tr('Discourse Points', 'विमर्श बिंदु')}</p>
            <h2 className="dashboard-section-heading">
              <Target className="w-5 h-5 text-primary" />
              {tr('Thematic Focus Areas', 'विमर्श के मुख्य क्षेत्र')}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ATMA_BODH_BINDU.map((group, gi) => (
            <motion.div
              key={gi}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: gi * 0.05 }}
            >
              <Card className={cn("institution-panel h-full hover-lift transition-all duration-300", group.border, group.bg)}>
                <CardContent className="pt-6 pb-6 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center shadow-sm", group.bg, group.border)}>
                      <group.icon className={cn("w-6 h-6", group.color)} />
                    </div>
                    <div>
                      <h4 className={cn("font-bold text-lg font-devanagari leading-none", group.color)}>{group.group}</h4>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5">{group.en}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {group.items.map((item, ii) => (
                      <div key={ii} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-background/60 transition-colors border border-transparent hover:border-border/40">
                        <ChevronRight className={cn("w-4 h-4 mt-0.5 shrink-0", group.color)} />
                        <div className="space-y-0.5">
                          <span className="font-devanagari text-sm font-semibold text-foreground/90">{item.hi}</span>
                          {!isHi && <p className="text-[11px] text-muted-foreground leading-relaxed">{item.en}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="institution-panel-muted p-6">
          <h4 className="shell-copy mb-5">{tr('Additional Vimarsh Points', 'अन्य विमर्श बिंदु')}</h4>
          <div className="flex flex-wrap gap-2.5">
            {OTHER_BINDU.map((b, i) => (
              <Badge key={i} variant="outline" className="font-devanagari text-xs px-4 py-1.5 bg-background/50 border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-default">
                {b}
              </Badge>
            ))}
          </div>
        </Card>
      </section>

      {/* ── SECTION: Topic Explorer ───────────────────────────────────── */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-t border-border/50 pt-10">
          <div className="space-y-2">
            <p className="section-seal">{tr('Operational Layer', 'परिचालन स्तर')}</p>
            <h2 className="dashboard-section-heading">
              <BookOpen className="w-5 h-5 text-primary" />
              {tr(`Operational Topics (${vimarshTopics.length})`, `परिचालन विषय (${vimarshTopics.length})`)}
            </h2>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tr('Search topics...', 'विषय खोजें...')}
              className="pl-11 h-11 rounded-2xl bg-background/50 border-border/70 focus:border-primary/40 focus:ring-primary/10 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filtered.map((topic, i) => {
            const grouped = topic.resources.reduce<Record<string, typeof topic.resources>>((acc, r) => {
              (acc[r.resourceType] ??= []).push(r);
              return acc;
            }, {});
            const types = Object.keys(grouped);

            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={cn(
                  "institution-panel overflow-hidden transition-all duration-300",
                  expanded === topic.id ? "ring-1 ring-primary/30 shadow-lg" : "hover:border-primary/40"
                )}>
                  <button
                    className="w-full text-left"
                    onClick={() => setExpanded(expanded === topic.id ? null : topic.id)}
                  >
                    <CardContent className="py-5 px-6 flex items-center gap-5">
                      <span className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0 shadow-inner">
                        {topic.sortOrder}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base font-devanagari text-foreground/90 tracking-tight">{topic.title}</h3>
                        {topic.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{topic.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-[11px] bg-muted/40 border-border/60 px-2.5 py-0.5 font-medium">
                          {topic.resources.length} {tr('resources', 'संसाधन')}
                        </Badge>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                          expanded === topic.id ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"
                        )}>
                          {expanded === topic.id
                            ? <ChevronDown className="w-5 h-5 shrink-0" />
                            : <ChevronRight className="w-5 h-5 shrink-0" />
                          }
                        </div>
                      </div>
                    </CardContent>
                  </button>

                  <AnimatePresence>
                    {expanded === topic.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/50 px-8 py-8 bg-muted/10 space-y-6">
                          {topic.description && (
                            <div className="space-y-3">
                              <p className="shell-copy font-bold">{tr('Context & Objective', 'संदर्भ एवं उद्देश्य')}</p>
                              <div className="text-sm md:text-base text-foreground/80 leading-relaxed bg-background/60 p-6 rounded-2xl border border-border/50 shadow-sm">
                                {topic.description}
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-4">
                            <p className="shell-copy font-bold">{tr('Institutional Resources', 'संस्थागत संसाधन')}</p>
                            {types.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic font-devanagari py-4">{tr('No resources yet.', 'अभी कोई संसाधन नहीं।')}</p>
                            ) : (
                              <div className={`grid grid-cols-1 gap-8 ${types.length >= 3 ? 'lg:grid-cols-3' : types.length === 2 ? 'md:grid-cols-2' : ''}`}>
                                {types.map(type => {
                                  const config = RESOURCE_TYPE_CONFIG[type] ?? { label: type, labelHi: type, icon: ExternalLink, color: 'text-muted-foreground' };
                                  const Icon = config.icon;
                                  return (
                                    <div key={type} className="space-y-4">
                                      <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2.5 text-foreground/70">
                                        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center bg-background border border-border/40", config.color.replace('text-', 'bg-') + '/10')}>
                                          <Icon className={cn("w-3.5 h-3.5", config.color)} />
                                        </div>
                                        {tr(config.label, config.labelHi)}
                                      </h4>
                                      <div className="space-y-2.5">
                                        {grouped[type].map(r => (
                                          <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                                            className="group flex items-start gap-3 p-3 rounded-xl hover:bg-primary/5 transition-all border border-transparent hover:border-primary/20">
                                            <ExternalLink className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-all mt-0.5 shrink-0" />
                                            <span className="text-sm text-primary hover:underline leading-relaxed font-medium">
                                              {r.title}
                                            </span>
                                          </a>
                                        ))}
                                      </div>
                                      {type === 'book' && (
                                        <Link href="/library" className="block pt-2">
                                          <Button variant="ghost" size="sm" className="text-xs h-9 w-full rounded-xl bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 border border-emerald-500/20 font-semibold">
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
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-24 bg-muted/30 rounded-[2rem] border border-dashed border-border/80">
              <Search className="w-16 h-16 mx-auto text-muted-foreground/20 mb-6" />
              <p className="text-base font-devanagari text-muted-foreground font-medium">
                {search
                  ? tr(`No topics matching "${search}"`, `"${search}" से मेल खाता कोई विषय नहीं`)
                  : tr('No topics available yet.', 'अभी कोई विषय उपलब्ध नहीं।')}
              </p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
