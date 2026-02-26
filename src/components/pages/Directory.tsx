"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search, Phone, MapPin, User, Mail, Users, Filter,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/useT';

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold font-devanagari">{t('Sampark Directory', 'सम्पर्क निर्देशिका')}</h1>
          </div>
          <p className="text-muted-foreground text-sm font-devanagari">
            {t('Contact details of Karyakartas across all Aayams', 'सभी आयामों के कार्यकर्ताओं की सम्पर्क सूची')}
          </p>
        </div>
        <Badge variant="outline" className="text-xs gap-1 self-start sm:self-auto">
          <User className="w-3 h-3" /> {filtered.length} {t('members', 'सदस्य')}
        </Badge>
      </div>

      {/* Search + Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('Search by name, unit...', 'नाम, इकाई से खोजें...')}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {aayams.map(a => {
            const cfg = a === 'All' ? null : aayamConfig[a];
            return (
              <button
                key={a}
                onClick={() => setAayamFilter(a)}
                className={`text-[11px] px-3 py-1 rounded-full border transition-all ${aayamFilter === a
                    ? cfg ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
              >
                {a === 'All' ? t('All', 'सभी') : a}
              </button>
            );
          })}
        </div>
      </div>

      {/* Member Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((m, i) => {
            const cfg = aayamConfig[m.aayam] || aayamConfig.Yuva;
            const isOpen = expanded === m.id;
            return (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={`glass-card hover-lift overflow-hidden cursor-pointer transition-all ${isOpen ? `border-l-2 ${cfg.border.replace('/25', '/60')}` : ''}`}
                  onClick={() => setExpanded(isOpen ? null : m.id)}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <AvatarInitials name={m.name} aayam={m.aayam} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm truncate">
                            {isHi ? m.nameHi : m.name}
                          </h3>
                          <Badge className={`${roleColors[m.role]} text-[9px] border-0 shrink-0`}>
                            {isHi ? m.roleHi : m.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className={`${cfg.bg} ${cfg.color} text-[9px] border-0`}>{m.aayam}</Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />{m.unit}
                          </span>
                        </div>
                      </div>
                      {isOpen
                        ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      }
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border/50 mt-3 pt-3 space-y-2">
                            <a href={`tel:${m.contact}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                              <Phone className="w-3.5 h-3.5" /> {m.contact}
                            </a>
                            <a href={`mailto:${m.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                              <Mail className="w-3.5 h-3.5" /> {m.email}
                            </a>
                            <div className="flex gap-2 pt-1">
                              <Button size="sm" variant="outline" className="text-xs h-7 gap-1" asChild>
                                <a href={`tel:${m.contact}`}><Phone className="w-3 h-3" /> {t('Call', 'कॉल')}</a>
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs h-7 gap-1" asChild>
                                <a href={`https://wa.me/91${m.contact.replace(/X/g, '0')}`} target="_blank" rel="noopener noreferrer">
                                  WhatsApp
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

      {filtered.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t('No members found', 'कोई सदस्य नहीं मिला')}</p>
        </div>
      )}
    </motion.div>
  );
}
