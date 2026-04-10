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

const initialEvents: GatividhiEvent[] = [
  {
    id: '1',
    title: 'Yuva Sangam - Youth Leadership Summit',
    description: 'Annual youth leadership and skill development summit for college students across Bhopal division.',
    date: '2026-02-15',
    unit: 'Bhopal Shahar',
    submittedBy: 'Unit Head',
    status: 'Published',
    checklist: { designing: true, food: true, seating: true, transport: true, accommodation: false, soundMic: true, camera: true, screen: true, lights: true },
    registrations: [
      { id: 'r1', name: 'Priya Sharma', phone: '9876543210', city: 'Bhopal', attendingCount: 1, hasSpecialNeeds: false, submittedAt: '2026-02-10' },
      { id: 'r2', name: 'Rahul Mishra', phone: '9812345678', city: 'Vidisha', attendingCount: 2, hasSpecialNeeds: false, submittedAt: '2026-02-12' },
      { id: 'r3', name: 'Anita Verma', phone: '9898765432', city: 'Sehore', attendingCount: 1, hasSpecialNeeds: true, notes: 'Wheelchair access needed', submittedAt: '2026-02-13' },
      { id: 'r4', name: 'Suresh Patel', phone: '9754321098', city: 'Bhopal', attendingCount: 3, hasSpecialNeeds: false, submittedAt: '2026-02-14' },
    ],
    ...defaultVrittFields,
    vrittAttendanceCount: 250,
    vrittCheckedInCount: 242,
  },
  {
    id: '2',
    title: 'Vaidik Ganit Karyashala',
    description: 'Workshop on ancient Indian mathematics - Vedic Maths techniques for competitive exams.',
    date: '2026-03-01',
    unit: 'Vidisha',
    submittedBy: 'Priya Patel',
    status: 'Pending Aayam Review',
    checklist: { designing: false, food: true, seating: true, transport: false, accommodation: false, soundMic: true, camera: true, screen: false, lights: false },
    imageUrl: '',
    formConfig: {
      fields: { phone: true, city: true, attendingCount: true, specialNeeds: false },
      customQuestions: [
        { id: 'cq1', question: 'Vegetarian or Non-veg?', questionHi: 'शाकाहारी या मांसाहारी?', type: 'yesno' },
      ],
    },
    polls: [
      {
        id: 'poll1',
        question: 'Which date works best for this workshop?',
        questionHi: 'कार्यशाला के लिए कौन सी तारीख उचित है?',
        type: 'date',
        options: [
          { id: 'opt1', label: '15 March 2026', votes: 7 },
          { id: 'opt2', label: '22 March 2026', votes: 4 },
          { id: 'opt3', label: '29 March 2026', votes: 2 },
        ],
        isFinalized: false,
      },
    ],
    ...defaultVrittFields,
  },
  {
    id: '3',
    title: 'Samajik Samarasta Sammelan',
    description: 'Community harmony conference promoting social cohesion and cultural integration.',
    date: '2026-03-10',
    unit: 'Sehore',
    submittedBy: 'Anil Verma',
    status: 'Pending Vibhag Review',
    checklist: { designing: true, food: true, seating: true, transport: true, accommodation: true, soundMic: true, camera: true, screen: true, lights: true },
    report: 'Event included panel discussions, cultural performances, and community dialogue sessions.',
    imageUrl: '',
    ...defaultVrittFields,
  },
  {
    id: '4',
    title: 'Bharatiya Vigyan Pradarshani',
    description: 'Exhibition showcasing contributions of ancient India to science, metallurgy, and architecture.',
    date: '2026-03-20',
    unit: 'Raisen',
    submittedBy: 'Kavita Singh',
    status: 'Published',
    checklist: { designing: false, food: false, seating: true, transport: false, accommodation: false, soundMic: true, camera: true, screen: true, lights: false },
    report: 'Over 100 exhibits displayed covering astronomy, medicine, mathematics and engineering.',
    imageUrl: '',
    registrations: [
      { id: 'r5', name: 'Deepak Tiwari', phone: '9754399999', city: 'Raisen', attendingCount: 3, hasSpecialNeeds: false, submittedAt: '2026-03-05' },
      { id: 'r6', name: 'Sunita Gupta', phone: '9867890123', city: 'Bhopal', attendingCount: 1, hasSpecialNeeds: false, notes: 'Vegetarian food please', submittedAt: '2026-03-07' },
    ],
    ...defaultVrittFields,
  },
  {
    id: '5',
    title: 'Gram Vikas Charcha',
    description: 'Rural development dialogue focusing on self-reliance and sustainable village economy.',
    date: '2026-02-28',
    unit: 'Hoshangabad',
    submittedBy: 'Suresh Yadav',
    status: 'Draft',
    checklist: { designing: false, food: false, seating: false, transport: false, accommodation: false, soundMic: false, camera: false, screen: false, lights: false },
    imageUrl: '',
    ...defaultVrittFields,
  },
];

const defaultSkipReasons = { whatsapp: null, facebook: null, instagram: null, telegram: null };

const initialPracharStatuses: PracharStatus[] = [
  { eventId: '1', platforms: { whatsapp: true, facebook: false, instagram: false, telegram: true }, skipReasons: { ...defaultSkipReasons } },
  { eventId: '4', platforms: { whatsapp: false, facebook: false, instagram: false, telegram: false }, skipReasons: { ...defaultSkipReasons } },
];

const initialArticles: AalekhArticle[] = [
  {
    id: 'art1',
    title: 'भारतीय ज्ञान परंपरा और आधुनिक शिक्षा',
    content: 'भारत की प्राचीन ज्ञान परंपरा — गुरुकुल, वेद, उपनिषद — आधुनिक शिक्षा को एक नई दिशा दे सकती है। NEP 2020 इसी दिशा में एक महत्वपूर्ण कदम है। मैकाले की शिक्षा प्रणाली ने हमारी आत्मविश्वास को चोट पहुंचाई, लेकिन आज भारत अपनी जड़ों की ओर लौट रहा है। यह आलेख इस विषय पर विस्तार से विचार करता है।',
    summary: 'How ancient Indian knowledge systems can inform modern educational practices and curriculum design.',
    author: 'Dr. Meera Joshi',
    date: '2026-02-10',
    category: 'Shodh',
    status: 'Published',
    documentUrl: null,
    valuesChecklist: { rashtraPratham: true, culturallyGrounded: true, balancedTone: true, noDivisiveContent: true },
  },
  {
    id: 'art2',
    title: 'Swadeshi Movement: Lessons for Atmanirbhar Bharat',
    content: 'The historical Swadeshi movement of the early 20th century carries profound lessons for modern India. Atmanirbhar Bharat draws directly from the tradition of self-reliance rooted in Deendayal Upadhyaya\'s Integral Humanism. This article explores the parallels and what we can learn today.',
    summary: 'Drawing parallels between the historical Swadeshi movement and modern self-reliance initiatives.',
    author: 'Current User',
    date: '2026-02-18',
    category: 'Vimarsh',
    status: 'Pending Unit Head Review',
    socialUrl: 'https://facebook.com/pragya.pravah/posts/example',
    documentUrl: null,
    valuesChecklist: { rashtraPratham: true, culturallyGrounded: true, balancedTone: true, noDivisiveContent: true },
  },
  {
    id: 'art3',
    title: 'Vedic Mathematics in Competitive Exams',
    content: 'Vedic Math sutras, rediscovered by Swami Bharati Krishna Tirtha, provide powerful shortcuts for competitive exams. These techniques are rooted in ancient Vedic traditions and prove remarkably effective for JEE and banking exam preparation. This article covers key sutras with worked examples.',
    summary: 'Practical application of Vedic Math sutras for faster calculation in JEE and banking exams.',
    author: 'Ravi Shankar Tiwari',
    date: '2026-02-20',
    category: 'Shodh',
    status: 'Pending Aayam Review',
    documentUrl: null,
    valuesChecklist: { rashtraPratham: true, culturallyGrounded: true, balancedTone: true, noDivisiveContent: true },
  },
];

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const demoRoleSwitchEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_ROLE_SWITCH === 'true';
  const demoDataFallbackEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA_FALLBACK === 'true';

  const [serverRole, setServerRole] = useState<Role>('karyakarta');
  const [demoRoleOverride, setDemoRoleOverride] = useState<Role | null>(null);
  const [viewer, setViewer] = useState<AppViewerContext | null>(null);
  const [permissions, setPermissions] = useState<AppPermissionSummary>(defaultPermissions);
  const [authReady, setAuthReady] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [events, setEvents] = useState<GatividhiEvent[]>(demoDataFallbackEnabled ? initialEvents : []);
  const [pracharStatuses, setPracharStatuses] = useState<PracharStatus[]>(demoDataFallbackEnabled ? initialPracharStatuses : []);
  const [articles, setArticles] = useState<AalekhArticle[]>(demoDataFallbackEnabled ? initialArticles : []);
  const [vimarshTopics, setVimarshTopics] = useState<VimarshTopic[]>([]);

  const role = demoRoleSwitchEnabled && demoRoleOverride ? demoRoleOverride : serverRole;

  const setRole = useCallback((nextRole: Role) => {
    if (!demoRoleSwitchEnabled) return;
    setDemoRoleOverride(nextRole);
  }, [demoRoleSwitchEnabled]);

  const clearInternalData = useCallback(() => {
    setEvents(demoDataFallbackEnabled ? initialEvents : []);
    setPracharStatuses(demoDataFallbackEnabled ? initialPracharStatuses : []);
    setArticles(demoDataFallbackEnabled ? initialArticles : []);
    setVimarshTopics([]);
  }, [demoDataFallbackEnabled]);

  const applyBootstrap = useCallback((payload: AppBootstrapPayload) => {
    if (Array.isArray(payload.events)) setEvents(payload.events as GatividhiEvent[]);
    if (Array.isArray(payload.pracharStatuses)) setPracharStatuses(payload.pracharStatuses as PracharStatus[]);
    if (Array.isArray(payload.articles)) setArticles(payload.articles as AalekhArticle[]);
    if (Array.isArray(payload.vimarshTopics)) setVimarshTopics(payload.vimarshTopics);
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
        if (!demoDataFallbackEnabled) {
          clearInternalData();
        }
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
      if (!demoDataFallbackEnabled) {
        clearInternalData();
      }
    }
  }, [applyBootstrap, clearInternalData, demoDataFallbackEnabled]);

  const persistAppAction = useCallback(async (action: AppActionRequest, opts?: { refresh?: boolean }) => {
    if (demoDataFallbackEnabled) {
      // Handle local state updates for demo fallback
      if (action.action === 'addArticle') {
        const newArt: AalekhArticle = {
          ...action.payload,
          id: `art-${Date.now()}`,
          status: 'Pending Unit Head Review',
        };
        setArticles(prev => [newArt, ...prev]);
        return true;
      }
      if (action.action === 'updateArticleStatus') {
        const { id, status, edits, reviewNotes } = action.payload;
        setArticles(prev => prev.map(a => 
          a.id === id 
            ? { ...a, ...edits, status, latestReviewNotes: reviewNotes ?? null } 
            : a
        ));
        return true;
      }
      if (action.action === 'createEvent') {
        const newEv: GatividhiEvent = {
          ...action.payload,
          id: `ev-${Date.now()}`,
          status: 'Draft',
          ...defaultVrittFields,
        };
        setEvents(prev => [newEv, ...prev]);
        return true;
      }
      if (action.action === 'updateEventStatus') {
        const { id, status } = action.payload;
        setEvents(prev => prev.map(e => e.id === id ? { ...e, status } : e));
        return true;
      }
      if (action.action === 'updatePracharPlatform') {
        const { eventId, platform, done } = action.payload;
        setPracharStatuses(prev => {
          const existing = prev.find(p => p.eventId === eventId);
          if (existing) {
            return prev.map(p => p.eventId === eventId 
              ? { ...p, platforms: { ...p.platforms, [platform]: done } } 
              : p
            );
          }
          return [...prev, { 
            eventId, 
            platforms: { whatsapp: false, facebook: false, instagram: false, telegram: false, [platform]: done },
            skipReasons: { whatsapp: null, facebook: null, instagram: null, telegram: null }
          }];
        });
        return true;
      }
      if (action.action === 'markAttendance') {
        const { eventId } = action.payload;
        setEvents(prev => prev.map(e => 
          e.id === eventId 
            ? { ...e, vrittCheckedInCount: (e.vrittCheckedInCount || 0) + 1 } 
            : e
        ));
        return true;
      }
    }

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
  }, [loadRemoteBootstrap, demoDataFallbackEnabled]);

  useEffect(() => {
    if (pathname === '/login') {
      setViewer(null);
      setPermissions(defaultPermissions);
      setServerRole('karyakarta');
      setAuthReady(true);
      if (!demoDataFallbackEnabled) {
        clearInternalData();
      }
      return;
    }
    void loadRemoteBootstrap();
  }, [clearInternalData, demoDataFallbackEnabled, loadRemoteBootstrap, pathname]);

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

  const contextValue = useMemo(() => ({
    role, setRole, viewer, permissions, isAuthenticated: Boolean(viewer), authReady,
    lang, setLang,
    events, addEvent, updateEventStatus, markAttendance, addRegistration,
    updateFormConfig, addPoll, castVote, finalizePoll, updateVritt,
    articles, addArticle, updateArticleStatus,
    pracharStatuses, updatePracharPlatform,
    vimarshTopics,
  }), [
    role, setRole, viewer, permissions, authReady,
    lang, setLang,
    events, addEvent, updateEventStatus, markAttendance, addRegistration,
    updateFormConfig, addPoll, castVote, finalizePoll, updateVritt,
    articles, addArticle, updateArticleStatus,
    pracharStatuses, updatePracharPlatform,
    vimarshTopics,
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
