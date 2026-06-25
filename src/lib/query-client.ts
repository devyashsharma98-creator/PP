import { QueryClient } from '@tanstack/react-query';

const appQueryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
} satisfies ConstructorParameters<typeof QueryClient>[0];

export function createAppQueryClient() {
  return new QueryClient(appQueryClientOptions);
}

export const queryClient = createAppQueryClient();

export { queryClient as default };

export const queryKeys = {
  events: (filters?: Record<string, unknown>) => ['events', filters] as const,
  calendarEvents: (filters?: Record<string, unknown>) => ['calendar', 'events', filters] as const,
  event: (id: string) => ['event', id] as const,
  articles: (filters?: Record<string, unknown>) => ['articles', filters] as const,
  article: (id: string) => ['article', id] as const,
  users: (filters?: Record<string, unknown>) => ['users', filters] as const,
  user: (id: string) => ['user', id] as const,
  notifications: (filters?: Record<string, unknown>) => ['notifications', filters] as const,
  unreadCount: () => ['notifications', 'unread-count'] as const,
  overview: () => ['app', 'overview'] as const,
  taskboard: () => ['taskboard'] as const,
  circulars: (filters?: Record<string, unknown>) => ['circulars', filters] as const,
  circular: (id: string) => ['circular', id] as const,
  unreadCirculars: () => ['circulars', 'unread-count'] as const,
  volunteers: (filters?: Record<string, unknown>) => ['volunteers', filters] as const,
  volunteer: (id: string) => ['volunteer', id] as const,
  volunteerActivities: (volunteerId: string, filters?: Record<string, unknown>) => ['volunteerActivities', volunteerId, filters] as const,
  volunteerSummary: () => ['volunteers', 'summary'] as const,
  projects: (filters?: Record<string, unknown>) => ['projects', filters] as const,
  projectTasks: (projectId: string, filters?: Record<string, unknown>) => ['projectTasks', projectId, filters] as const,
  mediaAssets: (filters?: Record<string, unknown>) => ['media', filters] as const,
  mediaAsset: (id: string) => ['media', id] as const,
  mediaSummary: () => ['media', 'summary'] as const,
  conferences: (filters?: Record<string, unknown>) => ['conferences', filters] as const,
  conference: (id: string) => ['conference', id] as const,
  conferenceSessions: (conferenceId: string) => ['conferenceSessions', conferenceId] as const,
  session: (conferenceId: string, sessionId: string) => ['session', conferenceId, sessionId] as const,
  sessionSpeakers: (sessionId: string) => ['sessionSpeakers', sessionId] as const,
  conferenceRegistrations: (conferenceId: string) => ['conferenceRegistrations', conferenceId] as const,
  surveys: (filters?: Record<string, unknown>) => ['surveys', filters] as const,
  survey: (id: string) => ['survey', id] as const,
  surveyResponses: (surveyId: string) => ['surveyResponses', surveyId] as const,
  surveySummary: () => ['surveys', 'summary'] as const,
  auditLogs: (filters?: Record<string, unknown>) => ['auditLogs', filters] as const,
  org: () => ['org'] as const,
};
