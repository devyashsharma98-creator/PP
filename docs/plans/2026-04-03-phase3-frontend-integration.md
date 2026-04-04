# Phase 3: Frontend Integration

> **Goal:** Integrate new backend APIs with UI using TanStack Query

**Approach:** Full integration - TanStack Query + custom hooks for all modules

---

## Task 1: TanStack Query Setup

**Files:**
- Create: `src/lib/query-client.ts`
- Create: `src/hooks/use-events.ts`
- Create: `src/hooks/use-articles.ts`
- Create: `src/hooks/use-users.ts`
- Create: `src/hooks/use-notifications.ts`

### Implementation:
```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});
```

```typescript
// src/hooks/use-events.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useEvents(filters?: EventFilters) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => fetchEvents(filters),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
```

---

## Task 2: API Client Functions

**Files:**
- Create: `src/lib/api/events.ts`
- Create: `src/lib/api/articles.ts`
- Create: `src/lib/api/users.ts`
- Create: `src/lib/api/notifications.ts`

---

## Task 3: Dashboard Integration

**Refactor:**
- Replace React Context data fetches with TanStack Query hooks
- Add loading/error states
- Keep demo data fallback for offline/development

---

## Task 4: Notifications Badge + Real-time

**Add:**
- Unread notification count in navbar
- Poll for updates (or use SWR)

---

## Implementation Order

1. TanStack Query setup
2. API client functions
3. Custom hooks
4. Dashboard refactor
5. Notification badge

---

## Demo Data Fallback Pattern

```typescript
// Keep for development when API unavailable
async function fetchWithFallback<T>(apiFn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await apiFn();
  } catch {
    return fallback;
  }
}
```