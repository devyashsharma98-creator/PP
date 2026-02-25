"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown, ChevronRight, Network, Crown, Shield, User,
  BookOpen, GraduationCap, FlaskConical, Tag, Building2, MapPin,
} from 'lucide-react';
import { useT } from '@/lib/useT';

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-10">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold font-devanagari">{t('Dayitv', 'दायित्व')}</h1>
        </div>
        <p className="text-muted-foreground text-sm font-devanagari">
          {t('Organizational Structure & Responsibilities', 'संगठन संरचना एवं कार्य का स्वरूप')}
        </p>
      </div>

      {/* ── SECTION: कार्य का स्वरूप ─────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
          <span className="text-xs uppercase tracking-widest text-primary font-semibold font-devanagari px-2">
            {t('Nature of Work', 'कार्य का स्वरूप')}
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <InfoCard
              icon={Building2}
              titleHi="प्रांत और इकाई"
              titleEn="Prant & Ikai"
              color="text-amber-600 dark:text-amber-400"
              border="border-amber-500/25"
              bg="bg-amber-500/8"
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

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <InfoCard
              icon={BookOpen}
              titleHi="अध्ययन केंद्र"
              titleEn="Adhyayan Kendra"
              color="text-blue-600 dark:text-blue-400"
              border="border-blue-500/25"
              bg="bg-blue-500/8"
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

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <InfoCard
              icon={GraduationCap}
              titleHi="शिक्षण केंद्र"
              titleEn="Shikshan Kendra"
              color="text-emerald-600 dark:text-emerald-400"
              border="border-emerald-500/25"
              bg="bg-emerald-500/8"
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

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <InfoCard
              icon={FlaskConical}
              titleHi="विषय प्रमुख / विषय अध्ययन टोली"
              titleEn="Vishay Pramukh / Vishay Adhyayan Toli"
              color="text-violet-600 dark:text-violet-400"
              border="border-violet-500/25"
              bg="bg-violet-500/8"
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

        {/* Vishay List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-card rounded-xl border border-border/60 p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold font-devanagari">
              {t('Subject Areas (Vishay)', 'विषय सूची')}
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {vishayas.map((v, i) => (
              <span key={i} className="font-devanagari text-[11px] bg-muted px-2.5 py-0.5 rounded-full text-foreground/70 border border-border/50">
                {v}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      <SutraDivider />

      {/* ── SECTION: Org Hierarchy ───────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
          <span className="text-xs uppercase tracking-widest text-primary font-semibold px-2">
            {t('Organisational Hierarchy', 'संगठन संरचना')}
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent" />
        </div>

        {/* Kshetra */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card border-t-4 border-t-[hsl(var(--warning))]">
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 mb-1.5 text-[10px] border-0">
                  {t('Kshetra Level', 'क्षेत्र स्तर')}
                </Badge>
                <h3 className="font-semibold text-sm">{t('Kshetriya Pramukh', 'क्षेत्रीय प्रमुख')}</h3>
                <p className="text-xs text-muted-foreground">{t('Shri [Name] · Madhya Kshetra', 'श्री [नाम] · मध्य क्षेत्र')}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-0.5 h-3 bg-border" />
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>

        {/* Prant */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card border-t-4 border-t-info">
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 mb-1.5 text-[10px] border-0">
                  {t('Prant Level', 'प्रांत स्तर')}
                </Badge>
                <h3 className="font-semibold text-sm">{t('Prant Sanyojak', 'प्रांत संयोजक')}</h3>
                <p className="text-xs text-muted-foreground">{t('Shri Digvijay Chaturvedi · Madhya Bharat Prant', 'श्री दिग्विजय चतुर्वेदी · मध्यभारत प्रांत')}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-0.5 h-3 bg-border" />
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>

        {/* Vibhags */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold font-devanagari">
              {t('Vibhag Level — 8 Vibhags', 'विभाग स्तर — ८ विभाग')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vibhags.map((vibhag, i) => {
              const isOpen = expanded.has(vibhag.name);
              return (
                <motion.div
                  key={vibhag.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <Card className={`glass-card overflow-hidden ${vibhag.isCurrent ? 'border-primary/30' : ''}`}>
                    <button
                      className="w-full text-left"
                      onClick={() => vibhag.aayams.length > 0 && toggle(vibhag.name)}
                    >
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm font-devanagari">
                                {isHi ? vibhag.nameHi : vibhag.name}
                              </h3>
                              {vibhag.isCurrent && (
                                <Badge className="text-[9px] bg-primary/10 text-primary px-1.5 border-0">
                                  {t('Current', 'वर्तमान')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {t('Vibhag Sanyojak', 'विभाग संयोजक')}: {vibhag.sanyojak}
                            </p>
                          </div>
                          {vibhag.aayams.length > 0 && (
                            isOpen
                              ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                              : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
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
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border/50 px-4 pb-3 pt-2 space-y-1.5">
                            {vibhag.aayams.map(aayam => (
                              <div
                                key={aayam.name}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 px-3 rounded-lg bg-muted/40"
                              >
                                <div className="flex items-center gap-2">
                                  <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  <Badge className={`text-[9px] ${aayamColors[aayam.name]} shrink-0 border-0`}>
                                    {aayam.name}
                                  </Badge>
                                  <span className="text-xs font-medium">{aayam.pramukh}</span>
                                </div>
                                <span className="text-[11px] text-muted-foreground pl-6 sm:pl-0">{aayam.contact}</span>
                              </div>
                            ))}
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
    </motion.div>
  );
}
