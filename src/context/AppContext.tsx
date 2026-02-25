"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

export type Role = 'unit_head' | 'aayam_pramukh' | 'vibhag_pramukh' | 'karyakarta';
export type Lang = 'en' | 'hi';

export type EventStatus = 'Draft' | 'Pending Aayam Review' | 'Pending Final Approval' | 'Published';

export type ArticleStatus = 'Draft' | 'Pending Unit Head Review' | 'Pending Aayam Review' | 'Published';

export type PracharPlatform = 'whatsapp' | 'facebook' | 'instagram' | 'telegram';

export interface PracharStatus {
  eventId: string;
  platforms: Record<PracharPlatform, boolean>;
}

export interface FormConfig {
  fields: {
    phone: boolean;
    city: boolean;
    attendingCount: boolean;
    specialNeeds: boolean;
  };
  customQuestions: { id: string; question: string; questionHi: string; type: 'text' | 'yesno' }[];
}

export interface VotePollOption {
  id: string;
  label: string;
  votes: number;
}

export interface VotePoll {
  id: string;
  question: string;
  questionHi: string;
  type: 'date' | 'general';
  options: VotePollOption[];
  isFinalized: boolean;
  winnerOptionId?: string;
}

export interface EventRegistration {
  id: string;
  name: string;
  phone: string;
  city: string;
  attendingCount: number;
  hasSpecialNeeds: boolean;
  notes?: string;
  submittedAt: string;
}

export interface GatividhiEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  unit: string;
  submittedBy: string;
  status: EventStatus;
  checklist: {
    designing: boolean;
    food: boolean;
    seating: boolean;
    transport: boolean;
    accommodation: boolean;
    soundMic: boolean;
    camera: boolean;
    screen: boolean;
    lights: boolean;
  };
  report?: string;
  photos?: string[];
  poster?: string;
  videoUrl?: string;
  imageUrl?: string;
  registrations?: EventRegistration[];
  formConfig?: FormConfig;
  polls?: VotePoll[];
}

export interface AalekhaArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  author: string;
  date: string;
  category: string;
  status: ArticleStatus;
  socialUrl?: string;
  imageUrl?: string;
  valuesChecklist: {
    rashtraPratham: boolean;
    culturallyGrounded: boolean;
    balancedTone: boolean;
    noDivisiveContent: boolean;
  };
}

interface AppState {
  role: Role;
  setRole: (role: Role) => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
  events: GatividhiEvent[];
  addEvent: (event: Omit<GatividhiEvent, 'id' | 'status'>) => void;
  updateEventStatus: (id: string, status: EventStatus) => void;
  addRegistration: (eventId: string, reg: Omit<EventRegistration, 'id' | 'submittedAt'>) => void;
  updateFormConfig: (eventId: string, config: FormConfig) => void;
  addPoll: (eventId: string, poll: Omit<VotePoll, 'id' | 'isFinalized'>) => void;
  castVote: (eventId: string, pollId: string, optionId: string) => void;
  finalizePoll: (eventId: string, pollId: string, winnerOptionId: string) => void;
  pracharStatuses: PracharStatus[];
  updatePracharPlatform: (eventId: string, platform: PracharPlatform, done: boolean) => void;
  articles: AalekhaArticle[];
  addArticle: (article: Omit<AalekhaArticle, 'id' | 'status'>) => void;
  updateArticleStatus: (
    id: string,
    status: ArticleStatus,
    edits?: Partial<Pick<AalekhaArticle, 'title' | 'content' | 'summary'>>
  ) => void;
}

const roleLabels: Record<Role, string> = {
  unit_head: 'Unit Head',
  aayam_pramukh: 'Aayam Pramukh',
  vibhag_pramukh: 'Vibhag Pramukh',
  karyakarta: 'Karyakarta (Writer)',
};

export { roleLabels };

const initialEvents: GatividhiEvent[] = [
  {
    id: '1',
    title: 'Yuva Sangam - Youth Leadership Summit',
    description: 'Annual youth leadership and skill development summit for college students across Bhopal division.',
    date: '2026-02-15',
    unit: 'Bhopal Shahar',
    submittedBy: 'Ramesh Sharma',
    status: 'Published',
    checklist: { designing: true, food: true, seating: true, transport: true, accommodation: false, soundMic: true, camera: true, screen: true, lights: true },
    report: 'The event was a great success with 250+ attendees participating in various workshops.',
    imageUrl: '',
    registrations: [
      { id: 'r1', name: 'Priya Sharma', phone: '9876543210', city: 'Bhopal', attendingCount: 1, hasSpecialNeeds: false, submittedAt: '2026-02-10' },
      { id: 'r2', name: 'Rahul Mishra', phone: '9812345678', city: 'Vidisha', attendingCount: 2, hasSpecialNeeds: false, submittedAt: '2026-02-12' },
      { id: 'r3', name: 'Anita Verma', phone: '9898765432', city: 'Sehore', attendingCount: 1, hasSpecialNeeds: true, notes: 'Wheelchair access needed', submittedAt: '2026-02-13' },
      { id: 'r4', name: 'Suresh Patel', phone: '9754321098', city: 'Bhopal', attendingCount: 3, hasSpecialNeeds: false, submittedAt: '2026-02-14' },
    ],
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
  },
  {
    id: '3',
    title: 'Samajik Samarasta Sammelan',
    description: 'Community harmony conference promoting social cohesion and cultural integration.',
    date: '2026-03-10',
    unit: 'Sehore',
    submittedBy: 'Anil Verma',
    status: 'Pending Final Approval',
    checklist: { designing: true, food: true, seating: true, transport: true, accommodation: true, soundMic: true, camera: true, screen: true, lights: true },
    report: 'Event included panel discussions, cultural performances, and community dialogue sessions.',
    imageUrl: '',
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
  },
];

const initialPracharStatuses: PracharStatus[] = [
  { eventId: '1', platforms: { whatsapp: true, facebook: false, instagram: false, telegram: true } },
  { eventId: '4', platforms: { whatsapp: false, facebook: false, instagram: false, telegram: false } },
];

const initialArticles: AalekhaArticle[] = [
  {
    id: 'art1',
    title: 'भारतीय ज्ञान परंपरा और आधुनिक शिक्षा',
    content: 'भारत की प्राचीन ज्ञान परंपरा — गुरुकुल, वेद, उपनिषद — आधुनिक शिक्षा को एक नई दिशा दे सकती है। NEP 2020 इसी दिशा में एक महत्वपूर्ण कदम है। मैकाले की शिक्षा प्रणाली ने हमारी आत्मविश्वास को चोट पहुंचाई, लेकिन आज भारत अपनी जड़ों की ओर लौट रहा है। यह आलेख इस विषय पर विस्तार से विचार करता है।',
    summary: 'How ancient Indian knowledge systems can inform modern educational practices and curriculum design.',
    author: 'Dr. Meera Joshi',
    date: '2026-02-10',
    category: 'Shodh',
    status: 'Published',
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
    valuesChecklist: { rashtraPratham: true, culturallyGrounded: true, balancedTone: true, noDivisiveContent: true },
  },
];

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('unit_head');
  const [lang, setLang] = useState<Lang>('en');
  const [events, setEvents] = useState<GatividhiEvent[]>(initialEvents);
  const [pracharStatuses, setPracharStatuses] = useState<PracharStatus[]>(initialPracharStatuses);
  const [articles, setArticles] = useState<AalekhaArticle[]>(initialArticles);

  const addEvent = useCallback((event: Omit<GatividhiEvent, 'id' | 'status'>) => {
    const newEvent: GatividhiEvent = {
      ...event,
      id: Date.now().toString(),
      status: 'Pending Aayam Review',
    };
    setEvents(prev => [newEvent, ...prev]);
  }, []);

  const updateEventStatus = useCallback((id: string, status: EventStatus) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    if (status === 'Published') {
      setPracharStatuses(prev => {
        if (prev.find(p => p.eventId === id)) return prev;
        return [...prev, { eventId: id, platforms: { whatsapp: false, facebook: false, instagram: false, telegram: false } }];
      });
    }
  }, []);

  const updatePracharPlatform = useCallback((eventId: string, platform: PracharPlatform, done: boolean) => {
    setPracharStatuses(prev =>
      prev.map(p => p.eventId === eventId ? { ...p, platforms: { ...p.platforms, [platform]: done } } : p)
    );
  }, []);

  const addRegistration = useCallback((eventId: string, reg: Omit<EventRegistration, 'id' | 'submittedAt'>) => {
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

  const updateFormConfig = useCallback((eventId: string, config: FormConfig) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, formConfig: config } : e));
  }, []);

  const addPoll = useCallback((eventId: string, poll: Omit<VotePoll, 'id' | 'isFinalized'>) => {
    const newPoll: VotePoll = { ...poll, id: `poll${Date.now()}`, isFinalized: false };
    setEvents(prev => prev.map(e =>
      e.id === eventId ? { ...e, polls: [...(e.polls ?? []), newPoll] } : e
    ));
  }, []);

  const castVote = useCallback((eventId: string, pollId: string, optionId: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id !== eventId) return e;
      return {
        ...e,
        polls: (e.polls ?? []).map(p => {
          if (p.id !== pollId) return p;
          return {
            ...p,
            options: p.options.map(o =>
              o.id === optionId ? { ...o, votes: o.votes + 1 } : o
            ),
          };
        }),
      };
    }));
  }, []);

  const finalizePoll = useCallback((eventId: string, pollId: string, winnerOptionId: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id !== eventId) return e;
      const polls = (e.polls ?? []).map(p => {
        if (p.id !== pollId) return p;
        return { ...p, isFinalized: true, winnerOptionId };
      });
      // If date poll, update event date to winner label
      const poll = polls.find(p => p.id === pollId);
      if (poll?.type === 'date') {
        const winner = poll.options.find(o => o.id === winnerOptionId);
        if (winner) return { ...e, polls, date: winner.label };
      }
      return { ...e, polls };
    }));
  }, []);

  const addArticle = useCallback((article: Omit<AalekhaArticle, 'id' | 'status'>) => {
    const newArticle: AalekhaArticle = {
      ...article,
      id: `art${Date.now()}`,
      status: 'Pending Unit Head Review',
    };
    setArticles(prev => [newArticle, ...prev]);
  }, []);

  const updateArticleStatus = useCallback((
    id: string,
    status: ArticleStatus,
    edits?: Partial<Pick<AalekhaArticle, 'title' | 'content' | 'summary'>>
  ) => {
    setArticles(prev => prev.map(a =>
      a.id === id ? { ...a, status, ...(edits ?? {}) } : a
    ));
  }, []);

  return (
    <AppContext.Provider value={{
      role, setRole,
      lang, setLang,
      events, addEvent, updateEventStatus, addRegistration,
      updateFormConfig, addPoll, castVote, finalizePoll,
      pracharStatuses, updatePracharPlatform,
      articles, addArticle, updateArticleStatus,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
