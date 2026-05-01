"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import type {
  AalekhArticle,
  AppActionRequest,
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
  events: GatividhiEvent[];
  addEvent: (event: Omit<GatividhiEvent, 'id' | 'status'>) => Promise<boolean>;
  updateEventStatus: (id: string, status: EventStatus) => Promise<boolean>;
  updateVritt: (
    eventId: string,
    updates: {
      vrittContent?: string;
      vrittAttendanceCount?: number;
      vrittMediaUrls?: string[];
      vrittStatus?: VrittStatus;
    }
  ) => Promise<boolean>;
  addRegistration: (
    eventId: string,
    reg: Omit<EventRegistration, 'id' | 'submittedAt'>,
    options?: { skipRemote?: boolean }
  ) => void;
  updateFormConfig: (eventId: string, config: FormConfig) => Promise<boolean>;
  addPoll: (eventId: string, poll: Omit<VotePoll, 'id' | 'isFinalized'>) => Promise<boolean>;
  castVote: (eventId: string, pollId: string, optionId: string, options?: { skipRemote?: boolean }) => void;
  finalizePoll: (eventId: string, pollId: string, winnerOptionId: string) => Promise<boolean>;
  pracharStatuses: PracharStatus[];
  updatePracharPlatform: (eventId: string, platform: PracharPlatform, done: boolean, skipReason?: string | null) => Promise<boolean>;
  articles: AalekhArticle[];
  addArticle: (article: Omit<AalekhArticle, 'id' | 'status'>) => Promise<boolean>;
  updateArticleStatus: (
    id: string,
    status: ArticleStatus,
    edits?: Partial<Pick<AalekhArticle, 'title' | 'content' | 'summary'>>,
    extra?: { documentUrl?: string | null; reviewNotes?: string | null },
  ) => Promise<boolean>;
  markAttendance: (eventId: string, options?: { skipRemote?: boolean }) => void;
  vimarshTopics: VimarshTopic[];
  /** Reload `/api/app/bootstrap` so Launchpad, Prachar, and Aalekh match the server after `/api/v1` mutations. */
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

const defaultVrittFields = {
  vrittAttendanceCount: 0,
  vrittCheckedInCount: 0,
  vrittMediaUrls: [] as string[],
  vrittContent: '',
  vrittStatus: 'draft' as const,
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
  const [events, setEvents] = useState<GatividhiEvent[]>([]);
  const [pracharStatuses, setPracharStatuses] = useState<PracharStatus[]>([]);
  const [articles, setArticles] = useState<AalekhArticle[]>([]);
  const [vimarshTopics, setVimarshTopics] = useState<VimarshTopic[]>([]);

  const availableRoles = useMemo(() => {
    const all = viewer?.effectiveRoles ?? [];
    return all.filter((r): r is Role =>
      r === 'karyakarta' || r === 'unit_head' || r === 'aayam_pramukh' || r === 'vibhag_pramukh'
    );
  }, [viewer]);

  // Reset demo role override if it's no longer in the user's effective roles
  useEffect(() => {
    if (demoRoleOverride && !availableRoles.includes(demoRoleOverride)) {
      setDemoRoleOverride(null);
    }
  }, [availableRoles, demoRoleOverride]);

  const role = demoRoleSwitchEnabled && demoRoleOverride ? demoRoleOverride : serverRole;

  const setRole = useCallback((nextRole: Role) => {
    if (!demoRoleSwitchEnabled) return;
    if (!availableRoles.includes(nextRole)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[AppContext] Role "${nextRole}" not in viewer.effectiveRoles. Ignoring setRole().`);
      }
      return;
    }
    setDemoRoleOverride(nextRole);
  }, [demoRoleSwitchEnabled, availableRoles]);

  const clearInternalData = useCallback(() => {
    setEvents([]);
    setPracharStatuses([]);
    setArticles([]);
    setVimarshTopics([]);
  }, []);

  const applyBootstrap = useCallback((payload: AppBootstrapPayload) => {
    if (Array.isArray(payload.events)) setEvents(payload.events as GatividhiEvent[]);
    if (Array.isArray(payload.pracharStatuses)) setPracharStatuses(payload.pracharStatuses as PracharStatus[]);
    if (Array.isArray(payload.articles)) setArticles(payload.articles as AalekhArticle[]);
    if (Array.isArray(payload.vimarshTopics)) setVimarshTopics(payload.vimarshTopics);
    if ("viewer" in payload && !payload.viewer) {
      setViewer(null);
      setPermissions(defaultPermissions);
      setServerRole('karyakarta');
    }
    if (payload.viewer) {
      setViewer(payload.viewer);
      setPermissions(payload.viewer.permissions);
      setServerRole(payload.viewer.uiRole);
    }
  }, []);

  const loadRemoteBootstrap = useCallback(async () => {
    try {
      const res = await fetch('/api/app/bootstrap', { cache: 'no-store' });
      if (res.status === 401 || res.status === 403) {
        setViewer(null);
        setPermissions(defaultPermissions);
        setServerRole('karyakarta');
        clearInternalData();
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
      clearInternalData();
    }
  }, [applyBootstrap, clearInternalData]);

  const persistAppAction = useCallback(async (action: AppActionRequest, opts?: { refresh?: boolean }) => {
    try {
      const res = await fetch('/api/app/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          if (opts?.refresh !== false) {
            void loadRemoteBootstrap();
          }
        }
        return false;
      }
      if (opts?.refresh) {
        await loadRemoteBootstrap();
      }
      return true;
    } catch {
      return false;
    }
  }, [loadRemoteBootstrap]);

  useEffect(() => {
    document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
    document.documentElement.dataset.appLang = lang;
    window.localStorage.setItem('pp_lang', lang);
  }, [lang]);

  useEffect(() => {
    const savedLang = window.localStorage.getItem('pp_lang');
    if (savedLang === 'hi' || savedLang === 'en') {
      setLang(savedLang);
    }
  }, []);

  useEffect(() => {
    if (pathname === '/login') {
      setViewer(null);
      setPermissions(defaultPermissions);
      setServerRole('karyakarta');
      setAuthReady(true);
      clearInternalData();
      return;
    }
    void loadRemoteBootstrap();
  }, [clearInternalData, loadRemoteBootstrap, pathname]);

  const addEvent = useCallback(async (event: Omit<GatividhiEvent, 'id' | 'status'>) => {
    if (!permissions.canCreateEvent) return false;
    return persistAppAction({ action: 'createEvent', payload: event }, { refresh: true });
  }, [permissions.canCreateEvent, persistAppAction]);

  const updateEventStatus = useCallback(async (id: string, status: EventStatus) => {
    return persistAppAction({ action: 'updateEventStatus', payload: { id, status } }, { refresh: true });
  }, [persistAppAction]);

  const updateVritt = useCallback(async (
    eventId: string,
    updates: {
      vrittContent?: string;
      vrittAttendanceCount?: number;
      vrittMediaUrls?: string[];
      vrittStatus?: VrittStatus;
    }
  ) => {
    return persistAppAction({ action: 'updateVritt', payload: { eventId, ...updates } }, { refresh: true });
  }, [persistAppAction]);

  const updatePracharPlatform = useCallback(async (eventId: string, platform: PracharPlatform, done: boolean, skipReason?: string | null) => {
    if (!permissions.canUpdatePrachar) return false;
    return persistAppAction({ action: 'updatePracharPlatform', payload: { eventId, platform, done, skipReason } }, { refresh: true });
  }, [permissions.canUpdatePrachar, persistAppAction]);

  const addRegistration = useCallback((
    eventId: string,
    reg: Omit<EventRegistration, 'id' | 'submittedAt'>,
    _options?: { skipRemote?: boolean }
  ) => {
    const newReg: EventRegistration = {
      ...reg,
      id: `reg${Date.now()}`,
      submittedAt: new Date().toISOString().slice(0, 10),
    };
    setEvents(prev => prev.map(e =>
      e.id === eventId
        ? { ...e, registrations: [...(e.registrations ?? []), newReg] }
        : e
    ));
  }, []);

  const updateFormConfig = useCallback(async (eventId: string, config: FormConfig) => {
    return persistAppAction({ action: 'updateFormConfig', payload: { eventId, config } }, { refresh: true });
  }, [persistAppAction]);

  const addPoll = useCallback(async (eventId: string, poll: Omit<VotePoll, 'id' | 'isFinalized'>) => {
    return persistAppAction({ action: 'addPoll', payload: { eventId, poll } }, { refresh: true });
  }, [persistAppAction]);

  const castVote = useCallback((eventId: string, pollId: string, optionId: string, options?: { skipRemote?: boolean }) => {
    let shouldPersist = !options?.skipRemote;
    setEvents(prev => prev.map(e => {
      if (e.id !== eventId) return e;
      return {
        ...e,
        polls: (e.polls ?? []).map(p => {
          if (p.id !== pollId) return p;
          if (p.isFinalized) {
            shouldPersist = false;
            return p;
          }
          return {
            ...p,
            options: p.options.map(o =>
              o.id === optionId ? { ...o, votes: o.votes + 1 } : o
            ),
          };
        }),
      };
    }));
    if (shouldPersist) {
      void persistAppAction({ action: 'castVote', payload: { eventId, pollId, optionId } });
    }
  }, [persistAppAction]);

  const finalizePoll = useCallback(async (eventId: string, pollId: string, winnerOptionId: string) => {
    if (!permissions.canFinalizePoll) return false;
    return persistAppAction({ action: 'finalizePoll', payload: { eventId, pollId, winnerOptionId } }, { refresh: true });
  }, [permissions.canFinalizePoll, persistAppAction]);

  const addArticle = useCallback(async (article: Omit<AalekhArticle, 'id' | 'status'>) => {
    if (!permissions.canCreateArticle) return false;
    return persistAppAction({ action: 'addArticle', payload: article }, { refresh: true });
  }, [permissions.canCreateArticle, persistAppAction]);

  const updateArticleStatus = useCallback(async (
    id: string,
    status: ArticleStatus,
    edits?: Partial<Pick<AalekhArticle, 'title' | 'content' | 'summary'>>,
    extra?: { documentUrl?: string | null; reviewNotes?: string | null },
  ) => {
    return persistAppAction({
      action: 'updateArticleStatus',
      payload: { id, status, edits, ...extra },
    }, { refresh: true });
  }, [persistAppAction]);

  const markAttendance = useCallback((eventId: string, options?: { skipRemote?: boolean }) => {
    setEvents(prev => prev.map(e =>
      e.id === eventId
        ? { ...e, vrittCheckedInCount: (e.vrittCheckedInCount ?? 0) + 1 }
        : e
    ));
    if (options?.skipRemote !== true) {
      void persistAppAction({ action: 'markAttendance', payload: { eventId } });
    }
  }, [persistAppAction]);

  const refreshWorkspace = useCallback(async () => {
    await loadRemoteBootstrap();
  }, [loadRemoteBootstrap]);

  const contextValue = useMemo(() => ({
    role, availableRoles, setRole, viewer, permissions, isAuthenticated: Boolean(viewer), authReady,
    lang, setLang,
    events, addEvent, updateEventStatus, markAttendance, addRegistration,
    updateFormConfig, addPoll, castVote, finalizePoll, updateVritt,
    articles, addArticle, updateArticleStatus,
    pracharStatuses, updatePracharPlatform,
    vimarshTopics,
    refreshWorkspace,
  }), [
    role, availableRoles, setRole, viewer, permissions, authReady,
    lang, setLang,
    events, addEvent, updateEventStatus, markAttendance, addRegistration,
    updateFormConfig, addPoll, castVote, finalizePoll, updateVritt,
    articles, addArticle, updateArticleStatus,
    pracharStatuses, updatePracharPlatform,
    vimarshTopics,
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
