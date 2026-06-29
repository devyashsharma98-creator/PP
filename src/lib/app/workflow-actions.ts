/**
 * Workflow Actions Helper
 *
 * Single source of truth for generating safe, consistent workflow URLs across
 * the ERP. Every CTA in the app should route through here so that:
 *   - URLs are always correctly encoded
 *   - Optional fields are dropped (never produce ?topic=undefined)
 *   - Action priority is consistent (deepest link wins)
 *   - Entity handoffs carry real context forward
 *
 * Design principle: "More option, less friction, factual productivity."
 * Every generated href must answer: what can the user do next?
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type WorkflowEntity =
  | "event"
  | "article"
  | "topic"
  | "thread"
  | "scholar"
  | "user"
  | "library"
  | "task"
  | "project"
  | "notification"
  | "circular"
  | "survey"
  | "media"
  | "volunteer"
  | "conference";

export interface WorkflowContext {
  /** The entity being acted on */
  entity: WorkflowEntity;
  /** Stable id (uuid or slug) — used for /aalekh/[id], /scholars/[slug] */
  id?: string;
  /** Display title — used for prefill + labels */
  title?: string;
  /** Hindi display title */
  titleHi?: string;
  /** Vimarsh topic id — for topic handoffs to Charcha/Aalekh */
  topicId?: string;
  /** Vimarsh topic title (plain string, distinct from topicId) */
  topic?: string;
  /** Vimarsh charcha thread id — for thread→Aalekh prefill handoff */
  threadId?: string;
  /** Event id — for prachar/vritt/registrations handoffs */
  eventId?: string;
  /** User id — for directory→task-board assignment prefill */
  userId?: string;
  /** User display name — for assignee prefill */
  assigneeName?: string;
  /** Scholar slug — for scholar↔article cross-links */
  scholarSlug?: string;
  /** Notification kind — for /notifications?kind= filter */
  kind?: string;
  /** Source entity label — for task-board source context */
  source?: string;
  /** Library citation key */
  cite?: string;
  /** Search query — for library/directory search prefill */
  search?: string;
  /** Tab — for /dashboard?tab= */
  tab?: string;
  /** Action verb — for /dashboard?event=&action= */
  action?: "review" | "edit" | "view" | "create";
}

export interface WorkflowAction {
  /** Stable action key — used for dedup + priority */
  key: string;
  /** English label */
  label: string;
  /** Hindi label */
  labelHi: string;
  /** Generated href (already encoded) */
  href: string;
  /** Lucide icon name (resolved by caller) — kept as string to avoid import cycles */
  icon: string;
  /** Priority for ordering (lower = earlier). See ACTION_PRIORITY below. */
  priority: number;
}

// ── Priority ordering ────────────────────────────────────────────────────────
// Primary action first, then context-carrying handoffs, then drill-downs.
const ACTION_PRIORITY = {
  primary: 10,
  handoff: 20,
  drilldown: 30,
  secondary: 40,
} as const;

// ── Internal: safe URL builder ───────────────────────────────────────────────

/**
 * Build a URL with query params, dropping any key whose value is
 * null/undefined/empty-string. Never produces ?key=undefined.
 */
export function buildWorkflowHref(
  path: string,
  params?: Record<string, string | undefined | null>,
): string {
  if (!params) return path;
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      sp.set(key, value);
    }
  }
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

// ── Internal: label resolution ───────────────────────────────────────────────

/**
 * Resolve the best display label for an entity, preferring Hindi when the
 * caller signals the viewer is in Hindi mode.
 */
export function resolveEntityLabel(
  ctx: WorkflowContext,
  langHi = false,
): string {
  if (langHi && ctx.titleHi) return ctx.titleHi;
  return ctx.title ?? ctx.titleHi ?? ctx.id ?? ctx.entity;
}

// ── Internal: encode full context for pass-through (e.g. task-board source) ──

/**
 * Encode a workflow context into a compact string for source-entity tracking.
 * Used when a task is created FROM an entity (e.g. create task from a vimarsh topic)
 * so the task-board can label where the task originated.
 */
export function encodeWorkflowContext(ctx: WorkflowContext): string {
  const parts = [ctx.entity, ctx.id ?? "", ctx.title ?? ""];
  return encodeURIComponent(parts.join("::"));
}

// ── Per-entity action builders ───────────────────────────────────────────────

function eventActions(ctx: WorkflowContext): WorkflowAction[] {
  const actions: WorkflowAction[] = [];
  const id = ctx.id ?? ctx.eventId;

  if (id) {
    actions.push({
      key: "event-view",
      label: "View Details",
      labelHi: "विवरण देखें",
      href: buildWorkflowHref("/dashboard", { event: id, action: ctx.action ?? "view" }),
      icon: "Eye",
      priority: ACTION_PRIORITY.primary,
    });
    actions.push({
      key: "event-calendar",
      label: "Open in Calendar",
      labelHi: "कैलेंडर में खोलें",
      href: buildWorkflowHref("/calendar", { event: id }),
      icon: "CalendarDays",
      priority: ACTION_PRIORITY.drilldown,
    });
    actions.push({
      key: "event-prachar",
      label: "Open in Prachar",
      labelHi: "प्रचार में खोलें",
      href: buildWorkflowHref("/prachar", { eventId: id }),
      icon: "Megaphone",
      priority: ACTION_PRIORITY.handoff,
    });
    actions.push({
      key: "event-vishleshan",
      label: "Coverage Analytics",
      labelHi: "आच्छादन विश्लेषण",
      href: buildWorkflowHref("/prachar-vishleshan", { eventId: id }),
      icon: "BarChart3",
      priority: ACTION_PRIORITY.drilldown,
    });
  }

  if (ctx.action === "create" || !id) {
    actions.push({
      key: "event-create",
      label: "Create Event",
      labelHi: "कार्यक्रम बनाएँ",
      href: buildWorkflowHref("/dashboard", { tab: "create" }),
      icon: "Plus",
      priority: ACTION_PRIORITY.primary,
    });
  }

  return actions;
}

function articleActions(ctx: WorkflowContext): WorkflowAction[] {
  const actions: WorkflowAction[] = [];

  if (ctx.id) {
    actions.push({
      key: "article-permalink",
      label: "Open Article",
      labelHi: "आलेख खोलें",
      href: `/aalekh/${encodeURIComponent(ctx.id)}`,
      icon: "FileText",
      priority: ACTION_PRIORITY.primary,
    });
  }

  actions.push({
    key: "article-write",
    label: "Write New Aalekh",
    labelHi: "नया आलेख लिखें",
    href: buildWorkflowHref("/aalekh", { topic: ctx.topic, topicId: ctx.topicId }),
    icon: "PenLine",
    priority: ACTION_PRIORITY.handoff,
  });

  if (ctx.id) {
    actions.push({
      key: "article-discuss",
      label: "Discuss in Charcha",
      labelHi: "चर्चा में साझा करें",
      href: buildWorkflowHref("/charcha", { topic: ctx.title, topicId: ctx.topicId }),
      icon: "MessageSquare",
      priority: ACTION_PRIORITY.secondary,
    });
  }

  actions.push({
    key: "article-feed",
    label: "View Published Feed",
    labelHi: "प्रकाशित फीड देखें",
    href: "/feed",
    icon: "Newspaper",
    priority: ACTION_PRIORITY.drilldown,
  });

  return actions;
}

function topicActions(ctx: WorkflowContext): WorkflowAction[] {
  const actions: WorkflowAction[] = [];

  actions.push({
    key: "topic-charcha",
    label: "Start Charcha",
    labelHi: "चर्चा शुरू करें",
    href: buildWorkflowHref("/charcha", { topic: ctx.title, topicId: ctx.id ?? ctx.topicId }),
    icon: "MessageSquare",
    priority: ACTION_PRIORITY.primary,
  });

  actions.push({
    key: "topic-aalekh",
    label: "Draft Aalekh",
    labelHi: "आलेख लिखें",
    href: buildWorkflowHref("/aalekh", { topic: ctx.title, topicId: ctx.id ?? ctx.topicId }),
    icon: "PenLine",
    priority: ACTION_PRIORITY.handoff,
  });

  actions.push({
    key: "topic-task",
    label: "Create Task",
    labelHi: "कार्य बनाएँ",
    href: buildWorkflowHref("/task-board", {
      title: ctx.title,
      source: ctx.id ? encodeWorkflowContext(ctx) : undefined,
    }),
    icon: "ListTodo",
    priority: ACTION_PRIORITY.secondary,
  });

  actions.push({
    key: "topic-library",
    label: "Open Library",
    labelHi: "पुस्तकालय खोलें",
    href: buildWorkflowHref("/library", { cite: ctx.id }),
    icon: "BookOpen",
    priority: ACTION_PRIORITY.drilldown,
  });

  return actions;
}

function threadActions(ctx: WorkflowContext): WorkflowAction[] {
  const actions: WorkflowAction[] = [];
  const id = ctx.id ?? ctx.threadId;

  if (id) {
    actions.push({
      key: "thread-aalekh",
      label: "Draft Aalekh",
      labelHi: "आलेख लिखें",
      href: buildWorkflowHref("/aalekh", { threadId: id }),
      icon: "PenLine",
      priority: ACTION_PRIORITY.primary,
    });

    actions.push({
      key: "thread-reply",
      label: "Reply in Charcha",
      labelHi: "चर्चा में उत्तर दें",
      href: buildWorkflowHref("/charcha", { topic: ctx.title, topicId: ctx.topicId }),
      icon: "MessageSquare",
      priority: ACTION_PRIORITY.handoff,
    });
  }

  return actions;
}

function scholarActions(ctx: WorkflowContext): WorkflowAction[] {
  const actions: WorkflowAction[] = [];

  if (ctx.scholarSlug) {
    actions.push({
      key: "scholar-profile",
      label: "View Profile",
      labelHi: "प्रोफ़ाइल देखें",
      href: `/scholars/${encodeURIComponent(ctx.scholarSlug)}`,
      icon: "GraduationCap",
      priority: ACTION_PRIORITY.primary,
    });
  }

  actions.push({
    key: "scholar-aalekh",
    label: "Draft Aalekh",
    labelHi: "आलेख लिखें",
    href: buildWorkflowHref("/aalekh", { topic: ctx.title }),
    icon: "PenLine",
    priority: ACTION_PRIORITY.handoff,
  });

  actions.push({
    key: "scholar-directory",
    label: "Open Directory",
    labelHi: "निर्देशिका खोलें",
    href: buildWorkflowHref("/directory", { search: ctx.title }),
    icon: "Users",
    priority: ACTION_PRIORITY.drilldown,
  });

  return actions;
}

function userActions(ctx: WorkflowContext): WorkflowAction[] {
  const actions: WorkflowAction[] = [];

  actions.push({
    key: "user-task",
    label: "Assign Task",
    labelHi: "कार्य सौंपें",
    href: buildWorkflowHref("/task-board", {
      assignee: ctx.userId,
      title: ctx.title ? `Follow up: ${ctx.title}` : undefined,
      source: ctx.id ? encodeWorkflowContext(ctx) : undefined,
    }),
    icon: "ListTodo",
    priority: ACTION_PRIORITY.primary,
  });

  actions.push({
    key: "user-directory",
    label: "View in Directory",
    labelHi: "निर्देशिका में देखें",
    href: buildWorkflowHref("/directory", { search: ctx.assigneeName ?? ctx.title }),
    icon: "Users",
    priority: ACTION_PRIORITY.handoff,
  });

  if (ctx.userId) {
    actions.push({
      key: "user-manage",
      label: "Manage Account",
      labelHi: "खाता प्रबंधित करें",
      href: buildWorkflowHref("/users", { search: ctx.userId }),
      icon: "Settings",
      priority: ACTION_PRIORITY.drilldown,
    });
  }

  return actions;
}

function libraryActions(ctx: WorkflowContext): WorkflowAction[] {
  const actions: WorkflowAction[] = [];

  actions.push({
    key: "library-cite",
    label: "Cite in Aalekh",
    labelHi: "आलेख में उद्धृत करें",
    href: buildWorkflowHref("/aalekh", { topic: ctx.title }),
    icon: "PenLine",
    priority: ACTION_PRIORITY.handoff,
  });

  actions.push({
    key: "library-discuss",
    label: "Discuss Resource",
    labelHi: "संसाधन पर चर्चा",
    href: buildWorkflowHref("/charcha", { topic: ctx.title }),
    icon: "MessageSquare",
    priority: ACTION_PRIORITY.secondary,
  });

  return actions;
}

function taskActions(ctx: WorkflowContext): WorkflowAction[] {
  const actions: WorkflowAction[] = [];

  actions.push({
    key: "task-board",
    label: "Open Task Board",
    labelHi: "कार्य बोर्ड खोलें",
    href: buildWorkflowHref("/task-board", {
      title: ctx.title,
      assignee: ctx.userId,
      source: ctx.source,
    }),
    icon: "ListTodo",
    priority: ACTION_PRIORITY.primary,
  });

  return actions;
}

function notificationActions(ctx: WorkflowContext): WorkflowAction[] {
  const actions: WorkflowAction[] = [];
  const id = ctx.id;

  // Resolve to the deepest available route for the notification's entity
  if (ctx.entity === "article" && id) {
    actions.push({
      key: "notif-article",
      label: "Open Article",
      labelHi: "आलेख खोलें",
      href: `/aalekh/${encodeURIComponent(id)}`,
      icon: "FileText",
      priority: ACTION_PRIORITY.primary,
    });
  } else if (ctx.entity === "scholar" && ctx.scholarSlug) {
    actions.push({
      key: "notif-scholar",
      label: "Open Profile",
      labelHi: "प्रोफ़ाइल खोलें",
      href: `/scholars/${encodeURIComponent(ctx.scholarSlug)}`,
      icon: "GraduationCap",
      priority: ACTION_PRIORITY.primary,
    });
  } else if (id) {
    // Generic fallback to the module root with kind filter
    actions.push({
      key: "notif-module",
      label: "Open",
      labelHi: "खोलें",
      href: buildWorkflowHref("/notifications", { kind: ctx.kind }),
      icon: "Bell",
      priority: ACTION_PRIORITY.primary,
    });
  }

  return actions;
}

function circularActions(ctx: WorkflowContext): WorkflowAction[] {
  const actions: WorkflowAction[] = [];

  if (ctx.userId) {
    actions.push({
      key: "circular-issuer",
      label: "View Issuer",
      labelHi: "जारीकर्ता देखें",
      href: buildWorkflowHref("/directory", { search: ctx.assigneeName ?? ctx.title }),
      icon: "Users",
      priority: ACTION_PRIORITY.drilldown,
    });
  }

  return actions;
}

function surveyActions(ctx: WorkflowContext): WorkflowAction[] {
  const actions: WorkflowAction[] = [];

  actions.push({
    key: "survey-respondents",
    label: "View Directory",
    labelHi: "निर्देशिका देखें",
    href: "/directory",
    icon: "Users",
    priority: ACTION_PRIORITY.drilldown,
  });

  return actions;
}

function mediaActions(ctx: WorkflowContext): WorkflowAction[] {
  const actions: WorkflowAction[] = [];

  actions.push({
    key: "media-aalekh",
    label: "Use in Aalekh",
    labelHi: "आलेख में उपयोग करें",
    href: buildWorkflowHref("/aalekh", { topic: ctx.title }),
    icon: "PenLine",
    priority: ACTION_PRIORITY.secondary,
  });

  return actions;
}

function volunteerActions(ctx: WorkflowContext): WorkflowAction[] {
  const actions: WorkflowAction[] = [];

  actions.push({
    key: "volunteer-task",
    label: "Assign Task",
    labelHi: "कार्य सौंपें",
    href: buildWorkflowHref("/task-board", {
      assignee: ctx.userId,
      title: ctx.title ? `Duty: ${ctx.title}` : undefined,
    }),
    icon: "ListTodo",
    priority: ACTION_PRIORITY.primary,
  });

  actions.push({
    key: "volunteer-directory",
    label: "View in Directory",
    labelHi: "निर्देशिका में देखें",
    href: buildWorkflowHref("/directory", { search: ctx.assigneeName ?? ctx.title }),
    icon: "Users",
    priority: ACTION_PRIORITY.drilldown,
  });

  return actions;
}

function conferenceActions(ctx: WorkflowContext): WorkflowAction[] {
  const actions: WorkflowAction[] = [];

  actions.push({
    key: "conference-feed",
    label: "Publish to Feed",
    labelHi: "फीड पर प्रकाशित करें",
    href: "/feed",
    icon: "Newspaper",
    priority: ACTION_PRIORITY.secondary,
  });

  return actions;
}

function projectActions(ctx: WorkflowContext): WorkflowAction[] {
  return [{
    key: "project-board",
    label: "Open Task Board",
    labelHi: "कार्य बोर्ड खोलें",
    href: buildWorkflowHref("/task-board", { source: ctx.id }),
    icon: "ListTodo",
    priority: ACTION_PRIORITY.primary,
  }];
}

// ── Public: build all workflow actions for an entity context ─────────────────

const BUILDERS: Record<WorkflowEntity, (ctx: WorkflowContext) => WorkflowAction[]> = {
  event: eventActions,
  article: articleActions,
  topic: topicActions,
  thread: threadActions,
  scholar: scholarActions,
  user: userActions,
  library: libraryActions,
  task: taskActions,
  project: projectActions,
  notification: notificationActions,
  circular: circularActions,
  survey: surveyActions,
  media: mediaActions,
  volunteer: volunteerActions,
  conference: conferenceActions,
};

/**
 * Build the full set of workflow actions for a given entity + context.
 * Actions are sorted by priority (primary first). Deduplicated by key.
 */
export function buildEntityWorkflowActions(ctx: WorkflowContext): WorkflowAction[] {
  const builder = BUILDERS[ctx.entity];
  if (!builder) return [];
  const actions = builder(ctx);
  const seen = new Set<string>();
  return actions
    .filter((a) => {
      if (seen.has(a.key)) return false;
      seen.add(a.key);
      return true;
    })
    .sort((a, b) => a.priority - b.priority);
}

// ── Public: resolve a single best action (for notification deep-link etc.) ───

/**
 * Resolve the single highest-priority action href for a context.
 * Returns null if no action is available. Used by notification rows to
 * deep-link into the deepest available entity route.
 */
export function resolveBestActionHref(ctx: WorkflowContext): string | null {
  const actions = buildEntityWorkflowActions(ctx);
  return actions.length > 0 ? actions[0].href : null;
}
