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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { useT } from '@/lib/useT';

export const navItems = [
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
        'hidden md:flex h-screen sticky top-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 z-30',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
        <div className="w-9 h-9 rounded-lg saffron-gradient flex items-center justify-center shrink-0">
          <Flame className="w-5 h-5 text-primary-foreground" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="text-sm font-bold tracking-tight text-sidebar-accent-foreground font-devanagari">{t('Pragya Pravah', 'प्रज्ञा प्रवाह')}</h1>
              <p className="text-[10px] text-sidebar-foreground/60 font-devanagari">{t('Bhopal Vibhag', 'भोपाल विभाग')}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className={cn('w-4 h-4 shrink-0', active && 'drop-shadow-sm')} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <span className={cn('text-xs', lang === 'hi' && 'font-devanagari')}>{t(item.label, item.sublabel)}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-2 mb-4 p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-accent-foreground transition-colors self-end"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
