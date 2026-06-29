"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Search, GraduationCap, BookOpen, Users, Filter, X, Plus,
  MapPin, Briefcase, Mail, Phone, Star, Globe, ChevronRight,
  ChevronDown, Award, PenLine, Eye, EyeOff, Save, ExternalLink,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useT } from '@/lib/useT';
import { cn } from '@/lib/utils';
import { Masthead } from '@/components/Masthead';
import { VishaySelect } from '@/components/vishay/VishaySelect';
import { VishayChips } from '@/components/vishay/VishayChips';
import { useVishayLinks, useSetVishayLinks } from '@/hooks/api/use-vishayas';

// ── Types ──────────────────────────────────────────────────────────────────

interface Scholar {
  id: string;
  slug: string;
  name: string;
  nameHi: string;
  email: string | null;
  phone: string | null;
  expertise: string[];
  affiliation: string | null;
  affiliationHi: string | null;
  designation: string | null;
  city: string | null;
  bio: string;
  bioHi: string;
  availableFor: string[];
  photoUrl: string | null;
  isPublished: boolean;
  sortOrder: number;
}

const EXPERTISE_OPTIONS = ["History", "Economics", "Geopolitics", "Philosophy", "Science", "Education", "Culture"];
const AVAILABLE_FOR_OPTIONS = ["Writing", "Speaking", "Reviewing", "Mentoring"];

const expertiseLabelsHi: Record<string, string> = {
  History: "इतिहास", Economics: "अर्थशास्त्र", Geopolitics: "भू-राजनीति",
  Philosophy: "दर्शन", Science: "विज्ञान", Education: "शिक्षा", Culture: "संस्कृति",
};

const availableForLabelsHi: Record<string, string> = {
  Writing: "लेखन", Speaking: "वक्तव्य", Reviewing: "समीक्षा", Mentoring: "मार्गदर्शन",
};

// ── Helper ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function ScholarAvatar({ photoUrl, name, className, textClass }: { photoUrl: string | null; name: string; className?: string; textClass?: string }) {
  const [imgError, setImgError] = useState(false);
  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        onError={() => setImgError(true)}
        className={cn("object-cover", className)}
      />
    );
  }
  return (
    <div className={cn("flex items-center justify-center shrink-0", textClass ?? "font-bold")}>
      {getInitials(name)}
    </div>
  );
}

// ── Form Component ─────────────────────────────────────────────────────────

type ScholarSaveData = Partial<Scholar> & { vishayIds?: string[] };

interface ScholarFormProps {
  initial?: Scholar | null;
  onSave: (data: ScholarSaveData) => Promise<void>;
  onCancel: () => void;
  t: (en: string, hi: string) => string;
  isHi: boolean;
}

function ScholarForm({ initial, onSave, onCancel, t, isHi }: ScholarFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [nameHi, setNameHi] = useState(initial?.nameHi ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [designation, setDesignation] = useState(initial?.designation ?? '');
  const [affiliation, setAffiliation] = useState(initial?.affiliation ?? '');
  const [affiliationHi, setAffiliationHi] = useState(initial?.affiliationHi ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [bio, setBio] = useState(initial?.bio ?? '');
  const [bioHi, setBioHi] = useState(initial?.bioHi ?? '');
  const [expertise, setExpertise] = useState<string[]>(initial?.expertise ?? []);
  const [availableFor, setAvailableFor] = useState<string[]>(initial?.availableFor ?? []);
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [vishayIds, setVishayIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // On edit, load the scholar's existing vishay tags and seed the selector.
  const { data: existingVishayIds } = useVishayLinks('scholar', initial?.id ?? null);
  useEffect(() => {
    if (existingVishayIds) setVishayIds(existingVishayIds);
  }, [existingVishayIds]);

  function toggleExpertise(val: string) {
    setExpertise(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  }

  function toggleAvailable(val: string) {
    setAvailableFor(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !nameHi.trim()) {
      setError(t("Name and Hindi name are required.", "नाम और हिंदी नाम आवश्यक है।"));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        name: name.trim(),
        nameHi: nameHi.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        designation: designation.trim() || null,
        affiliation: affiliation.trim() || null,
        affiliationHi: affiliationHi.trim() || null,
        city: city.trim() || null,
        bio,
        bioHi,
        expertise,
        availableFor,
        isPublished,
        slug: initial?.slug ?? name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        vishayIds,
      });
    } catch {
      setError(t("Failed to save scholar.", "विद्वान सहेजने में विफल।"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium">{error}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Name (English)', 'नाम (अंग्रेज़ी)')}</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Ramesh Sharma" className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Name (Hindi)', 'नाम (हिंदी)')}</label>
          <Input value={nameHi} onChange={e => setNameHi(e.target.value)} placeholder="डॉ. रमेश शर्मा" className="h-11 rounded-xl font-devanagari" />
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Email', 'ईमेल')}</label>
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="scholar@example.com" type="email" className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Phone', 'फ़ोन')}</label>
          <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91-9876543210" className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Designation', 'पद')}</label>
          <Input value={designation} onChange={e => setDesignation(e.target.value)} placeholder="Professor" className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('City', 'शहर')}</label>
          <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Bhopal" className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Affiliation (English)', 'संबद्धता (अंग्रेज़ी)')}</label>
          <Input value={affiliation} onChange={e => setAffiliation(e.target.value)} placeholder="Bhopal University" className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Affiliation (Hindi)', 'संबद्धता (हिंदी)')}</label>
          <Input value={affiliationHi} onChange={e => setAffiliationHi(e.target.value)} placeholder="भोपाल विश्वविद्यालय" className="h-11 rounded-xl font-devanagari" />
        </div>
      </div>

      <div className="space-y-3">
        <p className="shell-copy text-[10px]">{t('Expertise Areas', 'विशेषज्ञता क्षेत्र')}</p>
        <div className="flex flex-wrap gap-2">
          {EXPERTISE_OPTIONS.map(exp => (
            <button
              key={exp}
              type="button"
              onClick={() => toggleExpertise(exp)}
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.15em] px-4 py-2 min-h-[44px] rounded-xl border transition-all",
                expertise.includes(exp)
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-background/60 border-border/60 text-muted-foreground hover:border-primary/40"
              )}
            >
              {isHi ? (expertiseLabelsHi[exp] ?? exp) : exp}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="shell-copy text-[10px]">{t('Available For', 'उपलब्धता')}</p>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_FOR_OPTIONS.map(av => (
            <button
              key={av}
              type="button"
              onClick={() => toggleAvailable(av)}
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.15em] px-4 py-2 min-h-[44px] rounded-xl border transition-all",
                availableFor.includes(av)
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                  : "bg-background/60 border-border/60 text-muted-foreground hover:border-emerald-400/40"
              )}
            >
              {isHi ? (availableForLabelsHi[av] ?? av) : av}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="shell-copy text-[10px]">{t('Vishay', 'विषय')} <span className="normal-case tracking-normal opacity-70">({t('subject areas, optional', 'विषय क्षेत्र, वैकल्पिक')})</span></p>
        <VishaySelect value={vishayIds} onChange={setVishayIds} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Bio (English)', 'जीवनी (अंग्रेज़ी)')}</label>
          <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Bio (Hindi)', 'जीवनी (हिंदी)')}</label>
          <Textarea value={bioHi} onChange={e => setBioHi(e.target.value)} rows={3} className="rounded-xl font-devanagari" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setIsPublished(!isPublished)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl border text-xs font-bold uppercase tracking-widest transition-all",
            isPublished
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
              : "bg-muted/40 text-muted-foreground border-border/60"
          )}
        >
          {isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {isPublished ? t('Published', 'प्रकाशित') : t('Draft', 'ड्राफ़्ट')}
        </button>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={saving} className="gap-2 h-12 px-8 rounded-xl font-bold uppercase tracking-[0.12em] text-[11px] shadow-lg">
          <Save className="w-4 h-4" /> {saving ? t('Saving…', 'सहेज रहे…') : t('Save Scholar', 'विद्वान सहेजें')}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className="h-12 px-6 rounded-xl text-xs font-bold uppercase tracking-widest">
          {t('Cancel', 'रद्द करें')}
        </Button>
      </div>
    </form>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function Scholars() {
  const { lang, permissions } = useAppContext();
  const t = useT();
  const isHi = lang === 'hi';

  const [search, setSearch] = useState('');
  const [expertiseFilter, setExpertiseFilter] = useState('All');
  const [availableFilter, setAvailableFilter] = useState('All');
  const [selectedScholar, setSelectedScholar] = useState<Scholar | null>(null);
  const [scholarsList, setScholarsList] = useState<Scholar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingScholar, setEditingScholar] = useState<Scholar | null>(null);

  const canManage = permissions.canManageUsers || false;
  const setVishayLinks = useSetVishayLinks();

  useEffect(() => {
    let active = true;
    fetch('/api/v1/scholars')
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (active && json?.success && Array.isArray(json.data)) {
          setScholarsList(json.data as Scholar[]);
        }
      })
      .catch(() => { /* keep empty */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    return scholarsList.filter(s => {
      const matchExpertise = expertiseFilter === 'All' || s.expertise.includes(expertiseFilter);
      const matchAvailable = availableFilter === 'All' || s.availableFor.includes(availableFilter);
      const q = search.toLowerCase();
      const matchSearch =
        s.name.toLowerCase().includes(q) ||
        s.nameHi.includes(q) ||
        (s.affiliation ?? '').toLowerCase().includes(q) ||
        (s.designation ?? '').toLowerCase().includes(q) ||
        (s.city ?? '').toLowerCase().includes(q) ||
        s.expertise.some(e => e.toLowerCase().includes(q));
      return matchExpertise && matchAvailable && matchSearch;
    });
  }, [scholarsList, expertiseFilter, availableFilter, search]);

  const uniqueExpertise = useMemo(() => {
    const set = new Set<string>();
    scholarsList.forEach(s => s.expertise.forEach(e => set.add(e)));
    return ['All', ...Array.from(set).sort()];
  }, [scholarsList]);

  const uniqueAvailable = useMemo(() => {
    const set = new Set<string>();
    scholarsList.forEach(s => s.availableFor.forEach(a => set.add(a)));
    return ['All', ...Array.from(set).sort()];
  }, [scholarsList]);

  // Persist vishay tags to the cross-module bridge once the scholar has an id.
  // Best-effort: a failed link write must not undo a successful scholar save.
  async function persistVishayLinks(scholarId: string, vishayIds: string[] | undefined) {
    if (!vishayIds) return;
    try {
      await setVishayLinks.mutateAsync({ contentType: 'scholar', contentId: scholarId, vishayIds });
    } catch {
      /* swallow — scholar already saved */
    }
  }

  async function handleCreate(data: ScholarSaveData) {
    const { vishayIds, ...scholarData } = data;
    const res = await fetch('/api/v1/scholars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scholarData),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed');
    setScholarsList(prev => [...prev, json.data]);
    await persistVishayLinks(json.data.id, vishayIds);
    setShowForm(false);
  }

  async function handleUpdate(data: ScholarSaveData) {
    if (!editingScholar) return;
    const { vishayIds, ...scholarData } = data;
    const res = await fetch(`/api/v1/scholars/${editingScholar.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scholarData),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed');
    setScholarsList(prev => prev.map(s => s.id === json.data.id ? json.data : s));
    await persistVishayLinks(json.data.id, vishayIds);
    setEditingScholar(null);
    setSelectedScholar(null);
  }

  async function handleDelete(id: string) {
    if (!confirm(t("Delete this scholar?", "इस विद्वान को हटाएं?"))) return;
    const res = await fetch(`/api/v1/scholars/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok || !json.success) return;
    setScholarsList(prev => prev.filter(s => s.id !== id));
    if (selectedScholar?.id === id) setSelectedScholar(null);
  }

  const contexts = [
    {
      icon: <GraduationCap className="w-5 h-5" />,
      labelEn: "Vidvat Mandal",
      labelHi: "विद्वत मंडल",
      valueEn: `${scholarsList.length} Scholars`,
      valueHi: `${scholarsList.length} विद्वान`,
      detailEn: "Eminent thinkers and domain experts in the network.",
      detailHi: "नेटवर्क में प्रतिष्ठित विचारक और क्षेत्र विशेषज्ञ।",
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      labelEn: "Active Disciplines",
      labelHi: "सक्रिय विषय",
      valueEn: `${uniqueExpertise.length - 1} Subject Areas`,
      valueHi: `${uniqueExpertise.length - 1} विषय क्षेत्र`,
      detailEn: "Across history, economics, philosophy, science, culture and more.",
      detailHi: "इतिहास, अर्थशास्त्र, दर्शन, विज्ञान, संस्कृति और अधिक में।",
    },
    {
      icon: <Award className="w-5 h-5" />,
      labelEn: "Available for Review",
      labelHi: "समीक्षा हेतु उपलब्ध",
      valueEn: `${scholarsList.filter(s => s.availableFor.includes("Reviewing")).length} Reviewers`,
      valueHi: `${scholarsList.filter(s => s.availableFor.includes("Reviewing")).length} समीक्षक`,
      detailEn: "Scholars open to peer review and editorial feedback.",
      detailHi: "सहकर्मी समीक्षा और संपादकीय प्रतिक्रिया के लिए तत्पर विद्वान।",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-10">
      <Masthead
        title="Vidvat Mandal"
        titleHi="विद्वत मंडल"
        seal="Scholar Registry"
        sealHi="विद्वत मंडल पंजीकरण"
        subtitle="A curated registry of scholars, researchers, and domain experts engaged with the organisation's intellectual mission."
        subtitleHi="संगठन के बौद्धिक मिशन से जुड़े विद्वानों, शोधकर्ताओं और क्षेत्र विशेषज्ञों की एक संकलित निर्देशिका।"
        icon={<GraduationCap className="w-7 h-7 text-primary" />}
        contexts={contexts}
        actions={
          canManage && !showForm ? (
            <Button onClick={() => setShowForm(true)} className="gap-2 h-12 px-6 rounded-2xl font-bold uppercase tracking-[0.12em] text-[11px] shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> {t('Add Scholar', 'विद्वान जोड़ें')}
            </Button>
          ) : undefined
        }
      />

      {/* Create/Edit Form */}
      <AnimatePresence>
        {(showForm || editingScholar) && (
          <motion.div
            id="scholar-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <Card className="institution-panel border-primary/25 shadow-[0_32px_64px_-16px_hsl(var(--navy)/0.35)] overflow-hidden bg-background/60 mb-6">
              <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-primary" />
              <CardContent className="py-8 px-6 md:px-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold">
                    {editingScholar
                      ? t('Edit Scholar', 'विद्वान संपादित करें')
                      : t('Add New Scholar', 'नया विद्वान जोड़ें')}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingScholar(null); }} className="h-10 w-10 rounded-xl p-0">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <ScholarForm
                  initial={editingScholar}
                  onSave={editingScholar ? handleUpdate : handleCreate}
                  onCancel={() => { setShowForm(false); setEditingScholar(null); }}
                  t={t}
                  isHi={isHi}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + Filters */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-border/40 pb-6">
          <div className="relative w-full sm:w-[28rem]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('Search scholars by name, expertise, affiliation…', 'नाम, विशेषज्ञता, संबद्धता से खोजें…')}
              className="pl-11 h-12 rounded-2xl bg-background/50 border-border/70 focus:border-primary/40 focus:ring-primary/10 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-[0.2em] py-1.5 px-4 bg-muted/40 border-border/60">
              <Filter className="w-3.5 h-3.5 mr-2 opacity-60" /> {t('Filter', 'फ़िल्टर')}
            </Badge>
          </div>
        </div>

        {/* Expertise filter chips */}
        <div className="space-y-2">
          <p className="shell-copy text-[10px]">{t('Expertise', 'विशेषज्ञता')}</p>
          <div className="flex gap-2.5 flex-wrap overflow-x-auto pb-2 no-scrollbar">
            {uniqueExpertise.map(exp => (
              <button
                key={exp}
                onClick={() => setExpertiseFilter(exp)}
                className={cn(
                  "text-[10px] md:text-[11px] font-bold uppercase tracking-[0.18em] px-5 py-2.5 min-h-[44px] rounded-xl border transition-all shrink-0",
                  expertiseFilter === exp
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                    : 'bg-background/60 border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {exp === 'All' ? t('All', 'सभी') : isHi ? (expertiseLabelsHi[exp] ?? exp) : exp}
              </button>
            ))}
          </div>
        </div>

        {/* Available-for filter chips */}
        <div className="space-y-2">
          <p className="shell-copy text-[10px]">{t('Availability', 'उपलब्धता')}</p>
          <div className="flex gap-2.5 flex-wrap overflow-x-auto pb-2 no-scrollbar">
            {uniqueAvailable.map(av => (
              <button
                key={av}
                onClick={() => setAvailableFilter(av)}
                className={cn(
                  "text-[10px] md:text-[11px] font-bold uppercase tracking-[0.18em] px-5 py-2.5 min-h-[44px] rounded-xl border transition-all shrink-0",
                  availableFilter === av
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20 scale-105'
                    : 'bg-background/60 border-border/70 text-muted-foreground hover:border-emerald-400/40 hover:text-foreground'
                )}
              >
                {av === 'All' ? t('All', 'सभी') : isHi ? (availableForLabelsHi[av] ?? av) : av}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Scholar Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="section-seal">{t('Scholar Registry', 'विद्वान पंजिका')}</span>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {t(`Showing ${filtered.length} results`, `${filtered.length} परिणाम मिले`)}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="institution-panel border-border/60 bg-background/30 animate-pulse">
                <CardContent className="py-6 px-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-muted shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="flex gap-2">
                        <div className="h-5 bg-muted rounded w-16" />
                        <div className="h-5 bg-muted rounded w-20" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 bg-muted/20 rounded-[3rem] border border-dashed border-border/60">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-border/40">
              <GraduationCap className="w-10 h-10 text-muted-foreground/20" />
            </div>
            <p className="text-lg font-bold text-muted-foreground/60 font-devanagari">
              {t('No scholars found.', 'कोई विद्वान नहीं मिला।')}
            </p>
            <Button variant="link" onClick={() => { setExpertiseFilter('All'); setAvailableFilter('All'); setSearch(''); }} className="mt-2 text-primary font-bold uppercase tracking-widest text-[10px]">
              {t('Clear all filters', 'फिल्टर हटाएँ')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filtered.map((scholar, i) => (
                <motion.div
                  key={scholar.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <Card
                    className={cn(
                      "institution-panel overflow-hidden cursor-pointer transition-all duration-500 bg-background/30 group",
                      selectedScholar?.id === scholar.id
                        ? "ring-2 ring-primary/60 shadow-xl bg-background/60"
                        : "border-border/60 hover:border-primary/30"
                    )}
                    onClick={() => setSelectedScholar(selectedScholar?.id === scholar.id ? null : scholar)}
                  >
                    <CardContent className="py-6 px-6">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl shrink-0 shadow-sm border-2 overflow-hidden transition-all duration-500 group-hover:scale-105",
                          "bg-primary/10 border-primary/20"
                        )}>
                          <ScholarAvatar
                            photoUrl={scholar.photoUrl}
                            name={scholar.name}
                            className="w-full h-full rounded-2xl"
                            textClass="w-full h-full flex items-center justify-center text-primary text-lg font-bold"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0">
                              <h3 className="font-bold text-base leading-tight font-devanagari text-foreground/90 group-hover:text-primary transition-colors truncate">
                                {isHi ? scholar.nameHi : scholar.name}
                              </h3>
                              {scholar.designation && (
                                <p className="text-[11px] text-muted-foreground font-medium truncate">{scholar.designation}</p>
                              )}
                            </div>
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0",
                              selectedScholar?.id === scholar.id
                                ? "bg-primary text-white scale-110"
                                : "bg-muted/60 text-muted-foreground"
                            )}>
                              {selectedScholar?.id === scholar.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                            {scholar.affiliation && (
                              <span className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-lg border border-border/50">
                                <Briefcase className="w-3 h-3 opacity-60" />{scholar.affiliation}
                              </span>
                            )}
                            {scholar.city && (
                              <span className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-lg border border-border/50">
                                <MapPin className="w-3 h-3 opacity-60" />{scholar.city}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {scholar.expertise.slice(0, 3).map(exp => (
                              <Badge key={exp} className="text-[8px] bg-primary/5 text-primary/70 border-primary/10 font-bold uppercase tracking-widest px-2 py-0">
                                {isHi ? (expertiseLabelsHi[exp] ?? exp) : exp}
                              </Badge>
                            ))}
                            {scholar.expertise.length > 3 && (
                              <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest px-2 py-0 border-border/60">
                                +{scholar.expertise.length - 3}
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {scholar.availableFor.map(av => (
                              <Badge key={av} className="text-[8px] bg-emerald-500/5 text-emerald-600 border-emerald-500/20 font-bold uppercase tracking-widest px-2 py-0">
                                {isHi ? (availableForLabelsHi[av] ?? av) : av}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Selected Scholar Detail Panel */}
      <AnimatePresence>
        {selectedScholar && !editingScholar && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="pt-2"
          >
            <Card className="institution-panel border-primary/25 shadow-[0_32px_64px_-16px_hsl(var(--navy)/0.35)] overflow-hidden bg-background/60">
              <div className="h-2 bg-gradient-to-r from-primary via-primary/60 to-primary/30" />
              <CardContent className="py-8 px-6 md:px-10">
                <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                  <div className="shrink-0 flex flex-col items-center gap-4">
                    <div className={cn(
                      "w-24 h-24 rounded-[2rem] overflow-hidden shadow-lg border-2",
                      "bg-primary/10 border-primary/20"
                    )}>
                      <ScholarAvatar
                        photoUrl={selectedScholar.photoUrl}
                        name={selectedScholar.name}
                        className="w-full h-full rounded-[2rem]"
                        textClass="w-full h-full flex items-center justify-center text-primary text-3xl font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-6 min-w-0">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1">
                          {isHi ? 'विद्वान प्रोफ़ाइल' : 'Scholar Profile'}
                        </Badge>
                        {!selectedScholar.isPublished && (
                          <Badge variant="outline" className="text-[10px] border-amber-400/40 text-amber-600 bg-amber-500/5 font-bold uppercase tracking-widest">
                            {t('Draft', 'ड्राफ़्ट')}
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold font-devanagari tracking-tight text-foreground/90">
                        {isHi ? selectedScholar.nameHi : selectedScholar.name}
                      </h2>
                      {selectedScholar.designation && (
                        <p className="text-base text-muted-foreground font-medium">{selectedScholar.designation}</p>
                      )}
                    </div>

                    {/* Contact & Affiliation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedScholar.email && (
                        <a href={`mailto:${selectedScholar.email}`} className="flex items-center gap-3 p-3 rounded-2xl bg-background/80 border border-border/60 hover:border-primary/30 transition-all group/link shadow-sm">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/5 flex items-center justify-center border border-blue-500/10">
                            <Mail className="w-4 h-4 text-blue-500" />
                          </div>
                          <span className="text-sm font-bold text-foreground/80 truncate tracking-tight">{selectedScholar.email}</span>
                        </a>
                      )}
                      {selectedScholar.phone && (
                        <a href={`tel:${selectedScholar.phone}`} className="flex items-center gap-3 p-3 rounded-2xl bg-background/80 border border-border/60 hover:border-primary/30 transition-all group/link shadow-sm">
                          <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                            <Phone className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-sm font-mono font-bold text-foreground/80 tracking-tight">{selectedScholar.phone}</span>
                        </a>
                      )}
                      {selectedScholar.affiliation && (
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-background/80 border border-border/60">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/5 flex items-center justify-center border border-amber-500/10">
                            <Briefcase className="w-4 h-4 text-amber-500" />
                          </div>
                          <span className="text-sm font-bold text-foreground/80">
                            {isHi && selectedScholar.affiliationHi ? selectedScholar.affiliationHi : selectedScholar.affiliation}
                          </span>
                        </div>
                      )}
                      {selectedScholar.city && (
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-background/80 border border-border/60">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-foreground/80">{selectedScholar.city}</span>
                        </div>
                      )}
                    </div>

                    {/* Expertise & Availability */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 border-y border-border/50">
                      <div className="space-y-2">
                        <p className="shell-copy text-[10px]">{t('Expertise', 'विशेषज्ञता')}</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedScholar.expertise.map(exp => (
                            <Badge key={exp} className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1.5">
                              {isHi ? (expertiseLabelsHi[exp] ?? exp) : exp}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="shell-copy text-[10px]">{t('Available For', 'उपलब्धता')}</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedScholar.availableFor.map(av => (
                            <Badge key={av} className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1.5">
                              {isHi ? (availableForLabelsHi[av] ?? av) : av}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Vishay tags */}
                    <VishayChips contentType="scholar" contentId={selectedScholar.id} />

                    {/* Bio */}
                    {(selectedScholar.bio || selectedScholar.bioHi) && (
                      <div className="relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                        <p className={`text-sm md:text-base text-foreground/80 leading-relaxed pl-4 ${isHi ? 'font-devanagari' : ''}`}>
                          {isHi ? (selectedScholar.bioHi || selectedScholar.bio) : (selectedScholar.bio || selectedScholar.bioHi)}
                        </p>
                      </div>
                    )}

                    {/* Admin actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Button variant="ghost" onClick={() => setSelectedScholar(null)} className="text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-widest px-5 h-11 rounded-xl">
                        {t('Close', 'बंद करें')}
                      </Button>
                      <Link href={`/scholars/${selectedScholar.slug}`}>
                        <Button variant="outline" className="gap-2 h-11 px-6 rounded-xl border-border/70 text-xs font-bold uppercase tracking-widest">
                          <ExternalLink className="w-4 h-4" /> {t('View Profile', 'प्रोफ़ाइल देखें')}
                        </Button>
                      </Link>
                      {canManage && (
                        <>
                          <Button variant="outline" onClick={() => { setEditingScholar(selectedScholar); }} className="gap-2 h-11 px-6 rounded-xl border-border/70 text-xs font-bold uppercase tracking-widest">
                            <PenLine className="w-4 h-4" /> {t('Edit', 'संपादित करें')}
                          </Button>
                          <Button variant="outline" onClick={() => handleDelete(selectedScholar.id)} className="gap-2 h-11 px-6 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 text-xs font-bold uppercase tracking-widest">
                            <X className="w-4 h-4" /> {t('Delete', 'हटाएँ')}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sutra-divider" />

      {/* Bottom CTA */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
        <Card className="institution-panel border-primary/15 bg-primary/5 hover:border-primary/30 transition-all shadow-md group">
          <CardContent className="py-8 flex flex-col md:flex-row items-center gap-8 px-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <p className="font-bold text-lg font-devanagari text-foreground/90">
                {t('Expand the Vidvat Mandal', 'विद्वत मंडल का विस्तार करें')}
              </p>
              <p className="text-sm text-muted-foreground font-devanagari leading-relaxed max-w-2xl">
                {t('Know a scholar who should be part of this network? Suggest their inclusion to strengthen our intellectual community.', 'ऐसे विद्वान को जानते हैं जो इस नेटवर्क का हिस्सा होना चाहिए? हमारे बौद्धिक समुदाय को मजबूत करने के लिए उनके नाम सुझाएं।')}
              </p>
            </div>
            <Button
              variant="outline"
              className="shrink-0 h-12 px-10 rounded-2xl border-primary/30 text-primary hover:bg-primary/5 font-bold uppercase tracking-[0.16em] text-[11px] gap-3 shadow-sm hover:shadow-lg transition-all"
              onClick={() => {
                if (canManage) {
                  setShowForm(true);
                  setTimeout(() => document.getElementById('scholar-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                } else {
                  const subject = encodeURIComponent("Scholar suggestion for Vidvat Mandal");
                  const body = encodeURIComponent(
                    "I would like to suggest the following scholar for the Vidvat Mandal:\n\n" +
                    "Name:\nField of expertise:\nAffiliation:\nContact (email/phone):\nBrief bio:\n\n" +
                    "Submitted by: " + (document.querySelector('[data-user-name]')?.textContent ?? '')
                  );
                  window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                }
              }}
            >
              <Users className="w-4 h-4" /> {t('Suggest Scholar', 'विद्वान सुझाएं')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
