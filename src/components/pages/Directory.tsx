"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search, Phone, MapPin, User, Mail, Users, Filter,
  ChevronDown, ChevronRight, Compass, TrendingUp, Sparkles,
  Network, Shield, Award, MessageCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/useT';

// ── Directory Context Types ─────────────────────────────────────────────

type DirectoryContextItem = {
  labelEn: string;
  labelHi: string;
  valueEn: string;
  valueHi?: string;
  detailEn: string;
  detailHi: string;
};

function DirectoryMasthead({
  t,
  contexts,
}: {
  t: (en: string, hi: string) => string;
  contexts: DirectoryContextItem[];
}) {
  return (
    <div className="dashboard-masthead space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="section-seal">{t('Institutional Sampark', 'संस्थागत सम्पर्क')}</p>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t('Sampark Directory', 'सम्पर्क निर्देशिका')}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {t(
                'A unified contact point for karyakartas across all aayams and units, enabling seamless organisational coordination.',
                'सभी आयामों और इकाइयों के कार्यकर्ताओं हेतु एक एकीकृत सम्पर्क सूत्र, जो निर्बाध संगठनात्मक समन्वय सुनिश्चित करता है।'
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

// ── Member Data ──────────────────────────────────────────────────────────────

const members = [
  { id: '1', name: 'Ramesh Sharma', nameHi: 'रमेश शर्मा', role: 'Unit Head', roleHi: 'इकाई प्रमुख', aayam: 'Prachar', contact: '98261XXXXX', email: 'ramesh@example.com', unit: 'Bhopal Shahar' },
  { id: '2', name: 'Anil Verma', nameHi: 'अनिल वर्मा', role: 'Aayam Pramukh', roleHi: 'आयाम प्रमुख', aayam: 'Vimarsh', contact: '98263XXXXX', email: 'anil@example.com', unit: 'Bhopal Shahar' },
  { id: '3', name: 'Kavita Singh', nameHi: 'कविता सिंह', role: 'Karyakarta', roleHi: 'कार्यकर्ता', aayam: 'Shodh', contact: '98264XXXXX', email: 'kavita@example.com', unit: 'Vidisha' },
  { id: '4', name: 'Pradeep Yadav', nameHi: 'प्रदीप यादव', role: 'Karyakarta', roleHi: 'कार्यकर्ता', aayam: 'Yuva', contact: '98265XXXXX', email: 'pradeep@example.com', unit: 'Bhopal Shahar' },
  { id: '5', name: 'Meena Joshi', nameHi: 'मीना जोशी', role: 'Karyakarta', roleHi: 'कार्यकर्ता', aayam: 'Mahila', contact: '98266XXXXX', email: 'meena@example.com', unit: 'Sehore' },
  { id: '6', name: 'Deshraj Patel', nameHi: 'देशराज पटेल', role: 'Unit Head', roleHi: 'इकाई प्रमुख', aayam: 'Prachar', contact: '98267XXXXX', email: 'deshraj@example.com', unit: 'Raisen' },
  { id: '7', name: 'Suresh Yadav', nameHi: 'सुरेश यादव', role: 'Aayam Pramukh', roleHi: 'आयाम प्रमुख', aayam: 'Yuva', contact: '98268XXXXX', email: 'suresh@example.com', unit: 'Bhopal Shahar' },
  { id: '8', name: 'Rajesh Tiwari', nameHi: 'राजेश तिवारी', role: 'Karyakarta', roleHi: 'कार्यकर्ता', aayam: 'Shodh', contact: '98269XXXXX', email: 'rajesh@example.com', unit: 'Vidisha' },
  { id: '9', name: 'Deepak Kumar', nameHi: 'दीपक कुमार', role: 'Karyakarta', roleHi: 'कार्यकर्ता', aayam: 'Vimarsh', contact: '98262XXXXX', email: 'deepak@example.com', unit: 'Bhopal Shahar' },
  { id: '10', name: 'Sunita Chouhan', nameHi: 'सुनीता चौहान', role: 'Aayam Pramukh', roleHi: 'आयाम प्रमुख', aayam: 'Mahila', contact: '98270XXXXX', email: 'sunita@example.com', unit: 'Raisen' },
];

const aayamConfig: Record<string, { color: string; bg: string; border: string }> = {
  Yuva: { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/25' },
  Mahila: { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/25' },
  Shodh: { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/25' },
  Prachar: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
  Vimarsh: { color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/25' },
};

const roleColors: Record<string, string> = {
  'Unit Head': 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  'Aayam Pramukh': 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  'Karyakarta': 'bg-muted text-muted-foreground',
};

const aayams = ['All', 'Yuva', 'Mahila', 'Shodh', 'Prachar', 'Vimarsh'];

// ── Avatar Initials ──────────────────────────────────────────────────────────

function AvatarInitials({ name, aayam }: { name: string; aayam: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2);
  const cfg = aayamConfig[aayam] || aayamConfig.Yuva;
  return (
    <div className={`w-12 h-12 rounded-full ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
      <span className={`text-sm font-bold ${cfg.color}`}>{initials}</span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function Directory() {
  const t = useT();
  const isHi = t('en', 'hi') === 'hi';
  const [search, setSearch] = useState('');
  const [aayamFilter, setAayamFilter] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = members.filter(m => {
    const matchAayam = aayamFilter === 'All' || m.aayam === aayamFilter;
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
      || m.nameHi.includes(search)
      || m.unit.toLowerCase().includes(search.toLowerCase());
    return matchAayam && matchSearch;
  });

  const contexts: DirectoryContextItem[] = [
    {
      labelEn: "Network Strength",
      labelHi: "नेटवर्क शक्ति",
      valueEn: `${members.length} Active Karyakartas`,
      valueHi: `${members.length} सक्रिय कार्यकर्ता`,
      detailEn: "Enabling coordinated action across the vibhag.",
      detailHi: "पूरे विभाग में समन्वित कार्य को सक्षम करना।",
    },
    {
      labelEn: "Regional Footprint",
      labelHi: "क्षेत्रीय उपस्थिति",
      valueEn: `${new Set(members.map(m => m.unit)).size} Active Units`,
      valueHi: `${new Set(members.map(m => m.unit)).size} सक्रिय इकाइयाँ`,
      detailEn: "Presence in all major educational and urban centers.",
      detailHi: "सभी प्रमुख शैक्षिक और शहरी केंद्रों में उपस्थिति।",
    },
    {
      labelEn: "Institutional Connection",
      labelHi: "संस्थागत सम्पर्क",
      valueEn: "Unified Contact Point",
      valueHi: "एकीकृत सम्पर्क सूत्र",
      detailEn: "Direct access to thematic and unit leadership.",
      detailHi: "विषयगत और इकाई नेतृत्व तक सीधी पहुंच।",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-10">
      <DirectoryMasthead t={t} contexts={contexts} />

      {/* Search + Filter */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('Search by name, unit or role...', 'नाम, इकाई या दायित्व से खोजें...')}
              className="pl-10 h-11 rounded-xl bg-background/50 border-border/60 focus:border-primary/40 focus:ring-primary/10 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1.5 py-1 px-3 bg-muted/30 border-border/60">
              <Filter className="w-3.5 h-3.5 opacity-60" /> {t('Filter by Aayam', 'आयाम अनुसार')}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap pb-2">
          {aayams.map(a => {
            const cfg = a === 'All' ? null : aayamConfig[a];
            return (
              <button
                key={a}
                onClick={() => setAayamFilter(a)}
                className={cn(
                  "text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full border transition-all font-devanagari",
                  aayamFilter === a
                    ? cfg ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-sm` : 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                    : 'bg-background/50 border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                )}
              >
                {a === 'All' ? t('All', 'सभी') : a}
              </button>
            );
          })}
        </div>
      </section>

      {/* Member Cards */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="section-seal">{t('Karyakarta Registry', 'कार्यकर्ता पंजिका')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((m, i) => {
              const cfg = aayamConfig[m.aayam] || aayamConfig.Yuva;
              const isOpen = expanded === m.id;
              return (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card 
                    className={cn(
                      "institution-panel hover-lift overflow-hidden cursor-pointer transition-all duration-300",
                      isOpen ? `border-l-4 ${cfg.border.replace('/25', '/60')} ring-1 ring-primary/10 shadow-md` : "border-border/60"
                    )}
                    onClick={() => setExpanded(isOpen ? null : m.id)}
                  >
                    <CardContent className="py-4 px-5">
                      <div className="flex items-center gap-4">
                        <AvatarInitials name={m.name} aayam={m.aayam} />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm truncate text-foreground/90">
                              {isHi ? m.nameHi : m.name}
                            </h3>
                            <Badge className={cn("text-[9px] border-0 shrink-0 font-bold uppercase tracking-wider", roleColors[m.role])}>
                              {isHi ? m.roleHi : m.role}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <Badge className={cn("text-[9px] border-0 font-bold", cfg.bg, cfg.color)}>{m.aayam}</Badge>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                              <MapPin className="w-3 h-3 opacity-60" />{m.unit}
                            </span>
                          </div>
                        </div>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                          isOpen ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </div>
                      </div>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-border/50 mt-4 pt-4 space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <a href={`tel:${m.contact}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-border/40 hover:border-primary/20 transition-colors group">
                                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center">
                                    <Phone className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
                                  </div>
                                  <span className="text-xs font-mono font-medium text-foreground/80">{m.contact}</span>
                                </a>
                                <a href={`mailto:${m.email}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-border/40 hover:border-primary/20 transition-colors group">
                                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center">
                                    <Mail className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
                                  </div>
                                  <span className="text-xs font-medium text-foreground/80 truncate">{m.email}</span>
                                </a>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1 text-[10px] h-9 gap-2 rounded-xl border-border/60 font-bold uppercase tracking-widest" asChild>
                                  <a href={`tel:${m.contact}`}><Phone className="w-3.5 h-3.5" /> {t('Voice Call', 'कॉल करें')}</a>
                                </Button>
                                <Button size="sm" className="flex-1 text-[10px] h-9 gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20 border-0" asChild>
                                  <a href={`https://wa.me/91${m.contact.replace(/X/g, '0')}`} target="_blank" rel="noopener noreferrer">
                                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      {filtered.length === 0 && (
        <div className="text-center py-24 bg-muted/20 rounded-[3rem] border border-dashed border-border/60">
          <Users className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-lg font-bold text-muted-foreground/60 font-devanagari">{t('No members found matching your search.', 'आपकी खोज से मेल खाता कोई सदस्य नहीं मिला।')}</p>
        </div>
      )}

      <div className="sutra-divider" />

      {/* Bottom coordination card */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
        <Card className="institution-panel border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 transition-colors shadow-sm">
          <CardContent className="py-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Network className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <p className="font-bold text-base font-devanagari text-foreground/90">
                {t('Need help with coordination?', 'समन्वय में सहायता चाहिए?')}
              </p>
              <p className="text-sm text-muted-foreground font-devanagari">
                {t('Contact the Vibhag Sanyojak for institutional alignment and regional unit access.', 'संस्थागत समन्वय और क्षेत्रीय इकाई पहुंच के लिए विभाग संयोजक से संपर्क करें।')}
              </p>
            </div>
            <Button variant="outline" className="shrink-0 h-11 px-8 rounded-xl border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/5 font-bold uppercase tracking-widest text-xs gap-2">
              <Shield className="w-4 h-4" /> {t('Vibhag Sanyojak', 'विभाग संयोजक')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
