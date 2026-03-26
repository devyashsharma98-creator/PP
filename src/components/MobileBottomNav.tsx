"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessagesSquare, Calendar, Megaphone, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/useT';

const primaryNav = [
  { label: 'Home', sublabel: 'मुख्य पृष्ठ', icon: Home, path: '/' },
  { label: 'Vimarsh', sublabel: 'विमर्श', icon: MessagesSquare, path: '/vimarsh' },
  { label: 'Calendar', sublabel: 'पंचांग', icon: Calendar, path: '/calendar' },
  { label: 'Prachar', sublabel: 'प्रचार', icon: Megaphone, path: '/prachar' },
  { label: 'Sampark', sublabel: 'सम्पर्क', icon: Users, path: '/directory' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav aria-label="Mobile navigation" className="institution-ledger-rail safe-area-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-sidebar-border md:hidden">
      <div className="flex items-center justify-between px-4 pt-2 text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/55">
        <span>Bhopal Vibhag</span>
        <span>Pragya Pravah</span>
      </div>
      <div className="grid h-[74px] grid-cols-5 gap-1 px-2 py-2">
        {primaryNav.map((item) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-2xl text-center transition-all duration-150 active:scale-95',
                active
                  ? 'bg-primary/14 text-primary shadow-[0_12px_24px_-20px_hsl(27_100%_50%/0.8)]'
                  : 'text-sidebar-foreground/68 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', active && 'text-primary')} />
              <span className={cn('text-[10px] leading-none font-devanagari', active && 'font-semibold text-primary')}>
                {t(item.label, item.sublabel)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
