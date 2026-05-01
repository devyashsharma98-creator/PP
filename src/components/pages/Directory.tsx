"use client";

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, Phone, MapPin, User, Mail, Users, Filter,
  ChevronDown, ChevronRight, Network, Shield, Award, MessageCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/useT';
import { Masthead } from '@/components/Masthead';
import { useDirectory } from '@/hooks/api/use-directory';
import { useToast } from '@/components/ToastProvider';

// ── Aayam styling config ─────────────────────────────────────────────────────

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

function getAayamStyle(departmentCode: string | null, departmentName: string | null) {
  const key = departmentCode ?? departmentName ?? '';
  return aayamConfig[key] ?? aayamConfig.Yuva;
}

// ── Sub-components ──────────────────────────────────────────────────────────

interface DirectoryContextItem {
  labelEn: string;
  labelHi: string;
  valueEn: string;
  valueHi?: string;
  detailEn: string;
  detailHi: string;
}

function DirectoryMasthead({
  t,
  contexts,
}: {
  t: (en: string, hi: string) => string;
  contexts: DirectoryContextItem[];
}) {
  return (
    <div className="directory-masthead space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="section-seal">{t('Institutional Sampark', 'संस्थागत सम्पर्क')}</p>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {t('Sampark Directory', 'सम्पर्क निर्देशिका')}
            </h1>
            <p className="max-w-2xl text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
              {t(
                'A unified contact point for karyakartas across all aayams and units, enabling seamless organisational coordination.',
                'सभी आयामों और इकाइयों के कार्यकर्ताओं हेतु एक एकीकृत सम्पर्क सूत्र, जो निर्बाध संगठनात्मक समन्वय सुनिश्चित करता है।'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="directory-context-grid">
        {contexts.map((ctx) => (
          <div key={ctx.labelEn} className="directory-context-card">
            <p className="shell-copy">{t(ctx.labelEn, ctx.labelHi)}</p>
            <p className="directory-context-value">
              {t(ctx.valueEn, ctx.valueHi ?? ctx.valueEn)}
            </p>
            <p className="directory-context-detail">
              {t(ctx.detailEn, ctx.detailHi)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AvatarInitials({ name, aayam }: { name: string; aayam: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2);
  const cfg = getAayamStyle(aayam, aayam);
  return (
    <div className={cn(
      "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border-2 transition-transform duration-500 group-hover:scale-105",
      cfg.bg, cfg.border, cfg.color
    )}>
      <span className="text-lg font-bold tracking-tighter">{initials}</span>
    </div>
  );
}

function DirectorySkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="institution-panel border-border/60 bg-background/30">
          <CardContent className="py-6 px-6">
            <div className="flex items-start gap-5">
              <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
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
  const { data: members = [], isLoading, error } = useDirectory();
  const { addToast } = useToast();

  useEffect(() => {
    if (error) {
      addToast(
        isHi ? 'निर्देशिका लोड करने में विफल' : 'Failed to load directory',
        'error',
        isHi ? 'कृपया पुनः प्रयास करें' : 'Please try again'
      );
    }
  }, [error, addToast, isHi]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const dept = m.departmentName ?? m.primaryRoleName ?? '';
      const matchAayam = aayamFilter === 'All' || dept === aayamFilter;
      const searchLower = search.toLowerCase();
      const matchSearch =
        (m.displayName?.toLowerCase() ?? '').includes(searchLower) ||
        (m.displayNameHi ?? '').includes(search) ||
        (m.unitName?.toLowerCase() ?? '').includes(searchLower) ||
        (m.primaryRoleName?.toLowerCase() ?? '').includes(searchLower) ||
        (m.departmentName?.toLowerCase() ?? '').includes(searchLower);
      return matchAayam && matchSearch;
    });
  }, [members, aayamFilter, search]);

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
      valueEn: `${new Set(members.map(m => m.unitName).filter(Boolean)).size} Active Units`,
      valueHi: `${new Set(members.map(m => m.unitName).filter(Boolean)).size} सक्रिय इकाइयाँ`,
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-10">
      <DirectoryMasthead t={t} contexts={contexts} />

      {/* Search + Filter */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-border/40 pb-6">
          <div className="relative w-full sm:w-[28rem]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('Search by name, unit or role...', 'नाम, इकाई या दायित्व से खोजें...')}
              className="pl-11 h-12 rounded-2xl bg-background/50 border-border/70 focus:border-primary/40 focus:ring-primary/10 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-[0.2em] py-1.5 px-4 bg-muted/40 border-border/60">
              <Filter className="w-3.5 h-3.5 mr-2 opacity-60" /> {t('Filter by Aayam', 'आयाम अनुसार')}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2.5 flex-wrap overflow-x-auto pb-2 no-scrollbar">
          {aayams.map(a => {
            const cfg = a === 'All' ? null : aayamConfig[a];
            return (
              <button
                key={a}
                onClick={() => setAayamFilter(a)}
                className={cn(
                  "text-[10px] md:text-[11px] font-bold uppercase tracking-[0.18em] px-5 py-2.5 rounded-xl border transition-all font-devanagari shrink-0",
                  aayamFilter === a
                    ? cfg ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-md scale-105` : 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                    : 'bg-background/60 border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {a === 'All' ? t('All', 'सभी') : a}
              </button>
            );
          })}
        </div>
      </section>

      {/* Member Cards */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="section-seal">{t('Karyakarta Registry', 'कार्यकर्ता पंजिका')}</span>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {t(`Found ${filtered.length} Karyakartas`, `${filtered.length} कार्यकर्ता मिले`)}
          </p>
        </div>

        {isLoading ? (
          <DirectorySkeleton />
        ) : error ? (
          <div className="text-center py-32 bg-muted/20 rounded-[3rem] border border-dashed border-border/60">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-border/40">
              <Users className="w-10 h-10 text-muted-foreground/20" />
            </div>
            <p className="text-lg font-bold text-muted-foreground/60 font-devanagari">
              {t('Unable to load directory.', 'निर्देशिका लोड करने में असमर्थ।')}
            </p>
            <Button variant="link" onClick={() => window.location.reload()} className="mt-2 text-primary font-bold uppercase tracking-widest text-[10px]">
              {t('Retry', 'पुनः प्रयास करें')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <AnimatePresence mode="popLayout">
              {filtered.map((m, i) => {
                const aayamLabel = m.departmentName ?? m.primaryRoleName ?? 'Yuva';
                const aayamKey = m.departmentCode ?? m.departmentName ?? 'Yuva';
                const cfg = getAayamStyle(aayamKey, aayamLabel);
                const isOpen = expanded === m.id;
                const displayName = m.displayName ?? m.email ?? 'Unknown';
                const displayNameHi = m.displayNameHi ?? displayName;
                const roleLabel = m.primaryRoleName ?? 'Karyakarta';
                const roleLabelHi = m.primaryRoleNameHi ?? roleLabel;
                return (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <Card 
                      className={cn(
                        "institution-panel hover-lift overflow-hidden cursor-pointer transition-all duration-500 bg-background/30 group",
                        isOpen ? `ring-2 ${cfg.border.replace('/25', '/60')} shadow-xl bg-background/60` : "border-border/60"
                      )}
                      onClick={() => setExpanded(isOpen ? null : m.id)}
                    >
                      <CardContent className="py-6 px-6">
                        <div className="flex items-start gap-5">
                          <AvatarInitials name={displayName} aayam={aayamKey} />
                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <h3 className="font-bold text-lg leading-none font-devanagari text-foreground/90 group-hover:text-primary transition-colors">
                                  {isHi ? displayNameHi : displayName}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <Badge className={cn("text-[9px] border-0 shrink-0 font-bold uppercase tracking-widest px-2 py-0.5", roleColors[roleLabel] ?? roleColors['Karyakarta'])}>
                                    {isHi ? roleLabelHi : roleLabel}
                                  </Badge>
                                  <span className="w-1 h-1 rounded-full bg-border" />
                                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{aayamLabel} Aayam</span>
                                </div>
                              </div>
                              <div className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-inner",
                                isOpen ? "bg-primary text-white scale-110" : "bg-muted/60 text-muted-foreground group-hover:bg-muted"
                              )}>
                                {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-medium flex-wrap">
                              <span className="flex items-center gap-1.5 bg-muted/40 px-2 py-0.5 rounded-lg border border-border/50">
                                <MapPin className="w-3.5 h-3.5 opacity-60 text-primary/60" />{m.unitName ?? t('Unknown Unit', 'अज्ञात इकाई')}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {[m.primaryRoleName, m.departmentName].filter(Boolean).map((v, idx) => (
                                  <span key={idx} className="text-[9px] bg-primary/5 text-primary/70 px-2 py-0.5 rounded-md border border-primary/10 font-bold uppercase tracking-widest">
                                    {v}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded details */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.35, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-border/50 mt-6 pt-6 space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <p className="shell-copy text-[9px] font-bold">{t('Contact Number', 'संपर्क नंबर')}</p>
                                    <a href={`tel:${m.phone ?? ''}`} className="flex items-center gap-3 p-3 rounded-2xl bg-background/80 border border-border/60 hover:border-primary/30 transition-all group/link shadow-sm">
                                      <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                                        <Phone className="w-4 h-4 text-primary group-hover/link:animate-pulse" />
                                      </div>
                                      <span className="text-sm font-mono font-bold text-foreground/80 tracking-tight">{m.phone ?? t('Not available', 'उपलब्ध नहीं')}</span>
                                    </a>
                                  </div>
                                  <div className="space-y-1.5">
                                    <p className="shell-copy text-[9px] font-bold">{t('Email Address', 'ईमेल पता')}</p>
                                    <a href={`mailto:${m.email}`} className="flex items-center gap-3 p-3 rounded-2xl bg-background/80 border border-border/60 hover:border-primary/30 transition-all group/link shadow-sm">
                                      <div className="w-9 h-9 rounded-xl bg-blue-500/5 flex items-center justify-center border border-blue-500/10">
                                        <Mail className="w-4 h-4 text-blue-500" />
                                      </div>
                                      <span className="text-sm font-bold text-foreground/80 truncate tracking-tight">{m.email}</span>
                                    </a>
                                  </div>
                                </div>
                                
                                <div className="flex gap-3 pt-2">
                                  <Button size="lg" variant="outline" className="flex-1 text-[10px] h-12 gap-3 rounded-2xl border-border/70 font-bold uppercase tracking-[0.16em] hover:bg-muted/50" asChild>
                                    <a href={`tel:${m.phone ?? ''}`}><Phone className="w-4 h-4" /> {t('Voice Call', 'कॉल करें')}</a>
                                  </Button>
                                  <Button size="lg" className="flex-1 text-[10px] h-12 gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-[0.16em] shadow-lg shadow-emerald-500/20 border-0 transition-all hover:-translate-y-0.5 active:translate-y-0" asChild>
                                    <a href={`https://wa.me/91${(m.phone ?? '').replace(/X/g, '0').replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                                      <MessageCircle className="w-4 h-4" /> WhatsApp
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
        )}
      </section>

      {filtered.length === 0 && !isLoading && !error && (
        <div className="text-center py-32 bg-muted/20 rounded-[3rem] border border-dashed border-border/60">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-border/40">
            <Users className="w-10 h-10 text-muted-foreground/20" />
          </div>
          <p className="text-lg font-bold text-muted-foreground/60 font-devanagari">{t('No members found matching your search.', 'आपकी खोज से मेल खाता कोई सदस्य नहीं मिला।')}</p>
          <Button variant="link" onClick={() => { setAayamFilter('All'); setSearch(''); }} className="mt-2 text-primary font-bold uppercase tracking-widest text-[10px]">
            {t('Clear all filters', 'फिल्टर हटाएँ')}
          </Button>
        </div>
      )}

      <div className="sutra-divider" />

      {/* Bottom coordination card */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
        <Card className="institution-panel border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 transition-all shadow-md group">
          <CardContent className="py-8 flex flex-col md:flex-row items-center gap-8 px-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
              <Network className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <p className="font-bold text-lg font-devanagari text-foreground/90">
                {t('Need help with coordination?', 'समन्वय में सहायता चाहिए?')}
              </p>
              <p className="text-sm text-muted-foreground font-devanagari leading-relaxed max-w-2xl">
                {t('Contact the Vibhag Sanyojak for institutional alignment and regional unit access. Our coordination team ensures that every karyakarta is connected to the right resource and thematic lead.', 'संस्थागत समन्वय और क्षेत्रीय इकाई पहुंच के लिए विभाग संयोजक से संपर्क करें। हमारी समन्वय टीम यह सुनिश्चित करती है कि प्रत्येक कार्यकर्ता सही संसाधन और विषयगत नेतृत्व से जुड़ा हो।')}
              </p>
            </div>
            <Button variant="outline" className="shrink-0 h-12 px-10 rounded-2xl border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/5 font-bold uppercase tracking-[0.16em] text-[11px] gap-3 shadow-sm hover:shadow-lg transition-all">
              <Shield className="w-4 h-4" /> {t('Vibhag Sanyojak', 'विभाग संयोजक')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
