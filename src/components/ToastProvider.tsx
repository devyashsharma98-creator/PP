"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ToastItem {
  id: string;
  message: string;
  subtitle?: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType, subtitle?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ addToast: () => {} });
export const useToast = () => useContext(ToastContext);

const ICONS = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

const STYLES = {
  success: {
    wrap: 'border-green-500/50 bg-green-50 dark:bg-green-500/10 dark:border-green-500/40',
    icon: 'text-green-600 dark:text-green-400',
    text: 'text-green-900 dark:text-green-200',
    sub:  'text-green-700 dark:text-green-400',
    bar:  'bg-green-500',
  },
  info: {
    wrap: 'border-blue-500/50 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/40',
    icon: 'text-blue-600 dark:text-blue-400',
    text: 'text-blue-900 dark:text-blue-200',
    sub:  'text-blue-700 dark:text-blue-400',
    bar:  'bg-blue-500',
  },
  warning: {
    wrap: 'border-amber-500/50 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/40',
    icon: 'text-amber-600 dark:text-amber-400',
    text: 'text-amber-900 dark:text-amber-200',
    sub:  'text-amber-700 dark:text-amber-400',
    bar:  'bg-amber-500',
  },
  error: {
    wrap: 'border-red-500/50 bg-red-50 dark:bg-red-500/10 dark:border-red-500/40',
    icon: 'text-red-600 dark:text-red-400',
    text: 'text-red-900 dark:text-red-200',
    sub:  'text-red-700 dark:text-red-400',
    bar:  'bg-red-500',
  },
};

const DURATION = 4000;

function SingleToast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const Icon = ICONS[toast.type];
  const s = STYLES[toast.type];

  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), DURATION);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ x: 120, opacity: 0, scale: 0.88 }}
      animate={{ x: 0,   opacity: 1, scale: 1 }}
      exit={{    x: 120, opacity: 0, scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`relative flex items-start gap-3 rounded-xl border shadow-lg backdrop-blur-md overflow-hidden w-[300px] sm:w-[330px] ${s.wrap}`}
    >
      {/* Top saffron accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] saffron-gradient opacity-60" />

      <div className="flex items-start gap-3 p-3.5 pr-10 w-full">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${s.icon}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-snug ${s.text}`}>{toast.message}</p>
          {toast.subtitle && (
            <p className={`text-xs mt-0.5 font-devanagari leading-relaxed ${s.sub}`}>
              {toast.subtitle}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className={`absolute top-3 right-3 opacity-50 hover:opacity-100 transition-opacity ${s.icon}`}
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/5 dark:bg-white/5">
        <div
          className={`h-full ${s.bar} opacity-60`}
          style={{ animation: `progress-bar ${DURATION}ms linear forwards` }}
        />
      </div>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'success', subtitle?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-4), { id, message, subtitle, type }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        className="fixed top-[72px] right-3 sm:right-5 z-[100] flex flex-col gap-2.5 pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <SingleToast toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
