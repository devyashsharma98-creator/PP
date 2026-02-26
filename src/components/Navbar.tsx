"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppContext, roleLabels, type Role } from '@/context/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Bell, Menu, Flame, Sun, Moon, CheckCircle2, Clock, PenLine, X, CalendarDays, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { navItems } from '@/components/AppSidebar';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/useT';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

const roleLabelsHi: Record<Role, string> = {
  unit_head: 'यूनिट प्रमुख',
  aayam_pramukh: 'आयाम प्रमुख',
  vibhag_pramukh: 'विभाग प्रमुख',
  karyakarta: 'कार्यकर्ता',
};

export function Navbar() {
  const { role, setRole, lang, setLang, events, articles } = useAppContext();
  const pathname = usePathname();
  const t = useT();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [bellBounce, setBellBounce] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const prevCountRef = useRef(0);
  const notifRef = useRef<HTMLDivElement>(null);

  // Hydration guard for theme
  useEffect(() => setMounted(true), []);

  // Build notifications list — O(n) single pass, memoized
  const notifications = useMemo(() => {
    const items: { id: string; type: 'event' | 'article'; title: string; status: string; date: string; link: string }[] = [];

    if (role === 'aayam_pramukh') {
      for (const e of events) {
        if (e.status === 'Pending Aayam Review') items.push({ id: e.id, type: 'event', title: e.title, status: e.status, date: e.date, link: '/dashboard' });
      }
      for (const a of articles) {
        if (a.status === 'Pending Aayam Review') items.push({ id: a.id, type: 'article', title: a.title, status: a.status, date: a.date, link: '/aalekh' });
      }
    } else if (role === 'vibhag_pramukh') {
      for (const e of events) {
        if (e.status === 'Pending Final Approval') items.push({ id: e.id, type: 'event', title: e.title, status: e.status, date: e.date, link: '/dashboard' });
      }
    } else if (role === 'unit_head') {
      for (const a of articles) {
        if (a.status === 'Pending Unit Head Review') items.push({ id: a.id, type: 'article', title: a.title, status: a.status, date: a.date, link: '/aalekh' });
      }
    }
    return items;
  }, [role, events, articles]);

  const totalPending = notifications.length;

  // Animate bell whenever count increases
  useEffect(() => {
    if (totalPending > prevCountRef.current) {
      setBellBounce(true);
      const timer = setTimeout(() => setBellBounce(false), 600);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = totalPending;
  }, [totalPending]);

  // Close notification dropdown on outside click — O(1) handler
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const toggleTheme = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme]);

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Trigger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <div className="flex items-center gap-3 px-6 h-16 border-b border-border">
              <div className="w-8 h-8 rounded-lg saffron-gradient flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-foreground font-devanagari">{t('Pragya Pravah', 'प्रज्ञा प्रवाह')}</h1>
                <p className="text-[10px] text-muted-foreground font-devanagari">{t('Bhopal Vibhag', 'भोपाल विभाग')}</p>
              </div>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const active = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className={cn('w-4 h-4 shrink-0', active && 'text-primary')} />
                    <span className={cn('block leading-none', lang === 'hi' && 'font-devanagari')}>
                      {t(item.label, item.sublabel)}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md saffron-gradient flex items-center justify-center md:hidden">
            <Flame className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-base font-bold text-foreground tracking-tight font-devanagari">{t('Pragya Pravah', 'प्रज्ञा प्रवाह')}</h2>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* ── Dark/Light Toggle ── */}
        {mounted && (
          <button
            onClick={toggleTheme}
            className="relative w-8 h-8 rounded-lg bg-muted/80 border border-border/60 flex items-center justify-center hover:border-primary/40 transition-colors"
            title={theme === 'dark' ? t('Light Mode', 'लाइट मोड') : t('Dark Mode', 'डार्क मोड')}
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === 'dark' ? (
                <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Sun className="w-4 h-4 text-amber-400" />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Moon className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        )}

        {/* ── Notification Bell + Dropdown ── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => totalPending > 0 && setNotifOpen(o => !o)}
            className={cn(
              'relative p-1.5 rounded-lg transition-colors hover:bg-muted',
              totalPending > 0 ? 'cursor-pointer' : 'cursor-default',
              bellBounce && 'animate-badge-bounce'
            )}
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {totalPending > 0 && (
              <>
                <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                </span>
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1 shadow-md shadow-primary/30">
                  {totalPending}
                </span>
              </>
            )}
          </button>

          {/* Dropdown Panel */}
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-popover shadow-xl z-50"
              >
                <div className="sticky top-0 bg-popover border-b border-border/60 px-4 py-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold font-devanagari">{t('Notifications', 'सूचनाएं')}</h3>
                  <Badge variant="outline" className="text-[10px]">{totalPending}</Badge>
                </div>
                <div className="p-2 space-y-1">
                  {notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => setNotifOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/60 transition-colors group"
                    >
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                        n.type === 'event' ? 'bg-primary/10' : 'bg-blue-500/10'
                      )}>
                        {n.type === 'event'
                          ? <CalendarDays className="w-3.5 h-3.5 text-primary" />
                          : <PenLine className="w-3.5 h-3.5 text-blue-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate group-hover:text-foreground">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {lang === 'hi'
                            ? (n.type === 'event' ? 'कार्यक्रम — समीक्षा प्रतीक्षित' : 'आलेख — समीक्षा प्रतीक्षित')
                            : (n.type === 'event' ? 'Event — Review pending' : 'Article — Review pending')
                          }
                        </p>
                      </div>
                      <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                    </Link>
                  ))}
                </div>
                <div className="border-t border-border/60 px-4 py-2.5">
                  <Link href="/dashboard" onClick={() => setNotifOpen(false)} className="text-xs text-primary hover:underline font-devanagari">
                    {t('View all in Dashboard →', 'डैशबोर्ड में सब देखें →')}
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Language Toggle */}
        <button
          onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
          className="relative flex items-center gap-0 bg-muted/80 border border-border/60 rounded-lg overflow-hidden h-8 text-xs font-bold transition-all hover:border-primary/40"
          title={lang === 'en' ? 'Switch to Hindi' : 'अंग्रेज़ी में बदलें'}
        >
          <span className={cn(
            'px-2 py-1 transition-all duration-200',
            lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          )}>EN</span>
          <span className={cn(
            'px-2 py-1 font-devanagari transition-all duration-200',
            lang === 'hi' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          )}>हि</span>
        </button>

        {/* Role Switcher */}
        <div className="flex items-center gap-1.5 bg-muted/80 border border-border/60 rounded-lg px-2 py-1 md:px-3 md:py-1.5">
          <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="border-0 bg-transparent shadow-none h-auto p-0 text-xs md:text-sm font-medium w-[100px] md:w-[170px] focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-lg z-50">
              {(Object.entries(roleLabels) as [Role, string][]).map(([key, label]) => (
                <SelectItem key={key} value={key} className={cn('text-sm', lang === 'hi' && 'font-devanagari')}>
                  {lang === 'hi' ? roleLabelsHi[key] : label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
