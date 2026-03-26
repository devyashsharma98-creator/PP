"use client";

// Force redeploy to sync with Vercel
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Newspaper,
  BookOpen,
  Users,
  ChevronLeft,
  ChevronRight,
  Flame,
  UserCircle,
  History,
  Network,
  MessagesSquare,
  Calendar,
  Megaphone,
  PenLine,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { useT } from '@/lib/useT';

export const navItems = [
  { label: 'Home', sublabel: 'मुख्य पृष्ठ', icon: Home, path: '/' },
  { label: 'Dashboard', sublabel: 'गतिविधियाँ', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Parichay', sublabel: 'परिचय', icon: UserCircle, path: '/parichay' },
  { label: 'Dayitv', sublabel: 'दायित्व', icon: Network, path: '/dayitv' },
  { label: 'Vimarsh', sublabel: 'विमर्श', icon: MessagesSquare, path: '/vimarsh' },
  { label: 'Aalekh & Shodh', sublabel: 'आलेख एवं शोध', icon: Newspaper, path: '/feed' },
  { label: 'Aalekh Likhna', sublabel: 'आलेख लिखें', icon: PenLine, path: '/aalekh' },
  { label: 'E-Library', sublabel: 'ई-पुस्तकालय', icon: BookOpen, path: '/library' },
  { label: 'Calendar', sublabel: 'वार्षिक पंचांग', icon: Calendar, path: '/calendar' },
  { label: 'Prachar', sublabel: 'प्रचार आयाम', icon: Megaphone, path: '/prachar' },
  { label: 'Sampark', sublabel: 'सम्पर्क', icon: Users, path: '/directory' },
  { label: 'Aaj ka Itihas', sublabel: 'आज का इतिहास', icon: History, path: '/history' },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { lang } = useAppContext();
  const t = useT();

  return (
    <aside
      className={cn(
        'institution-ledger-rail sticky top-0 z-30 hidden h-screen flex-col border-r border-sidebar-border text-sidebar-foreground transition-all duration-300 md:flex',
        collapsed ? 'w-[72px]' : 'w-[248px]'
      )}
    >
      <div className="border-b border-sidebar-border px-4 py-4 shrink-0">
        {!collapsed && <p className="shell-copy mb-3 text-sidebar-foreground/55">Bhopal Vibhag</p>}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl saffron-gradient shadow-lg shadow-primary/20">
            <Flame className="h-5 w-5 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, maxWidth: 0 }}
                animate={{ opacity: 1, maxWidth: 256 }}
                exit={{ opacity: 0, maxWidth: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="text-sm font-bold tracking-tight text-sidebar-accent-foreground font-devanagari">
                  {t('Pragya Pravah', 'प्रज्ञा प्रवाह')}
                </h1>
                <p className="text-[10px] uppercase tracking-[0.24em] text-sidebar-foreground/58">
                  Internal institutional console
                </p>
                <p className="text-[11px] leading-5 text-sidebar-foreground/72">
                  Civilisational discourse, organised action.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navItems.map((item) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-sidebar-primary/95 text-sidebar-primary-foreground shadow-[0_14px_32px_-24px_hsl(27_100%_50%/0.95)]'
                  : 'text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary shadow-[0_0_10px_hsl(27_100%_50%/0.7)]"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <item.icon className={cn('h-4 w-4 shrink-0', active && 'drop-shadow-sm')} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <span className={cn('text-xs', lang === 'hi' && 'font-devanagari')}>
                      {t(item.label, item.sublabel)}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        {!collapsed && (
          <div className="institution-panel-muted mb-3 space-y-2 px-3 py-3 text-xs text-sidebar-foreground/72">
            <p className="text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/55">
              Current lane
            </p>
            <p className="leading-5 text-sidebar-foreground/75">
              Review, publication, and unit coordination.
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="ml-auto flex rounded-full p-2 text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
