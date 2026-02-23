"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

export type Role = 'unit_head' | 'aayam_pramukh' | 'vibhag_pramukh';

export type EventStatus = 'Draft' | 'Pending Aayam Review' | 'Pending Final Approval' | 'Published';

export type PracharPlatform = 'whatsapp' | 'facebook' | 'instagram' | 'telegram';

export interface PracharStatus {
  eventId: string;
  platforms: Record<PracharPlatform, boolean>;
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
}

interface AppState {
  role: Role;
  setRole: (role: Role) => void;
  events: GatividhiEvent[];
  addEvent: (event: Omit<GatividhiEvent, 'id' | 'status'>) => void;
  updateEventStatus: (id: string, status: EventStatus) => void;
  pracharStatuses: PracharStatus[];
  updatePracharPlatform: (eventId: string, platform: PracharPlatform, done: boolean) => void;
}

const roleLabels: Record<Role, string> = {
  unit_head: 'Unit Head',
  aayam_pramukh: 'Aayam Pramukh',
  vibhag_pramukh: 'Vibhag Pramukh',
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

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('unit_head');
  const [events, setEvents] = useState<GatividhiEvent[]>(initialEvents);
  const [pracharStatuses, setPracharStatuses] = useState<PracharStatus[]>(initialPracharStatuses);

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

  return (
    <AppContext.Provider value={{ role, setRole, events, addEvent, updateEventStatus, pracharStatuses, updatePracharPlatform }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
