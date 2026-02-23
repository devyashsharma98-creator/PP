"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppContext, roleLabels, type Role } from '@/context/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Bell, Menu, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { navItems } from '@/components/AppSidebar';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

export function Navbar() {
  const { role, setRole, events, articles } = useAppContext();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [bellBounce, setBellBounce] = useState(false);
  const prevCountRef = useRef(0);

  const pendingEvents = role === 'aayam_pramukh'
    ? events.filter(e => e.status === 'Pending Aayam Review').length
    : role === 'vibhag_pramukh'
    ? events.filter(e => e.status === 'Pending Final Approval').length
    : 0;

  const pendingArticles = role === 'unit_head'
    ? articles.filter(a => a.status === 'Pending Unit Head Review').length
    : role === 'aayam_pramukh'
    ? articles.filter(a => a.status === 'Pending Aayam Review').length
    : 0;

  const totalPending = pendingEvents + pendingArticles;

  // Animate bell whenever count increases
  useEffect(() => {
    if (totalPending > prevCountRef.current) {
      setBellBounce(true);
      const t = setTimeout(() => setBellBounce(false), 600);
      return () => clearTimeout(t);
    }
    prevCountRef.current = totalPending;
  }, [totalPending]);

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
                <h1 className="text-sm font-bold tracking-tight text-foreground">Pragya Pravah</h1>
                <p className="text-[10px] text-muted-foreground font-devanagari">भोपाल विभाग</p>
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
                    <div>
                      <span className="block leading-none">{item.label}</span>
                      <span className="block text-[10px] font-devanagari opacity-70 mt-0.5">{item.sublabel}</span>
                    </div>
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
          <h2 className="text-base font-bold text-foreground tracking-tight hidden md:block">प्रज्ञा प्रवाह</h2>
          <h2 className="text-sm font-bold text-foreground md:hidden">Pragya Pravah</h2>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Animated Notification Bell */}
        {totalPending > 0 && (
          <div className="relative">
            <div
              className={cn(
                'relative p-1.5 rounded-lg transition-colors hover:bg-muted cursor-default',
                bellBounce && 'animate-badge-bounce'
              )}
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              {/* Ping ring */}
              <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
              </span>
            </div>
            {/* Count badge */}
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1 shadow-md shadow-primary/30">
              {totalPending}
            </span>
          </div>
        )}

        {/* Role Switcher */}
        <div className="flex items-center gap-1.5 bg-muted/80 border border-border/60 rounded-lg px-2 py-1 md:px-3 md:py-1.5">
          <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="border-0 bg-transparent shadow-none h-auto p-0 text-xs md:text-sm font-medium w-[100px] md:w-[170px] focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-lg z-50">
              {(Object.entries(roleLabels) as [Role, string][]).map(([key, label]) => (
                <SelectItem key={key} value={key} className="text-sm">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
