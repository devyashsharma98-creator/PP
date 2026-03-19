"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext, type Role } from '@/context/AppContext';
import { roleLabels, roleLabelsHi } from '@/lib/app/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Bell, Menu, Flame, Sun, Moon, CheckCircle2, Clock, PenLine, X, CalendarDays, ArrowRight, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { navItems } from '@/components/AppSidebar';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/useT';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

function getShellFrame(pathname: string, role: Role) {
  if (pathname === '/dashboard') {
    if (role === 'vibhag_pramukh') {
      return {
        titleEn: 'Institutional Console',
        titleHi: 'संस्थागत प्रणाली',
        subtitleEn: 'Final approvals, publication, and unit coordination in one operational view.',
        subtitleHi: 'एक ही परिचालन दृश्य में अंतिम अनुमोदन, प्रकाशन और इकाई समन्वय।',
      };
    }

    if (role === 'aayam_pramukh') {
      return {
        titleEn: 'Aayam Review Desk',
        titleHi: 'आयाम समीक्षा डेस्क',
        subtitleEn: 'Review incoming programmes, forward ready work, and keep the organisational lane clear.',
        subtitleHi: 'आगत कार्यक्रमों की समीक्षा करें, तैयार कार्य आगे भेजें और संगठनात्मक धारा स्पष्ट रखें।',
      };
    }

    return {
      titleEn: 'Gatividhi Desk',
      titleHi: 'गतिविधि डेस्क',
      subtitleEn: 'Programme planning, review movement, and follow-through for your unit in one place.',
      subtitleHi: 'आपकी इकाई के लिए योजना, समीक्षा प्रवाह और अनुवर्ती कार्य एक ही स्थान पर।',
    };
  }

  const routeFrames = [
    {
      match: '/prachar',
      titleEn: 'Prachar Desk',
      titleHi: 'प्रचार डेस्क',
      subtitleEn: 'Publication follow-through, circulation records, and outreach rhythm.',
      subtitleHi: 'प्रकाशन के बाद का प्रचार कार्य, प्रसार अभिलेख और संवाद लय।',
    },
    {
      match: '/aalekh',
      titleEn: 'Aalekh Desk',
      titleHi: 'आलेख डेस्क',
      subtitleEn: 'Drafts, review notes, and publication readiness for institutional writing.',
      subtitleHi: 'संस्थागत लेखन के लिए प्रारूप, समीक्षा टिप्पणियाँ और प्रकाशन तैयारी।',
    },
    {
      match: '/feed',
      titleEn: 'Published Work',
      titleHi: 'प्रकाशित कार्य',
      subtitleEn: 'The current record of approved and circulated institutional writing.',
      subtitleHi: 'अनुमोदित और प्रसारित संस्थागत लेखन का वर्तमान अभिलेख।',
    },
    {
      match: '/dayitv',
      titleEn: 'Dayitva Matrix',
      titleHi: 'दायित्व संरचना',
      subtitleEn: 'Organisational roles, reporting lines, and accountability structure.',
      subtitleHi: 'संगठनात्मक भूमिकाएँ, संपर्क धाराएँ और उत्तरदायित्व की संरचना।',
    },
    {
      match: '/calendar',
      titleEn: 'Annual Panchang',
      titleHi: 'वार्षिक पंचांग',
      subtitleEn: 'Programme rhythm, dates, and shared institutional calendar visibility.',
      subtitleHi: 'कार्यक्रम लय, तिथियाँ और साझा संस्थागत पंचांग दृश्यता।',
    },
    {
      match: '/directory',
      titleEn: 'Sampark Directory',
      titleHi: 'सम्पर्क निर्देशिका',
      subtitleEn: 'Institutional contacts, roles, and points of coordination.',
      subtitleHi: 'संस्थागत सम्पर्क, दायित्व और समन्वय बिंदु।',
    },
    {
      match: '/library',
      titleEn: 'E-Library',
      titleHi: 'ई-पुस्तकालय',
      subtitleEn: 'Reference texts, study material, and archived intellectual resources.',
      subtitleHi: 'सन्दर्भ ग्रंथ, अध्ययन सामग्री और संग्रहित बौद्धिक संसाधन।',
    },
  ];

  const matched = routeFrames.find((frame) => pathname.startsWith(frame.match));
  if (matched) return matched;

  return {
    titleEn: 'Pragya Pravah',
    titleHi: 'प्रज्ञा प्रवाह',
    subtitleEn: 'Civilisational discourse, organised action.',
    subtitleHi: 'सभ्यतागत विमर्श, संगठित कार्य।',
  };
}

export function Navbar() {
  const { role, setRole, lang, setLang, events, articles, isAuthenticated } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [bellBounce, setBellBounce] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const prevCountRef = useRef(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const demoRoleSwitchEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_ROLE_SWITCH === 'true';
  const shellFrame = useMemo(() => getShellFrame(pathname, role), [pathname, role]);

  // Hydration guard for theme
  useEffect(() => setMounted(true), []);

  // Build notifications list — O(n) single pass, memoized
  const notifications = useMemo(() => {
    const items: { id: string; type: 'event' | 'article'; title: string; status: string; date: string; link: string }[] = [];

    if (role === 'aayam_pramukh') {
      for (const e of events) {
        if (e.status === 'Pending Aayam Review' || e.status === 'Submitted by Unit') {
          items.push({ id: e.id, type: 'event', title: e.title, status: e.status, date: e.date, link: '/dashboard' });
        }
      }
      for (const a of articles) {
        if (a.status === 'Pending Aayam Review') items.push({ id: a.id, type: 'article', title: a.title, status: a.status, date: a.date, link: '/aalekh' });
      }
    } else if (role === 'vibhag_pramukh') {
      for (const e of events) {
        if (e.status === 'Pending Vibhag Review' || e.status === 'Pending Prant Authorization') {
          items.push({ id: e.id, type: 'event', title: e.title, status: e.status, date: e.date, link: '/dashboard' });
        }
      }
      for (const a of articles) {
        if (a.status === 'Pending Vibhag Review' || a.status === 'Pending Prant Authorization') {
          items.push({ id: a.id, type: 'article', title: a.title, status: a.status, date: a.date, link: '/aalekh' });
        }
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

  const handleLogout = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch {
      // Best-effort — redirect anyway
      router.push('/login');
      router.refresh();
    }
  }, [router]);

  return (
    <header className="sticky top-0 z-20 px-4 pt-4 md:px-6">
      <div className="institution-panel-muted flex min-h-[78px] items-center justify-between gap-4 px-4 py-3 md:px-5">
        <div className="flex items-center gap-3">
        {/* Mobile Menu Trigger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="institution-ledger-rail w-[300px] border-r border-sidebar-border p-0 text-sidebar-foreground">
            <div className="border-b border-sidebar-border px-6 py-4">
              <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-sidebar-foreground/55">
                {t('Bhopal Vibhag', 'भोपाल विभाग')}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg saffron-gradient flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-sidebar-foreground/60">
                    {t('Internal institutional console', 'आंतरिक संस्थागत प्रणाली')}
                  </p>
                  <h1 className={cn('text-sm font-bold tracking-tight text-foreground', lang === 'hi' && 'font-devanagari')}>
                    {t(shellFrame.titleEn, shellFrame.titleHi)}
                  </h1>
                  <p className={cn('text-[11px] leading-5 text-sidebar-foreground/72', lang === 'hi' && 'font-devanagari')}>
                    {t(shellFrame.subtitleEn, shellFrame.subtitleHi)}
                  </p>
                </div>
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

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md saffron-gradient flex items-center justify-center md:hidden shrink-0">
            <Flame className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <p className="shell-copy text-foreground/55 truncate text-[9px] md:text-[10px]">{t('Bhopal Vibhag', 'भोपाल विभाग')}</p>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="shell-panel-copy hidden lg:block shrink-0">{t('Internal institutional console', 'आंतरिक संस्थागत प्रणाली')}</span>
              <span className="text-muted-foreground/60 hidden lg:block shrink-0">•</span>
              <h2 className={cn('text-sm md:text-base font-bold tracking-tight truncate', lang === 'hi' && 'font-devanagari')}>
                {t(shellFrame.titleEn, shellFrame.titleHi)}
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
        {/* ── Dark/Light Toggle ── */}
        {mounted && (
          <button
            onClick={toggleTheme}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/80 transition-colors hover:border-primary/40"
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
              'relative rounded-full p-2 transition-colors hover:bg-muted',
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
          className="relative flex h-9 items-center gap-0 overflow-hidden rounded-full border border-border/70 bg-background/80 text-xs font-bold transition-all hover:border-primary/40"
          title={lang === 'en' ? 'Switch to Hindi' : 'अंग्रेज़ी में बदलें'}
        >
          <span className={cn(
            'px-3 py-1 transition-all duration-200',
            lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          )}>EN</span>
          <span className={cn(
            'px-3 py-1 font-devanagari transition-all duration-200',
            lang === 'hi' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          )}>हि</span>
        </button>

        {/* Temporary demo role switcher until auth/profile role binding is implemented */}
        <div className="shell-role-chip">
          <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              {t('Dayitva', 'दायित्व')}
            </p>
            {demoRoleSwitchEnabled ? (
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="h-auto w-[112px] border-0 bg-transparent p-0 text-left text-xs font-medium shadow-none focus:ring-0 md:w-[182px] md:text-sm">
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
            ) : (
              <span className={cn("text-xs md:text-sm font-medium", lang === 'hi' && 'font-devanagari')}>
                {lang === 'hi' ? roleLabelsHi[role] : roleLabels[role]}
              </span>
            )}
          </div>
        </div>

        {/* Logout */}
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title={t('Sign Out', 'लॉग आउट')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
      </div>
    </header>
  );
}
