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
  TrendingUp, Library, Sparkles, Compass
} from 'lucide-react';
import { useT } from '@/lib/useT';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';

// ── Vimarsh Context Types ──────────────────────────────────────────────────

type VimarshContextItem = {
  labelEn: string;
  labelHi: string;
  valueEn: string;
  valueHi?: string;
  detailEn: string;
  detailHi: string;
};

function VimarshMasthead({
  t,
  contexts,
}: {
  t: (en: string, hi: string) => string;
  contexts: VimarshContextItem[];
}) {
  return (
    <div className="dashboard-masthead space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="section-seal">{t('Vimarsh Command Center', 'विमर्श संचालन कक्ष')}</p>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t('Discourse, Assertion & Counter', 'विमर्श, मंडन एवं खंडन')}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {t(
                'Shape the narrative, affirm the civilisational truth, and counter misinformation through disciplined intellectual action.',
                'कथ्य को आकार दें, सभ्यतागत सत्य का मंडन करें और अनुशासित बौद्धिक कार्य के माध्यम से कुप्रचार का खंडन करें।'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-context-grid">
        {contexts.map((context) => (
          <div key={context.labelEn} className="dashboard-context-card">
            <p className="shell-copy">{t(context.labelEn, context.labelHi)}</p>
            <p className="dashboard-context-value">{t(context.valueEn, context.valueHi ?? context.valueEn)}</p>
            <p className="dashboard-context-detail">{t(context.detailEn, context.detailHi)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-10">
      <VimarshMasthead t={tr} contexts={contexts} />

      {/* ── SECTION: Mandan-Khandan Framework ─────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="section-seal">{tr('Strategic Framework', 'रणनीतिक ढाँचा')}</p>
            <div className="space-y-1">
              <h2 className="dashboard-section-heading">{tr('Mandan-Khandan: The Narrative Strategy', 'मंडन-खंडन: विमर्श की रणनीति')}</h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {tr(
                  'The intellectual methodology of Pragya Pravah involves two simultaneous actions: affirming our civilisational identity and countering ideological distortions.',
                  'प्रज्ञा प्रवाह की बौद्धिक कार्यपद्धति में दो समानांतर क्रियाएं शामिल हैं: अपनी सभ्यतागत पहचान का मंडन और वैचारिक विकृतियों का खंडन।'
                )}
              </p>
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

        <Card className="institution-panel overflow-hidden border-violet-500/20">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-violet-500 to-red-500" />
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-3 group hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-devanagari font-bold text-lg text-emerald-700 dark:text-emerald-300 leading-none">मंडन</h3>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Assertion · Affirmation</p>
                  </div>
                </div>
                <p className={`text-sm text-foreground/75 leading-relaxed ${isHi ? 'font-devanagari' : ''}`}>
                  {isHi
                    ? 'सत्य का, भारत की परंपरा का, और भारतीय दृष्टि का सार्थक मंडन करना। तथ्यों की पुनर्स्थापना और स्व-बोध का जागरण।'
                    : 'Affirming truth, India\'s tradition and the Bharatiya worldview. Restoration of civilisational facts and awakening of self-consciousness.'}
                </p>
              </div>

              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 space-y-3 group hover:border-red-500/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Swords className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-devanagari font-bold text-lg text-red-700 dark:text-red-300 leading-none">खंडन</h3>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Counter · Deconstruction</p>
                  </div>
                </div>
                <p className={`text-sm text-foreground/75 leading-relaxed ${isHi ? 'font-devanagari' : ''}`}>
                  {isHi
                    ? 'भारत एवं विश्व में चल रहे कुप्रचार का तथ्यात्मक खंडन करना। औपनिवेशिक एवं विभाजनकारी विमर्शों का तार्किक प्रत्युत्तर।'
                    : 'Factual counter of anti-India propaganda. Logical response to colonial and divisive narratives through rigorous research and data.'}
                </p>
              </div>
            </div>
            
            <div className="sutra-divider" />
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/30 p-4 rounded-xl border border-border/50">
              <Compass className="w-5 h-5 text-violet-500 shrink-0" />
              <p className={isHi ? 'font-devanagari' : ''}>
                {isHi
                  ? 'विमर्श का यह मूल ढाँचा कार्यकर्ताओं को वैचारिक स्पष्टता प्रदान करता है, जिससे वे अपने दायित्व का निर्वहन प्रभावी ढंग से कर सकें।'
                  : 'This core framework provides workers with ideological clarity, enabling them to fulfill their responsibilities effectively.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── SECTION: Vimarsh Bindu ───────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="section-seal">{tr('Discourse Points', 'विमर्श बिंदु')}</p>
            <h2 className="dashboard-section-heading">{tr('Thematic Focus Areas', 'विमर्श के मुख्य क्षेत्र')}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ATMA_BODH_BINDU.map((group, gi) => (
            <motion.div
              key={gi}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: gi * 0.05 }}
            >
              <Card className={cn("institution-panel h-full hover-lift", group.border, group.bg)}>
                <CardContent className="pt-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center", group.bg, group.border)}>
                      <group.icon className={cn("w-5 h-5", group.color)} />
                    </div>
                    <div>
                      <h4 className={cn("font-bold text-base font-devanagari leading-none", group.color)}>{group.group}</h4>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{group.en}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item, ii) => (
                      <div key={ii} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-background/50 transition-colors">
                        <ChevronRight className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", group.color)} />
                        <div>
                          <span className="font-devanagari text-xs font-semibold text-foreground/80">{item.hi}</span>
                          {!isHi && <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{item.en}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="institution-panel-muted p-5">
          <h4 className="shell-copy mb-4">{tr('Additional Vimarsh Points', 'अन्य विमर्श बिंदु')}</h4>
          <div className="flex flex-wrap gap-2">
            {OTHER_BINDU.map((b, i) => (
              <Badge key={i} variant="outline" className="font-devanagari text-[11px] px-3 py-1 bg-background/50 border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all">
                {b}
              </Badge>
            ))}
          </div>
        </Card>
      </section>

      {/* ── SECTION: 15-Topic Explorer ───────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-border/50 pt-8">
          <div className="space-y-2">
            <p className="section-seal">{tr('Operational Layer', 'परिचालन स्तर')}</p>
            <h2 className="dashboard-section-heading">
              <BookOpen className="w-5 h-5 text-primary" />
              {tr(`Operational Topics (${vimarshTopics.length})`, `परिचालन विषय (${vimarshTopics.length})`)}
            </h2>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tr('Search topics...', 'विषय खोजें...')}
              className="pl-10 h-10 rounded-xl bg-background/50 border-border/60 focus:border-primary/40 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        <div className="space-y-3">
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
                  expanded === topic.id ? "ring-1 ring-primary/20 shadow-md" : "hover:border-primary/30"
                )}>
                  <button
                    className="w-full text-left"
                    onClick={() => setExpanded(expanded === topic.id ? null : topic.id)}
                  >
                    <CardContent className="py-4 px-5 flex items-center gap-4">
                      <span className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {topic.sortOrder}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm font-devanagari text-foreground/90">{topic.title}</h3>
                        {topic.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{topic.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[10px] bg-muted/30 border-border/60">
                          {topic.resources.length} {tr('resources', 'संसाधन')}
                        </Badge>
                        {expanded === topic.id
                          ? <ChevronDown className="w-4 h-4 text-primary shrink-0" />
                          : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        }
                      </div>
                    </CardContent>
                  </button>

                  <AnimatePresence>
                    {expanded === topic.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/50 px-6 py-6 bg-muted/10 space-y-5">
                          {topic.description && (
                            <div className="space-y-2">
                              <p className="shell-copy">{tr('Context', 'संदर्भ')}</p>
                              <p className="text-sm text-foreground/75 leading-relaxed bg-background/50 p-4 rounded-xl border border-border/40">
                                {topic.description}
                              </p>
                            </div>
                          )}
                          
                          <div className="space-y-3">
                            <p className="shell-copy">{tr('Resources', 'संसाधन')}</p>
                            {types.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic font-devanagari">{tr('No resources yet.', 'अभी कोई संसाधन नहीं।')}</p>
                            ) : (
                              <div className={`grid grid-cols-1 gap-6 ${types.length >= 3 ? 'sm:grid-cols-3' : types.length === 2 ? 'sm:grid-cols-2' : ''}`}>
                                {types.map(type => {
                                  const config = RESOURCE_TYPE_CONFIG[type] ?? { label: type, labelHi: type, icon: ExternalLink, color: 'text-muted-foreground' };
                                  const Icon = config.icon;
                                  return (
                                    <div key={type} className="space-y-3">
                                      <h4 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 text-foreground/70">
                                        <Icon className={`w-3.5 h-3.5 ${config.color}`} /> {tr(config.label, config.labelHi)}
                                      </h4>
                                      <div className="space-y-2">
                                        {grouped[type].map(r => (
                                          <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                                            className="group flex items-start gap-2 p-2 rounded-lg hover:bg-primary/5 transition-colors">
                                            <ExternalLink className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                                            <span className="text-xs text-primary hover:underline leading-tight line-clamp-2">
                                              {r.title}
                                            </span>
                                          </a>
                                        ))}
                                      </div>
                                      {type === 'book' && (
                                        <Link href="/library">
                                          <Button variant="ghost" size="sm" className="text-[10px] h-8 w-full rounded-lg bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 border border-emerald-500/10">
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
            <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border/60">
              <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm font-devanagari text-muted-foreground">
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
