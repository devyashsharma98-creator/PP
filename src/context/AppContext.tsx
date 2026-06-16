"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import type {
  AalekhArticle,
  AppBootstrapPayload,
  AppPermissionSummary,
  AppViewerContext,
  EventRegistration,
  EventStatus,
  FormConfig,
  GatividhiEvent,
  Lang,
  PracharPlatform,
  PracharStatus,
  Role,
  VimarshTopic,
  VrittStatus,
  VotePoll,
  VotePollOption,
  ArticleStatus,
} from '@/lib/app/contracts';

export type {
  Role,
  Lang,
  EventStatus,
  ArticleStatus,
  PracharPlatform,
  PracharStatus,
  FormConfig,
  VotePollOption,
  VotePoll,
  EventRegistration,
  GatividhiEvent,
  AalekhArticle,
  VrittStatus,
};

interface AppState {
  role: Role;
  availableRoles: Role[];
  setRole: (role: Role) => void;
  viewer: AppViewerContext | null;
  permissions: AppPermissionSummary;
  isAuthenticated: boolean;
  authReady: boolean;
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Reload `/api/app/bootstrap` to keep auth/viewer state in sync. */
  refreshWorkspace: () => Promise<void>;
}

const defaultPermissions: AppPermissionSummary = {
  canReadInternalBootstrap: false,
  canCreateEvent: false,
  canCreateArticle: false,
  canFinalizePoll: false,
  canPublishEvent: false,
  canPublishArticle: false,
  canUpdatePrachar: false,
  canManageUsers: false,
};

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const demoRoleSwitchEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_ROLE_SWITCH === 'true';

  const [serverRole, setServerRole] = useState<Role>('karyakarta');
  const [demoRoleOverride, setDemoRoleOverride] = useState<Role | null>(null);
  const [viewer, setViewer] = useState<AppViewerContext | null>(null);
  const [permissions, setPermissions] = useState<AppPermissionSummary>(defaultPermissions);
  const [authReady, setAuthReady] = useState(false);
  const [lang, setLang] = useState<Lang>('en');

  const availableRoles = useMemo(() => {
    const all = viewer?.effectiveRoles ?? [];
    return all.filter((r): r is Role =>
      r === 'karyakarta' || r === 'unit_head' || r === 'aayam_pramukh' || r === 'vibhag_pramukh'
    );
  }, [viewer]);

  useEffect(() => {
    if (demoRoleOverride && !availableRoles.includes(demoRoleOverride)) {
      setDemoRoleOverride(null);
    }
  }, [availableRoles, demoRoleOverride]);

  const role = demoRoleSwitchEnabled && demoRoleOverride ? demoRoleOverride : serverRole;

  const setRole = useCallback((nextRole: Role) => {
    if (!demoRoleSwitchEnabled) return;
    if (!availableRoles.includes(nextRole)) return;
    setDemoRoleOverride(nextRole);
  }, [demoRoleSwitchEnabled, availableRoles]);

  const applyBootstrap = useCallback((payload: AppBootstrapPayload) => {
    if ("viewer" in payload && !payload.viewer) {
      setViewer(null);
      setPermissions(defaultPermissions);
      setServerRole('karyakarta');
    }
    if (payload.viewer) {
      setViewer(payload.viewer);
      setPermissions(payload.viewer.permissions);
      setServerRole(payload.viewer.uiRole);
      if (payload.viewer.requiresPasswordChange && typeof window !== 'undefined' && window.location.pathname !== '/setup-profile') {
        window.location.replace('/setup-profile');
      }
    }
  }, []);

  const loadRemoteBootstrap = useCallback(async () => {
    try {
      const res = await fetch('/api/app/bootstrap', { cache: 'no-store' });
      if (res.status === 401 || res.status === 403) {
        setViewer(null);
        setPermissions(defaultPermissions);
        setServerRole('karyakarta');
        setAuthReady(true);
        return;
      }
      if (!res.ok) {
        setAuthReady(true);
        return;
      }
      const data = (await res.json()) as AppBootstrapPayload;
      applyBootstrap(data);
      setAuthReady(true);
    } catch {
      setAuthReady(true);
    }
  }, [applyBootstrap]);

  useEffect(() => {
    const savedLang = window.localStorage.getItem('pp_lang');
    if (savedLang === 'hi' || savedLang === 'en') {
      setLang(savedLang);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
    document.documentElement.dataset.appLang = lang;
    window.localStorage.setItem('pp_lang', lang);
  }, [lang]);

  useEffect(() => {
    if (pathname === '/login') {
      setViewer(null);
      setPermissions(defaultPermissions);
      setServerRole('karyakarta');
      setAuthReady(true);
      return;
    }
    void loadRemoteBootstrap();
  }, [loadRemoteBootstrap, pathname]);

  const refreshWorkspace = useCallback(async () => {
    await loadRemoteBootstrap();
  }, [loadRemoteBootstrap]);

  const contextValue = useMemo(() => ({
    role, availableRoles, setRole, viewer, permissions, isAuthenticated: Boolean(viewer), authReady,
    lang, setLang,
    refreshWorkspace,
  }), [
    role, availableRoles, setRole, viewer, permissions, authReady,
    lang, setLang,
    refreshWorkspace,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
