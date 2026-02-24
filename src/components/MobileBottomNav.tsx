"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessagesSquare, Calendar, Megaphone, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/useT';

const primaryNav = [
  { label: 'Home', sublabel: 'डैशबोर्ड', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Vimarsh', sublabel: 'विमर्श', icon: MessagesSquare, path: '/vimarsh' },
  { label: 'Calendar', sublabel: 'पंचांग', icon: Calendar, path: '/calendar' },
  { label: 'Prachar', sublabel: 'प्रचार', icon: Megaphone, path: '/prachar' },
  { label: 'Sampark', sublabel: 'सम्पर्क', icon: Users, path: '/directory' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-sidebar border-t border-sidebar-border safe-area-bottom">
      <div className="flex items-stretch h-16">
        {primaryNav.map((item) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 text-center transition-colors duration-150 active:scale-95',
                active
                  ? 'text-primary bg-sidebar-primary/10'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground/90'
              )}
            >
              <item.icon className={cn('w-5 h-5', active && 'text-primary drop-shadow-sm')} />
              <span className={cn('text-[10px] font-devanagari leading-none', active ? 'text-primary font-semibold' : '')}>
                {t(item.label, item.sublabel)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
