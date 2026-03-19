"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown, ChevronRight, Network, Crown, Shield, User,
  BookOpen, GraduationCap, FlaskConical, Tag, Building2, MapPin,
  TrendingUp, Users, Compass, Zap
} from 'lucide-react';
import { useT } from '@/lib/useT';
import { cn } from '@/lib/utils';

// ── Dayitv Context Types ──────────────────────────────────────────────────

type DayitvContextItem = {
  labelEn: string;
  labelHi: string;
  valueEn: string;
  valueHi?: string;
  detailEn: string;
  detailHi: string;
};

function DayitvMasthead({
  t,
  contexts,
}: {
  t: (en: string, hi: string) => string;
  contexts: DayitvContextItem[];
}) {
  return (
    <div className="dashboard-masthead space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="section-seal">{t('Organizational Command', 'संगठनात्मक संचालन')}</p>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t('Structure & Responsibility', 'संरचना एवं कार्य का स्वरूप')}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {t(
                'A disciplined multi-tier hierarchy ensuring the flow of civilisational thought from the national level to every local unit.',
                'एक अनुशासित बहु-स्तरीय संरचना जो राष्ट्रीय स्तर से प्रत्येक स्थानीय इकाई तक सभ्यतागत चिंतन के प्रवाह को सुनिश्चित करती है।'
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

// ── Data ────────────────────────────────────────────────────────────────────

const aayamColors: Record<string, string> = {
  Yuva: 'bg-orange-500/15 text-orange-500',
  Mahila: 'bg-rose-500/15 text-rose-500',
  Shodh: 'bg-blue-500/15 text-blue-500',
  Prachar: 'bg-emerald-500/15 text-emerald-500',
  Vimarsh: 'bg-violet-500/15 text-violet-500',
};

const vibhags = [
  {
    name: 'Bhopal Vibhag',
    nameHi: 'भोपाल विभाग',
    sanyojak: 'Shri Rajendra Jain',
    isCurrent: true,
    aayams: [
      { name: 'Yuva', pramukh: 'Suresh Yadav', contact: '98265XXXXX' },
      { name: 'Mahila', pramukh: 'Sunita Chouhan', contact: '98270XXXXX' },
      { name: 'Shodh', pramukh: 'Kavita Singh', contact: '98264XXXXX' },
      { name: 'Prachar', pramukh: 'Ramesh Sharma', contact: '98261XXXXX' },
      { name: 'Vimarsh', pramukh: 'Anil Verma', contact: '98263XXXXX' },
    ],
  },
  { name: 'Vidisha Vibhag', nameHi: 'विदिशा विभाग', sanyojak: 'Shri [Name]', isCurrent: false, aayams: [] },
  { name: 'Sehore Vibhag', nameHi: 'सीहोर विभाग', sanyojak: 'Shri [Name]', isCurrent: false, aayams: [] },
  { name: 'Narmadapuram Vibhag', nameHi: 'नर्मदापुरम विभाग', sanyojak: 'Shri [Name]', isCurrent: false, aayams: [] },
  { name: 'Rajgarh Vibhag', nameHi: 'राजगढ़ विभाग', sanyojak: 'Shri [Name]', isCurrent: false, aayams: [] },
  { name: 'Gwalior Vibhag', nameHi: 'ग्वालियर विभाग', sanyojak: 'Shri [Name]', isCurrent: false, aayams: [] },
  { name: 'Jabalpur Vibhag', nameHi: 'जबलपुर विभाग', sanyojak: 'Shri [Name]', isCurrent: false, aayams: [] },
  { name: 'Indore Vibhag', nameHi: 'इंदौर विभाग', sanyojak: 'Shri [Name]', isCurrent: false, aayams: [] },
];

const vishayas = [
  'समाजशास्त्र', 'राजनीति शास्त्र', 'अर्थशास्त्र', 'इतिहास', 'दर्शन',
  'मत पंथ अध्ययन', 'विधि', 'भूगोल', 'पर्यावरण', 'मीडिया एवं पत्रकारिता',
  'अंतर्राष्ट्रीय संबंध', 'सामाजिक सहकार', 'भारतीय भाषाएँ', 'वैश्विक भाषाएँ', 'अनुवाद',
];

// ── Sub-components ──────────────────────────────────────────────────────────

function SutraDivider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <span className="text-primary/40 text-xs">✦</span>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-primary/30 to-transparent" />
    </div>
  );
}

interface InfoCardProps {
  icon: React.ElementType;
  titleHi: string;
  titleEn: string;
  descHi: string;
  descEn: string;
  color?: string;
  border?: string;
  bg?: string;
  pointsHi?: string[];
  pointsEn?: string[];
  isHi: boolean;
}

function InfoCard({ icon: Icon, titleHi, titleEn, descHi, descEn, color = 'text-primary', border = 'border-primary/20', bg = 'bg-primary/5', pointsHi, pointsEn, isHi }: InfoCardProps) {
  return (
    <div className={`glass-card rounded-xl border ${border} ${bg} p-5 space-y-3`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <h3 className={`font-semibold font-devanagari text-sm ${color}`}>{titleHi}</h3>
          <p className="text-[10px] text-muted-foreground">{titleEn}</p>
        </div>
      </div>
      <p className={`text-xs text-foreground/70 leading-relaxed ${isHi ? 'font-devanagari' : ''}`}>
        {isHi ? descHi : descEn}
      </p>
      {(pointsHi || pointsEn) && (
        <div className="space-y-1.5 border-t border-border/40 pt-3">
          {(isHi ? pointsHi : pointsEn)?.map((pt, i) => (
            <div key={i} className="flex items-start gap-2">
              <ChevronRight className={`w-3.5 h-3.5 ${color} mt-0.5 shrink-0`} />
              <span className={`text-[11px] text-foreground/60 leading-relaxed ${isHi ? 'font-devanagari' : ''}`}>{pt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function Dayitv() {
  const t = useT();
  const isHi = t('en', 'hi') === 'hi';
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['Bhopal Vibhag']));

  const toggle = (name: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const contexts: DayitvContextItem[] = [
    {
      labelEn: "Core Units",
      labelHi: "मुख्य इकाइयाँ",
      valueEn: `${vibhags.length} Vibhags`,
      valueHi: `${vibhags.length} विभाग`,
      detailEn: "Organized across regional operational centers.",
      detailHi: "क्षेत्रीय परिचालन केंद्रों में संगठित।",
    },
    {
      labelEn: "Current Goal",
      labelHi: "वर्तमान लक्ष्य",
      valueEn: "Town & College Reach",
      valueHi: "नगर एवं परिसर विस्तार",
      detailEn: "Ensuring work presence in every educational hub.",
      detailHi: "प्रत्येक शिक्षा केंद्र में कार्य उपस्थिति सुनिश्चित करना।",
    },
    {
      labelEn: "Institutional Depth",
      labelHi: "संस्थागत गहराई",
      valueEn: "Multi-level Hierarchy",
      valueHi: "बहु-स्तरीय संरचना",
      detailEn: "Flow of authority from Kshetra to local units.",
      detailHi: "क्षेत्र से स्थानीय इकाइयों तक अधिकार का प्रवाह।",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-10">
      <DayitvMasthead t={t} contexts={contexts} />

      {/* ── SECTION: कार्य का स्वरूप ─────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="section-seal">{t('Nature of Work', 'कार्य का स्वरूप')}</p>
            <div className="space-y-1">
              <h2 className="dashboard-section-heading">{t('Operational Methodology', 'परिचालन पद्धति')}</h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {t(
                  'The structural foundation of Pragya Pravah is built upon focused centers of learning and specialized study groups.',
                  'प्रज्ञा प्रवाह की संरचनात्मक नींव अध्ययन केंद्रों और विशेष अध्ययन समूहों पर आधारित है।'
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}>
            <InfoCard
              icon={Building2}
              titleHi="प्रांत और इकाई"
              titleEn="Prant & Ikai"
              color="text-amber-600 dark:text-amber-400"
              border="border-amber-500/25"
              bg="bg-amber-500/5"
              descHi="प्रत्येक प्रांत में कम से कम विभाग केंद्रों तक अवश्य कार्य हो। कार्ययुक्त नगर एवं विश्वविद्यालय/महाविद्यालय 'इकाई' कहे जाएंगे।"
              descEn="Work must reach at least up to Vibhag centres in every Prant. Active towns and universities/colleges are called 'Ikai' (Unit)."
              pointsHi={[
                'प्रत्येक प्रांत में विभाग स्तर तक कार्य अनिवार्य',
                'नगर एवं विश्वविद्यालय/महाविद्यालय = इकाई',
                'इकाई पर न्यूनतम एक अध्ययन केंद्र',
              ]}
              pointsEn={[
                'Work mandatory up to Vibhag level in every Prant',
                'Town and University/College = Ikai (unit)',
                'Minimum one Study Centre per Ikai',
              ]}
              isHi={isHi}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <InfoCard
              icon={BookOpen}
              titleHi="अध्ययन केंद्र"
              titleEn="Adhyayan Kendra"
              color="text-blue-600 dark:text-blue-400"
              border="border-blue-500/25"
              bg="bg-blue-500/5"
              descHi="इकाई पर न्यूनतम आवश्यक गतिविधि। माह में कम से कम एक बार बैठक। विषय प्रस्तुति, पुस्तक पर चर्चा आदि। एक इकाई पर एक से अधिक अध्ययन केंद्र हो सकते हैं।"
              descEn="Minimum required activity at the Ikai level. Meet at least once a month. Subject presentations, book discussions etc. Multiple study centres can exist per Ikai."
              pointsHi={[
                'मासिक बैठक — न्यूनतम एक बार',
                'विषय प्रस्तुति एवं पुस्तक चर्चा',
                'एक इकाई पर एक से अधिक केंद्र संभव',
              ]}
              pointsEn={[
                'Monthly meeting — minimum once',
                'Subject presentations & book discussions',
                'Multiple centres possible per Ikai',
              ]}
              isHi={isHi}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}>
            <InfoCard
              icon={GraduationCap}
              titleHi="शिक्षण केंद्र"
              titleEn="Shikshan Kendra"
              color="text-emerald-600 dark:text-emerald-400"
              border="border-emerald-500/25"
              bg="bg-emerald-500/5"
              descHi="प्रांत या नगर आदि स्तर पर शिक्षण केंद्र चलाया जाए, जहाँ किन्हीं वरिष्ठ विद्वान द्वारा विषय विशेष का शिक्षण लिया जाए।"
              descEn="A Shikshan Kendra runs at Prant or city level, where a senior scholar provides specialised instruction on specific subjects."
              pointsHi={[
                'प्रांत या नगर स्तर पर संचालन',
                'वरिष्ठ विद्वान द्वारा विषय विशेष शिक्षण',
                'अध्ययन केंद्र से उच्च स्तरीय कार्य',
              ]}
              pointsEn={[
                'Operating at Prant or city level',
                'Senior scholar provides specialised instruction',
                'Higher-level work than Adhyayan Kendra',
              ]}
              isHi={isHi}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <InfoCard
              icon={FlaskConical}
              titleHi="विषय प्रमुख / विषय अध्ययन टोली"
              titleEn="Vishay Pramukh / Vishay Adhyayan Toli"
              color="text-violet-600 dark:text-violet-400"
              border="border-violet-500/25"
              bg="bg-violet-500/5"
              descHi="प्रांत स्तर पर प्रत्येक विषय हेतु विषय प्रमुख तय हों। विषय प्रमुख अपने विषय से सम्बंधित अध्येताओं की अध्ययन टोली विकसित करे।"
              descEn="A Vishay Pramukh (Subject Head) should be identified for each subject at Prant level. They develop a Vishay Adhyayan Toli (Subject Study Team) of researchers."
              pointsHi={[
                'प्रांत स्तर पर प्रत्येक विषय हेतु विषय प्रमुख',
                'इकाई स्तर पर भी यथासंभव विषय प्रमुख',
                'विषय अध्ययन टोली का विकास करना',
              ]}
              pointsEn={[
                'Vishay Pramukh for each subject at Prant level',
                'Also at Ikai level where possible',
                'Develop a Vishay Adhyayan Toli (subject study team)',
              ]}
              isHi={isHi}
            />
          </motion.div>
        </div>

        <Card className="institution-panel-muted p-5">
          <div className="flex items-center gap-3 mb-4">
            <Tag className="w-4 h-4 text-primary" />
            <h3 className="shell-copy">
              {t('Specialized Subject Areas (Vishay)', 'विशेषज्ञ विषय सूची')}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {vishayas.map((v, i) => (
              <Badge key={i} variant="outline" className="font-devanagari text-[11px] px-3 py-1 bg-background/50 border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all">
                {v}
              </Badge>
            ))}
          </div>
        </Card>
      </section>

      <div className="sutra-divider" />

      {/* ── SECTION: Org Hierarchy ───────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="section-seal">{t('Hierarchy', 'संगठन संरचना')}</p>
            <h2 className="dashboard-section-heading">{t('Institutional Authority Flow', 'संस्थागत दायित्व प्रवाह')}</h2>
          </div>
        </div>

        <div className="space-y-4 relative">
          {/* Kshetra */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <Card className="institution-panel border-t-4 border-t-amber-500 shadow-sm">
              <CardContent className="pt-6 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0">
                  <Crown className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-1">
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 mb-1 text-[10px] tracking-widest uppercase border-0 font-bold">
                    {t('Kshetra Level', 'क्षेत्र स्तर')}
                  </Badge>
                  <h3 className="font-bold text-lg">{t('Kshetriya Pramukh', 'क्षेत्रीय प्रमुख')}</h3>
                  <p className="text-sm text-muted-foreground">{t('Shri [Name] · Madhya Kshetra', 'श्री [नाम] · मध्य क्षेत्र')}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="flex justify-center py-1">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500/50 to-blue-500/50" />
              <ChevronDown className="w-4 h-4 text-muted-foreground animate-bounce" />
            </div>
          </div>

          {/* Prant */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <Card className="institution-panel border-t-4 border-t-blue-500 shadow-sm">
              <CardContent className="pt-6 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center shrink-0">
                  <Shield className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-1">
                  <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 mb-1 text-[10px] tracking-widest uppercase border-0 font-bold">
                    {t('Prant Level', 'प्रांत स्तर')}
                  </Badge>
                  <h3 className="font-bold text-lg">{t('Prant Sanyojak', 'प्रांत संयोजक')}</h3>
                  <p className="text-sm text-muted-foreground">{t('Shri Digvijay Chaturvedi · Madhya Bharat Prant', 'श्री दिग्विजय चतुर्वेदी · मध्यभारत प्रांत')}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="flex justify-center py-1">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-0.5 h-6 bg-gradient-to-b from-blue-500/50 to-primary/50" />
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Vibhags */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-bold text-base font-devanagari">
                {t('Vibhag Level — 8 Operational Vibhags', 'विभाग स्तर — ८ सक्रिय विभाग')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vibhags.map((vibhag, i) => {
                const isOpen = expanded.has(vibhag.name);
                return (
                  <motion.div
                    key={vibhag.name}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <Card className={cn(
                      "institution-panel overflow-hidden transition-all duration-300",
                      vibhag.isCurrent ? "border-primary/40 shadow-md ring-1 ring-primary/10" : "hover:border-primary/20",
                      isOpen && "ring-1 ring-primary/20"
                    )}>
                      <button
                        className="w-full text-left"
                        onClick={() => vibhag.aayams.length > 0 && toggle(vibhag.name)}
                      >
                        <CardHeader className="py-4 px-5">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm font-devanagari text-foreground/90">
                                  {isHi ? vibhag.nameHi : vibhag.name}
                                </h3>
                                {vibhag.isCurrent && (
                                  <Badge className="text-[9px] bg-primary/10 text-primary px-2 border-0 font-bold uppercase tracking-wider">
                                    {t('Current', 'वर्तमान')}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                <User className="w-3 h-3" />
                                {t('Vibhag Sanyojak', 'विभाग संयोजक')}: <span className="text-foreground/70 font-medium">{vibhag.sanyojak}</span>
                              </p>
                            </div>
                            {vibhag.aayams.length > 0 && (
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                isOpen ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                              )}>
                                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </div>
                            )}
                          </div>
                        </CardHeader>
                      </button>

                      <AnimatePresence>
                        {isOpen && vibhag.aayams.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-border/50 px-5 pb-4 pt-3 space-y-2 bg-muted/10">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{t('Aayam Responsibilities', 'आयाम दायित्व टोली')}</p>
                              <div className="grid gap-2">
                                {vibhag.aayams.map(aayam => (
                                  <div
                                    key={aayam.name}
                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2.5 px-3 rounded-xl bg-background/60 border border-border/40 hover:border-primary/20 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Badge className={cn("text-[9px] border-0 shrink-0 font-bold min-w-[60px] justify-center", aayamColors[aayam.name])}>
                                        {aayam.name}
                                      </Badge>
                                      <span className="text-xs font-bold text-foreground/80">{aayam.pramukh}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 pl-1.5 sm:pl-0">
                                      <Zap className="w-3 h-3 text-primary/40" />
                                      <span className="text-[11px] text-muted-foreground font-mono">{aayam.contact}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
