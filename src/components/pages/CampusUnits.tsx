"use client";

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Search, Building2, Users, MapPin, Filter, X, Plus,
  Mail, Phone, ChevronRight, ChevronDown, Award, PenLine,
  Eye, EyeOff, Save, Briefcase, GraduationCap, Globe,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useT } from '@/lib/useT';
import { cn } from '@/lib/utils';
import { Masthead } from '@/components/Masthead';

// ── Types ──────────────────────────────────────────────────────────────────

interface CampusUnit {
  id: string;
  slug: string;
  name: string;
  nameHi: string;
  unitType: string;
  city: string | null;
  state: string | null;
  coordinatorName: string | null;
  coordinatorNameHi: string | null;
  coordinatorEmail: string | null;
  coordinatorPhone: string | null;
  memberCount: number;
  status: string;
  focusAreas: string[];
  establishedYear: string | null;
  description: string;
  descriptionHi: string;
  isPublished: boolean;
  sortOrder: number;
}

const UNIT_TYPE_OPTIONS = ["University", "College", "Institute"];
const STATUS_OPTIONS = ["Active", "Forming", "Dormant"];
const FOCUS_AREA_OPTIONS = ["Study Circles", "Seminars", "Debates", "Publications", "Outreach"];

const unitTypeLabelsHi: Record<string, string> = {
  University: "विश्वविद्यालय", College: "महाविद्यालय", Institute: "संस्थान",
};

const statusLabelsHi: Record<string, string> = {
  Active: "सक्रिय", Forming: "गठनाधीन", Dormant: "निष्क्रिय",
};

const focusAreaLabelsHi: Record<string, string> = {
  "Study Circles": "अध्ययन मंडल", Seminars: "संगोष्ठी", Debates: "वाद-विवाद",
  Publications: "प्रकाशन", Outreach: "आउटरीच",
};

const statusColors: Record<string, string> = {
  Active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  Forming: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  Dormant: "bg-muted/50 text-muted-foreground border-border/60",
};

// ── Helper ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Form Component ─────────────────────────────────────────────────────────

interface CampusUnitFormProps {
  initial?: CampusUnit | null;
  onSave: (data: Partial<CampusUnit>) => Promise<void>;
  onCancel: () => void;
  t: (en: string, hi: string) => string;
  isHi: boolean;
}

function CampusUnitForm({ initial, onSave, onCancel, t, isHi }: CampusUnitFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [nameHi, setNameHi] = useState(initial?.nameHi ?? '');
  const [unitType, setUnitType] = useState(initial?.unitType ?? 'College');
  const [city, setCity] = useState(initial?.city ?? '');
  const [state, setState] = useState(initial?.state ?? '');
  const [coordinatorName, setCoordinatorName] = useState(initial?.coordinatorName ?? '');
  const [coordinatorNameHi, setCoordinatorNameHi] = useState(initial?.coordinatorNameHi ?? '');
  const [coordinatorEmail, setCoordinatorEmail] = useState(initial?.coordinatorEmail ?? '');
  const [coordinatorPhone, setCoordinatorPhone] = useState(initial?.coordinatorPhone ?? '');
  const [memberCount, setMemberCount] = useState(String(initial?.memberCount ?? ''));
  const [status, setStatus] = useState(initial?.status ?? 'Active');
  const [focusAreas, setFocusAreas] = useState<string[]>(initial?.focusAreas ?? []);
  const [establishedYear, setEstablishedYear] = useState(initial?.establishedYear ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [descriptionHi, setDescriptionHi] = useState(initial?.descriptionHi ?? '');
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function toggleFocusArea(val: string) {
    setFocusAreas(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
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
        unitType,
        city: city.trim() || null,
        state: state.trim() || null,
        coordinatorName: coordinatorName.trim() || null,
        coordinatorNameHi: coordinatorNameHi.trim() || null,
        coordinatorEmail: coordinatorEmail.trim() || null,
        coordinatorPhone: coordinatorPhone.trim() || null,
        memberCount: Number(memberCount) || 0,
        status,
        focusAreas,
        establishedYear: establishedYear.trim() || null,
        description,
        descriptionHi,
        isPublished,
        slug: initial?.slug ?? name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      });
    } catch {
      setError(t("Failed to save campus unit.", "परिसर इकाई सहेजने में विफल।"));
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
          <label className="shell-copy text-[10px]">{t('Institution Name (English)', 'संस्था का नाम (अंग्रेज़ी)')}</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Barkatullah University" className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Institution Name (Hindi)', 'संस्था का नाम (हिंदी)')}</label>
          <Input value={nameHi} onChange={e => setNameHi(e.target.value)} placeholder="बरकतउल्लाह विश्वविद्यालय" className="h-11 rounded-xl font-devanagari" />
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Unit Type', 'इकाई प्रकार')}</label>
          <div className="flex gap-2 flex-wrap">
            {UNIT_TYPE_OPTIONS.map(ut => (
              <button
                key={ut}
                type="button"
                onClick={() => setUnitType(ut)}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.15em] px-4 py-2.5 min-h-[44px] rounded-xl border transition-all",
                  unitType === ut
                    ? "bg-primary text-white border-primary shadow-md"
                    : "bg-background/60 border-border/60 text-muted-foreground hover:border-primary/40"
                )}
              >
                {isHi ? (unitTypeLabelsHi[ut] ?? ut) : ut}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Status', 'स्थिति')}</label>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setStatus(st)}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.15em] px-4 py-2.5 min-h-[44px] rounded-xl border transition-all",
                  status === st
                    ? st === 'Active' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : st === 'Forming' ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                      : 'bg-muted-foreground text-background border-muted-foreground shadow-md'
                    : 'bg-background/60 border-border/60 text-muted-foreground hover:border-primary/40'
                )}
              >
                {isHi ? (statusLabelsHi[st] ?? st) : st}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('City', 'शहर')}</label>
          <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Bhopal" className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('State', 'राज्य')}</label>
          <Input value={state} onChange={e => setState(e.target.value)} placeholder="Madhya Pradesh" className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Established Year', 'स्थापना वर्ष')}</label>
          <Input value={establishedYear} onChange={e => setEstablishedYear(e.target.value)} placeholder="1970" className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Member Count', 'सदस्य संख्या')}</label>
          <Input value={memberCount} onChange={e => setMemberCount(e.target.value)} type="number" min="0" placeholder="0" className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Coordinator Name (English)', 'समन्वयक नाम (अंग्रेज़ी)')}</label>
          <Input value={coordinatorName} onChange={e => setCoordinatorName(e.target.value)} placeholder="Dr. Arvind Tiwari" className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Coordinator Name (Hindi)', 'समन्वयक नाम (हिंदी)')}</label>
          <Input value={coordinatorNameHi} onChange={e => setCoordinatorNameHi(e.target.value)} placeholder="डॉ. अरविंद तिवारी" className="h-11 rounded-xl font-devanagari" />
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Coordinator Email', 'समन्वयक ईमेल')}</label>
          <Input value={coordinatorEmail} onChange={e => setCoordinatorEmail(e.target.value)} placeholder="coordinator@institute.ac.in" type="email" className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Coordinator Phone', 'समन्वयक फ़ोन')}</label>
          <Input value={coordinatorPhone} onChange={e => setCoordinatorPhone(e.target.value)} placeholder="+91-9876543210" className="h-11 rounded-xl" />
        </div>
      </div>

      <div className="space-y-3">
        <p className="shell-copy text-[10px]">{t('Focus Areas', 'प्रमुख गतिविधियाँ')}</p>
        <div className="flex flex-wrap gap-2">
          {FOCUS_AREA_OPTIONS.map(fa => (
            <button
              key={fa}
              type="button"
              onClick={() => toggleFocusArea(fa)}
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.15em] px-4 py-2 min-h-[44px] rounded-xl border transition-all",
                focusAreas.includes(fa)
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-background/60 border-border/60 text-muted-foreground hover:border-primary/40"
              )}
            >
              {isHi ? (focusAreaLabelsHi[fa] ?? fa) : fa}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Description (English)', 'विवरण (अंग्रेज़ी)')}</label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="shell-copy text-[10px]">{t('Description (Hindi)', 'विवरण (हिंदी)')}</label>
          <Textarea value={descriptionHi} onChange={e => setDescriptionHi(e.target.value)} rows={3} className="rounded-xl font-devanagari" />
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
          <Save className="w-4 h-4" /> {saving ? t('Saving…', 'सहेज रहे…') : t('Save Unit', 'इकाई सहेजें')}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className="h-12 px-6 rounded-xl text-xs font-bold uppercase tracking-widest">
          {t('Cancel', 'रद्द करें')}
        </Button>
      </div>
    </form>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function CampusUnits() {
  const { lang, permissions } = useAppContext();
  const t = useT();
  const isHi = lang === 'hi';

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedUnit, setSelectedUnit] = useState<CampusUnit | null>(null);
  const [units, setUnits] = useState<CampusUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<CampusUnit | null>(null);

  const canManage = permissions.canManageUsers || false;

  useEffect(() => {
    let active = true;
    fetch('/api/v1/campus-units')
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (active && json?.success && Array.isArray(json.data)) {
          setUnits(json.data as CampusUnit[]);
        }
      })
      .catch(() => { /* keep empty */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    return units.filter(u => {
      const matchType = typeFilter === 'All' || u.unitType === typeFilter;
      const matchStatus = statusFilter === 'All' || u.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch =
        u.name.toLowerCase().includes(q) ||
        u.nameHi.includes(q) ||
        (u.city ?? '').toLowerCase().includes(q) ||
        (u.state ?? '').toLowerCase().includes(q) ||
        (u.coordinatorName ?? '').toLowerCase().includes(q) ||
        u.focusAreas.some(f => f.toLowerCase().includes(q));
      return matchType && matchStatus && matchSearch;
    });
  }, [units, typeFilter, statusFilter, search]);

  const uniqueTypes = useMemo(() => {
    const set = new Set(units.map(u => u.unitType));
    return ['All', ...Array.from(set).sort()];
  }, [units]);

  const uniqueStatuses = useMemo(() => {
    const set = new Set(units.map(u => u.status));
    return ['All', ...Array.from(set).sort()];
  }, [units]);

  const totalMembers = useMemo(() => {
    return units.reduce((sum, u) => sum + u.memberCount, 0);
  }, [units]);

  const uniqueCities = useMemo(() => {
    return new Set(units.map(u => u.city).filter(Boolean)).size;
  }, [units]);

  async function handleCreate(data: Partial<CampusUnit>) {
    const res = await fetch('/api/v1/campus-units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed');
    setUnits(prev => [...prev, json.data]);
    setShowForm(false);
  }

  async function handleUpdate(data: Partial<CampusUnit>) {
    if (!editingUnit) return;
    const res = await fetch(`/api/v1/campus-units/${editingUnit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Failed');
    setUnits(prev => prev.map(u => u.id === json.data.id ? json.data : u));
    setEditingUnit(null);
    setSelectedUnit(null);
  }

  async function handleDelete(id: string) {
    if (!confirm(t("Delete this campus unit?", "इस परिसर इकाई को हटाएं?"))) return;
    const res = await fetch(`/api/v1/campus-units/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok || !json.success) return;
    setUnits(prev => prev.filter(u => u.id !== id));
    if (selectedUnit?.id === id) setSelectedUnit(null);
  }

  const contexts = [
    {
      icon: <Building2 className="w-5 h-5" />,
      labelEn: "Campus Network",
      labelHi: "परिसर नेटवर्क",
      valueEn: `${units.length} Campus Units`,
      valueHi: `${units.length} परिसर इकाइयाँ`,
      detailEn: "Universities, colleges and institutes in the network.",
      detailHi: "नेटवर्क में विश्वविद्यालय, महाविद्यालय एवं संस्थान।",
    },
    {
      icon: <Users className="w-5 h-5" />,
      labelEn: "Active Strength",
      labelHi: "सक्रिय शक्ति",
      valueEn: `${units.filter(u => u.status === 'Active').length} Active Units`,
      valueHi: `${units.filter(u => u.status === 'Active').length} सक्रिय इकाइयाँ`,
      detailEn: `${totalMembers} total student members across all units.`,
      detailHi: `सभी इकाइयों में कुल ${totalMembers} छात्र सदस्य।`,
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      labelEn: "Geographic Spread",
      labelHi: "भौगोलिक विस्तार",
      valueEn: `${uniqueCities} Cities`,
      valueHi: `${uniqueCities} शहर`,
      detailEn: "Presence across urban and semi-urban centres.",
      detailHi: "शहरी और अर्ध-शहरी केंद्रों में उपस्थिति।",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-10">
      <Masthead
        title="Campus Ikai"
        titleHi="परिसर इकाई"
        seal="Campus Presence"
        sealHi="परिसर उपस्थिति"
        subtitle="A registry of university and college units where the organisation has active, forming, or dormant campus presence."
        subtitleHi="विश्वविद्यालय और महाविद्यालय इकाइयों की निर्देशिका, जहाँ संगठन की सक्रिय, गठनाधीन या निष्क्रिय परिसर उपस्थिति है।"
        icon={<Building2 className="w-7 h-7 text-primary" />}
        contexts={contexts}
        actions={
          canManage && !showForm ? (
            <Button onClick={() => setShowForm(true)} className="gap-2 h-12 px-6 rounded-2xl font-bold uppercase tracking-[0.12em] text-[11px] shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> {t('Add Unit', 'इकाई जोड़ें')}
            </Button>
          ) : undefined
        }
      />

      {/* Create/Edit Form */}
      <AnimatePresence>
        {(showForm || editingUnit) && (
          <motion.div
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
                    {editingUnit
                      ? t('Edit Campus Unit', 'परिसर इकाई संपादित करें')
                      : t('Add New Campus Unit', 'नई परिसर इकाई जोड़ें')}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingUnit(null); }} className="h-10 w-10 rounded-xl p-0">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <CampusUnitForm
                  initial={editingUnit}
                  onSave={editingUnit ? handleUpdate : handleCreate}
                  onCancel={() => { setShowForm(false); setEditingUnit(null); }}
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
              placeholder={t('Search by name, city, coordinator…', 'नाम, शहर, समन्वयक से खोजें…')}
              className="pl-11 h-12 rounded-2xl bg-background/50 border-border/70 focus:border-primary/40 focus:ring-primary/10 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-[0.2em] py-1.5 px-4 bg-muted/40 border-border/60">
              <Filter className="w-3.5 h-3.5 mr-2 opacity-60" /> {t('Filter', 'फ़िल्टर')}
            </Badge>
          </div>
        </div>

        {/* Unit type filter chips */}
        <div className="space-y-2">
          <p className="shell-copy text-[10px]">{t('Unit Type', 'इकाई प्रकार')}</p>
          <div className="flex gap-2.5 flex-wrap overflow-x-auto pb-2 no-scrollbar">
            {uniqueTypes.map(ut => (
              <button
                key={ut}
                onClick={() => setTypeFilter(ut)}
                className={cn(
                  "text-[10px] md:text-[11px] font-bold uppercase tracking-[0.18em] px-5 py-2.5 min-h-[44px] rounded-xl border transition-all shrink-0",
                  typeFilter === ut
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                    : 'bg-background/60 border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {ut === 'All' ? t('All', 'सभी') : isHi ? (unitTypeLabelsHi[ut] ?? ut) : ut}
              </button>
            ))}
          </div>
        </div>

        {/* Status filter chips */}
        <div className="space-y-2">
          <p className="shell-copy text-[10px]">{t('Status', 'स्थिति')}</p>
          <div className="flex gap-2.5 flex-wrap overflow-x-auto pb-2 no-scrollbar">
            {uniqueStatuses.map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "text-[10px] md:text-[11px] font-bold uppercase tracking-[0.18em] px-5 py-2.5 min-h-[44px] rounded-xl border transition-all shrink-0",
                  statusFilter === st
                    ? st === 'Active' ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20 scale-105'
                      : st === 'Forming' ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-500/20 scale-105'
                      : st === 'All' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                      : 'bg-muted-foreground text-background border-muted-foreground shadow-lg scale-105'
                    : 'bg-background/60 border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {st === 'All' ? t('All', 'सभी') : isHi ? (statusLabelsHi[st] ?? st) : st}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Campus Unit Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="section-seal">{t('Campus Registry', 'परिसर पंजिका')}</span>
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
              <Building2 className="w-10 h-10 text-muted-foreground/20" />
            </div>
            <p className="text-lg font-bold text-muted-foreground/60 font-devanagari">
              {t('No campus units found.', 'कोई परिसर इकाई नहीं मिली।')}
            </p>
            <Button variant="link" onClick={() => { setTypeFilter('All'); setStatusFilter('All'); setSearch(''); }} className="mt-2 text-primary font-bold uppercase tracking-widest text-[10px]">
              {t('Clear all filters', 'फिल्टर हटाएँ')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filtered.map((unit, i) => (
                <motion.div
                  key={unit.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <Card
                    className={cn(
                      "institution-panel overflow-hidden cursor-pointer transition-all duration-500 bg-background/30 group",
                      selectedUnit?.id === unit.id
                        ? "ring-2 ring-primary/60 shadow-xl bg-background/60"
                        : "border-border/60 hover:border-primary/30"
                    )}
                    onClick={() => setSelectedUnit(selectedUnit?.id === unit.id ? null : unit)}
                  >
                    <CardContent className="py-6 px-6">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border-2 transition-all duration-500 group-hover:scale-105",
                          "bg-primary/10 border-primary/20 text-primary font-bold text-lg"
                        )}>
                          {getInitials(unit.name)}
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0">
                              <h3 className="font-bold text-base leading-tight font-devanagari text-foreground/90 group-hover:text-primary transition-colors truncate">
                                {isHi ? unit.nameHi : unit.name}
                              </h3>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className="text-[9px] bg-primary/5 text-primary/70 border-primary/10 font-bold uppercase tracking-widest px-2 py-0">
                                  {isHi ? (unitTypeLabelsHi[unit.unitType] ?? unit.unitType) : unit.unitType}
                                </Badge>
                                <Badge className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0", statusColors[unit.status] ?? '')}>
                                  {isHi ? (statusLabelsHi[unit.status] ?? unit.status) : unit.status}
                                </Badge>
                              </div>
                            </div>
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0",
                              selectedUnit?.id === unit.id
                                ? "bg-primary text-white scale-110"
                                : "bg-muted/60 text-muted-foreground"
                            )}>
                              {selectedUnit?.id === unit.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                            {unit.city && (
                              <span className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-lg border border-border/50">
                                <MapPin className="w-3 h-3 opacity-60" />{unit.city}{unit.state ? `, ${unit.state}` : ''}
                              </span>
                            )}
                            {unit.memberCount > 0 && (
                              <span className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-lg border border-border/50">
                                <Users className="w-3 h-3 opacity-60" />{unit.memberCount}
                              </span>
                            )}
                          </div>

                          {unit.coordinatorName && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Briefcase className="w-3 h-3 opacity-60" />
                              {isHi && unit.coordinatorNameHi ? unit.coordinatorNameHi : unit.coordinatorName}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1.5">
                            {unit.focusAreas.slice(0, 3).map(fa => (
                              <Badge key={fa} className="text-[8px] bg-primary/5 text-primary/70 border-primary/10 font-bold uppercase tracking-widest px-2 py-0">
                                {isHi ? (focusAreaLabelsHi[fa] ?? fa) : fa}
                              </Badge>
                            ))}
                            {unit.focusAreas.length > 3 && (
                              <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest px-2 py-0 border-border/60">
                                +{unit.focusAreas.length - 3}
                              </Badge>
                            )}
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

      {/* Selected Unit Detail Panel */}
      <AnimatePresence>
        {selectedUnit && !editingUnit && (
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
                      "w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-lg border-2",
                      "bg-primary/10 border-primary/20 text-primary text-3xl font-bold"
                    )}>
                      {getInitials(selectedUnit.name)}
                    </div>
                    <Badge className={cn("text-[10px] font-bold uppercase tracking-widest px-3 py-1", statusColors[selectedUnit.status] ?? '')}>
                      {isHi ? (statusLabelsHi[selectedUnit.status] ?? selectedUnit.status) : selectedUnit.status}
                    </Badge>
                  </div>

                  <div className="flex-1 space-y-6 min-w-0">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1">
                          {isHi ? 'परिसर इकाई प्रोफ़ाइल' : 'Campus Unit Profile'}
                        </Badge>
                        {!selectedUnit.isPublished && (
                          <Badge variant="outline" className="text-[10px] border-amber-400/40 text-amber-600 bg-amber-500/5 font-bold uppercase tracking-widest">
                            {t('Draft', 'ड्राफ़्ट')}
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold font-devanagari tracking-tight text-foreground/90">
                        {isHi ? selectedUnit.nameHi : selectedUnit.name}
                      </h2>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className="bg-primary/5 text-primary/70 border-primary/10 text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                          {isHi ? (unitTypeLabelsHi[selectedUnit.unitType] ?? selectedUnit.unitType) : selectedUnit.unitType}
                        </Badge>
                        {selectedUnit.establishedYear && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Award className="w-4 h-4 opacity-60" />
                            {t('Est.', 'स्था.')} {selectedUnit.establishedYear}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Location & Members */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(selectedUnit.city || selectedUnit.state) && (
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-background/80 border border-border/60">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-foreground/80">
                            {selectedUnit.city}{selectedUnit.city && selectedUnit.state ? ', ' : ''}{selectedUnit.state}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-background/80 border border-border/60">
                        <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-bold text-foreground/80">
                          {selectedUnit.memberCount} {t('Members', 'सदस्य')}
                        </span>
                      </div>
                      {selectedUnit.coordinatorEmail && (
                        <a href={`mailto:${selectedUnit.coordinatorEmail}`} className="flex items-center gap-3 p-3 rounded-2xl bg-background/80 border border-border/60 hover:border-primary/30 transition-all group/link shadow-sm">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/5 flex items-center justify-center border border-blue-500/10">
                            <Mail className="w-4 h-4 text-blue-500" />
                          </div>
                          <span className="text-sm font-bold text-foreground/80 truncate tracking-tight">{selectedUnit.coordinatorEmail}</span>
                        </a>
                      )}
                      {selectedUnit.coordinatorPhone && (
                        <a href={`tel:${selectedUnit.coordinatorPhone}`} className="flex items-center gap-3 p-3 rounded-2xl bg-background/80 border border-border/60 hover:border-primary/30 transition-all group/link shadow-sm">
                          <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                            <Phone className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-sm font-mono font-bold text-foreground/80 tracking-tight">{selectedUnit.coordinatorPhone}</span>
                        </a>
                      )}
                    </div>

                    {/* Coordinator */}
                    {selectedUnit.coordinatorName && (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                          <Briefcase className="w-4 h-4 text-amber-500" />
                        </div>
                        <span className="text-sm font-bold text-foreground/80">
                          {t('Coordinator', 'समन्वयक')}: {isHi && selectedUnit.coordinatorNameHi ? selectedUnit.coordinatorNameHi : selectedUnit.coordinatorName}
                        </span>
                      </div>
                    )}

                    {/* Focus Areas */}
                    {selectedUnit.focusAreas.length > 0 && (
                      <div className="space-y-2 py-4 border-y border-border/50">
                        <p className="shell-copy text-[10px]">{t('Focus Areas', 'प्रमुख गतिविधियाँ')}</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedUnit.focusAreas.map(fa => (
                            <Badge key={fa} className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1.5">
                              {isHi ? (focusAreaLabelsHi[fa] ?? fa) : fa}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {(selectedUnit.description || selectedUnit.descriptionHi) && (
                      <div className="relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                        <p className={`text-sm md:text-base text-foreground/80 leading-relaxed pl-4 ${isHi ? 'font-devanagari' : ''}`}>
                          {isHi ? (selectedUnit.descriptionHi || selectedUnit.description) : (selectedUnit.description || selectedUnit.descriptionHi)}
                        </p>
                      </div>
                    )}

                    {/* Admin actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Button variant="ghost" onClick={() => setSelectedUnit(null)} className="text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-widest px-5 h-11 rounded-xl">
                        {t('Close', 'बंद करें')}
                      </Button>
                      {canManage && (
                        <>
                          <Button variant="outline" onClick={() => { setEditingUnit(selectedUnit); }} className="gap-2 h-11 px-6 rounded-xl border-border/70 text-xs font-bold uppercase tracking-widest">
                            <PenLine className="w-4 h-4" /> {t('Edit', 'संपादित करें')}
                          </Button>
                          <Button variant="outline" onClick={() => handleDelete(selectedUnit.id)} className="gap-2 h-11 px-6 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 text-xs font-bold uppercase tracking-widest">
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
                {t('Grow the Campus Network', 'परिसर नेटवर्क का विस्तार करें')}
              </p>
              <p className="text-sm text-muted-foreground font-devanagari leading-relaxed max-w-2xl">
                {t('Know a university or college where a new unit should be established? Suggest it to expand our institutional reach among students and faculty.', 'एक नए विश्वविद्यालय या महाविद्यालय के बारे में जानते हैं जहाँ एक नई इकाई स्थापित की जानी चाहिए? छात्रों और संकाय के बीच हमारी संस्थागत पहुँच बढ़ाने के लिए सुझाव दें।')}
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowForm(true)} className="shrink-0 h-12 px-10 rounded-2xl border-primary/30 text-primary hover:bg-primary/5 font-bold uppercase tracking-[0.16em] text-[11px] gap-3 shadow-sm hover:shadow-lg transition-all">
              <Building2 className="w-4 h-4" /> {t('Suggest Unit', 'इकाई सुझाएं')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
