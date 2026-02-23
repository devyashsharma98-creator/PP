import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', sublabel: 'गतिविधि', icon: LayoutDashboard, path: '/' },
  { label: 'Parichay', sublabel: 'परिचय', icon: UserCircle, path: '/parichay' },
  { label: 'Aalekh & Shodh', sublabel: 'आलेख एवं शोध', icon: Newspaper, path: '/feed' },
  { label: 'E-Library', sublabel: 'ई-पुस्तकालय', icon: BookOpen, path: '/library' },
  { label: 'Aap ka Itihas', sublabel: 'आप का इतिहास', icon: History, path: '/history' },
  { label: 'Sampark', sublabel: 'सम्पर्क', icon: Users, path: '/directory' },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 z-30',
        collapsed ? 'w-[68px]' : 'w-[260px]'
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
              <h1 className="text-sm font-bold tracking-tight text-sidebar-accent-foreground">Pragya Pravah</h1>
              <p className="text-[10px] text-sidebar-foreground/60 font-devanagari">भोपाल विभाग</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5 shrink-0', active && 'drop-shadow-sm')} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <span>{item.label}</span>
                    <span className="block text-[10px] font-devanagari opacity-60">{item.sublabel}</span>
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
