"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Bell } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/useT';

const aayamLight: Record<string, string> = {
  Yuva: 'bg-[hsl(var(--info)/.2)] text-info',
  Mahila: 'bg-accent text-accent-foreground',
  Shodh: 'bg-[hsl(var(--success)/.2)] text-success',
  Prachar: 'bg-primary/15 text-primary',
  Vimarsh: 'bg-[hsl(var(--warning)/.2)] text-warning',
  Vibhag: 'bg-secondary text-secondary-foreground',
};

interface CalEvent {
  id: string;
  title: string;
  date: string;
  aayam: string;
  recurring?: boolean;
  note?: string;
}

const extraEvents: CalEvent[] = [
  { id: 'c1', title: 'Youth & Dharma', date: '2026-02-28', aayam: 'Yuva', recurring: true, note: 'Annual — held Feb 2025 too' },
  { id: 'c2', title: 'Book Discussion', date: '2026-02-25', aayam: 'Shodh' },
  { id: 'c3', title: 'Mahila Sangam', date: '2026-03-08', aayam: 'Mahila', note: "Women's Day special" },
  { id: 'c4', title: 'Counter Narrative Workshop', date: '2026-03-15', aayam: 'Vimarsh' },
  { id: 'c5', title: 'Prachar Review Meet', date: '2026-03-01', aayam: 'Prachar' },
  { id: 'c6', title: 'Prant Adhiveshan', date: '2026-03-22', aayam: 'Vibhag', recurring: true },
  { id: 'c7', title: 'Vedic Math Workshop', date: '2026-02-27', aayam: 'Shodh' },
  { id: 'c8', title: 'Social Media Drive', date: '2026-03-10', aayam: 'Prachar' },
  { id: 'c9', title: 'Vichardhara Sangosthi', date: '2026-03-18', aayam: 'Vimarsh', recurring: true },
  { id: 'c10', title: 'IKS Lecture Series', date: '2026-02-23', aayam: 'Shodh' },
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDay(y: number, m: number) { return new Date(y, m, 1).getDay(); }

export default function AnnualCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const { events } = useAppContext();
  const t = useT();

  const allEvents: CalEvent[] = [
    ...extraEvents,
    ...events
      .filter(e => e.status === 'Published' || e.status === 'Pending Final Approval')
      .map(e => ({ id: `ev-${e.id}`, title: e.title, date: e.date, aayam: 'Vibhag' })),
  ];

  const forDay = (d: number) => {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return allEvents.filter(e => e.date === ds);
  };

  const upcoming = allEvents
    .filter(e => new Date(e.date) >= new Date(today.toDateString()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  const reminders = allEvents.filter(e => e.recurring || e.note);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const days = daysInMonth(year, month);
  const offset = firstDay(year, month);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold">{t("Annual Calendar", "वार्षिक पंचांग")}</h1>
        <p className="text-muted-foreground text-sm">{t("Annual event calendar across all aayams", "सभी आयामों का वार्षिक कार्यक्रम पंचांग")}</p>
      </div>

      {/* Reminders */}
      {reminders.length > 0 && (
        <Card className="glass-card border-warning/30 bg-[hsl(var(--warning)/.05)]">
          <CardContent className="pt-4 pb-4 flex items-start gap-3">
            <Bell className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-2">Recurring Events — Reminders</p>
              <div className="flex flex-wrap gap-2">
                {reminders.map(e => (
                  <Badge key={e.id} className="bg-[hsl(var(--warning)/.15)] text-warning text-[10px]">
                    🔔 {e.title} · {e.date}
                    {e.note && ` (${e.note})`}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{MONTHS[month]} {year}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={prev}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={next}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              {/* Horizontal scroll wrapper for mobile */}
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <div className="min-w-[300px]">
                  {/* Day names */}
                  <div className="grid grid-cols-7 mb-1">
                    {DAYS.map(d => (
                      <div key={d} className="text-center text-[9px] sm:text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
                    ))}
                  </div>
                  {/* Date cells */}
                  <div className="grid grid-cols-7 gap-px">
                    {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} className="min-h-[38px] sm:min-h-[54px]" />)}
                    {Array.from({ length: days }).map((_, i) => {
                      const d = i + 1;
                      const dayEvts = forDay(d);
                      const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
                      return (
                        <div
                          key={d}
                          className={cn(
                            'min-h-[38px] sm:min-h-[54px] p-0.5 sm:p-1 rounded-sm border border-transparent hover:border-border/50 transition-colors',
                            isToday && 'bg-primary/5 border-primary/30'
                          )}
                        >
                          <p className={cn('text-[10px] sm:text-[11px] font-medium text-center mb-0.5', isToday && 'text-primary font-bold')}>{d}</p>
                          <div className="space-y-0.5">
                            {dayEvts.slice(0, 1).map(e => (
                              <div
                                key={e.id}
                                className={cn('text-[7px] sm:text-[9px] px-0.5 sm:px-1 py-0.5 rounded truncate leading-tight', aayamLight[e.aayam] || 'bg-muted text-muted-foreground')}
                              >
                                {e.title}
                              </div>
                            ))}
                            {dayEvts.length > 1 && (
                              <div className="text-[7px] sm:text-[9px] text-muted-foreground text-center">+{dayEvts.length - 1}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 pt-3 border-t border-border/40">
                {Object.entries(aayamLight).map(([aayam, cls]) => (
                  <div key={aayam} className="flex items-center gap-1">
                    <div className={cn('w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm', cls.split(' ')[0])} />
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground">{aayam}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming sidebar */}
        <div>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {upcoming.map(e => (
                <div key={e.id} className="flex items-start gap-2.5 py-2 border-b border-border/30 last:border-0">
                  <div className="text-center min-w-[30px] pt-0.5">
                    <p className="text-xs font-bold text-primary leading-none">{new Date(e.date).getDate()}</p>
                    <p className="text-[9px] text-muted-foreground">{MONTHS[new Date(e.date).getMonth()].slice(0, 3)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{e.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Badge className={cn('text-[9px]', aayamLight[e.aayam] || '')}>{e.aayam}</Badge>
                      {e.recurring && <span className="text-[9px] text-warning">🔔</span>}
                    </div>
                  </div>
                </div>
              ))}
              {upcoming.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">No upcoming events</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
