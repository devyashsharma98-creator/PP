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
import { useState } from 'react';

export function Navbar() {
  const { role, setRole, events } = useAppContext();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const pendingCount = role === 'aayam_pramukh'
    ? events.filter(e => e.status === 'Pending Aayam Review').length
    : role === 'vibhag_pramukh'
    ? events.filter(e => e.status === 'Pending Final Approval').length
    : 0;

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between px-4 md:px-6">
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

        <h2 className="text-lg font-semibold text-foreground hidden md:block">प्रज्ञा प्रवाह</h2>
        <h2 className="text-base font-semibold text-foreground md:hidden">Pragya Pravah (Mobile)</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        {pendingCount > 0 && (
          <div className="relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
              {pendingCount}
            </Badge>
          </div>
        )}

        {/* Role Switcher */}
        <div className="flex items-center gap-2 bg-muted rounded-lg px-2 py-1 md:px-3 md:py-1.5">
          <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="border-0 bg-transparent shadow-none h-auto p-0 text-xs md:text-sm font-medium w-[100px] md:w-[160px] focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-lg z-50">
              {(Object.entries(roleLabels) as [Role, string][]).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
