export type CanonicalRoleCode =
  | "super_admin"
  | "org_admin"
  | "karyakarta"
  | "unit_head"
  | "aayam_pramukh"
  | "vibhag_pramukh"
  | "prant_sanyojak"
  | "prant_aayam_pramukh"
  | "kshetra_reviewer";

export type UiRole = "unit_head" | "aayam_pramukh" | "vibhag_pramukh" | "karyakarta";
export type Role = UiRole;
export type Lang = "en" | "hi";

export type EventStatus =
  | "Draft"
  | "Submitted by Unit"
  | "Pending Aayam Review"
  | "Pending Vibhag Review"
  | "Pending Prant Authorization"
  | "Pending Prant Dual Authorization"
  | "Published"
  | "Escalated to Kshetra"
  | "Returned for Revision"
  | "Rejected"
  | "Cancelled";

export type ArticleStatus =
  | "Draft"
  | "Pending Unit Head Review"
  | "Pending Aayam Review"
  | "Pending Vibhag Review"
  | "Pending Prant Authorization"
  | "Published"
  | "Escalated to Kshetra"
  | "Returned for Revision"
  | "Rejected"
  | "Archived";

export type PracharPlatform = "whatsapp" | "facebook" | "instagram" | "telegram";

export type VrittStatus = "draft" | "submitted" | "reviewed";

export interface PracharStatus {
  eventId: string;
  platforms: Record<PracharPlatform, boolean>;
  skipReasons: {
    whatsapp: string | null;
    facebook: string | null;
    instagram: string | null;
    telegram: string | null;
  };
  templateReference?: string | null;
}

export type QuestionType =
  | "text"
  | "yesno"
  | "select"
  | "multiselect"
  | "textarea"
  | "number"
  | "email"
  | "rating"
  | "date"
  | "checkbox_group"
  | "radio_group";

export interface FormConfig {
  fields: {
    phone: boolean;
    city: boolean;
    attendingCount: boolean;
    specialNeeds: boolean;
  };
  customQuestions: {
    id: string;
    question: string;
    questionHi: string;
    type: QuestionType;
    options?: string[];
  }[];
}

export interface VotePollOption {
  id: string;
  label: string;
  votes: number;
  scheduledAtIso?: string | null;
}

export interface VotePoll {
  id: string;
  question: string;
  questionHi: string;
  type: "date" | "general";
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
  customAnswers?: Record<string, string>;
}

export interface GatividhiEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  dateIso?: string;
  unitId?: string | null;
  departmentId?: string | null;
  departmentCode?: string | null;
  createdByUserId?: string | null;
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
  vrittAttendanceCount?: number;
  vrittCheckedInCount?: number;
  vrittMediaUrls?: string[];
  vrittContent?: string;
  vrittStatus?: VrittStatus;
}

export interface AalekhArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  unitId?: string | null;
  departmentId?: string | null;
  authorUserId?: string | null;
  createdByUserId?: string | null;
  author: string;
  date: string;
  category: string;
  status: ArticleStatus;
  socialUrl?: string;
  imageUrl?: string;
  documentUrl?: string | null;
  latestReviewNotes?: string | null;
  valuesChecklist: {
    rashtraPratham: boolean;
    culturallyGrounded: boolean;
    balancedTone: boolean;
    noDivisiveContent: boolean;
  };
}

export interface VimarshResource {
  id: string;
  topicId: string;
  title: string;
  url: string;
  resourceType: string;
}

export interface VimarshTopic {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  resources: VimarshResource[];
}

export interface AppBootstrapPayload {
  events: GatividhiEvent[];
  articles: AalekhArticle[];
  pracharStatuses: PracharStatus[];
  vimarshTopics: VimarshTopic[];
  notifications?: unknown[];
  viewer?: AppViewerContext | null;
}

export interface AppOverviewLoginRecord {
  userId: string;
  displayName: string | null;
  email: string | null;
  lastLoginAt: string | null;
  primaryRoleCode: CanonicalRoleCode | null;
  isActive: boolean;
}

export interface AppOverviewActorRecord {
  userId: string;
  displayName: string | null;
  email: string | null;
  createdCount: number;
  reviewCount: number;
  publishedCount: number;
  lastActionAt: string | null;
}

export interface AppOverviewWorkflowSummary {
  pendingEvents: number;
  pendingArticles: number;
  openPracharCampaigns: number;
  publishedEvents: number;
  publishedArticles: number;
  stalledEvents: number;
  stalledArticles: number;
  roleLaneCounts: Array<{
    lane: string;
    count: number;
  }>;
  ownership: {
    eventCreators: number;
    articleAuthors: number;
    activeContributors: number;
  };
}

export interface AppOverviewHierarchySummary {
  totalWarnings: number;
  missingOrgRoles: string[];
  missingUnitHeads: number;
  missingAayamHeads: number;
  inactiveAssignees: number;
  workflowGaps: number;
  warningMessages: string[];
}

export interface AppOverviewAdminDetails {
  recentLogins: AppOverviewLoginRecord[];
  recentActors: AppOverviewActorRecord[];
  missingUnits: string[];
  missingAayams: string[];
  inactiveAssignmentHolders: Array<{
    displayName: string | null;
    email: string | null;
    roleCode: CanonicalRoleCode;
    scopeType: "org" | "unit" | "department" | "event" | "article";
  }>;
  workflowGapDetails: Array<{
    lane: string;
    count: number;
    reason: string;
  }>;
}

export interface AppOverviewPayload {
  generatedAt: string;
  login: {
    totalAccounts: number;
    activeAccounts: number;
    loggedInToday: number;
    loggedInLast7Days: number;
    successLast30Days: number;
    failedLast30Days: number;
  };
  workflow: AppOverviewWorkflowSummary;
  hierarchy: AppOverviewHierarchySummary;
  admin: AppOverviewAdminDetails | null;
}

export interface AppRoleAssignmentSummary {
  id: string;
  roleCode: CanonicalRoleCode;
  roleName: string;
  roleNameHi?: string | null;
  scopeType: "org" | "unit" | "department" | "event" | "article";
  orgId?: string | null;
  unitId?: string | null;
  departmentId?: string | null;
  scopeEntityId?: string | null;
  isPrimary: boolean;
}

export interface AppPermissionSummary {
  canReadInternalBootstrap: boolean;
  canCreateEvent: boolean;
  canCreateArticle: boolean;
  canFinalizePoll: boolean;
  canPublishEvent: boolean;
  canPublishArticle: boolean;
  canUpdatePrachar: boolean;
  canManageUsers: boolean;
}

export interface AppViewerContext {
  userId: string;
  email?: string | null;
  displayName?: string | null;
  isAuthenticated: true;
  uiRole: UiRole;
  primaryRoleCode: CanonicalRoleCode;
  effectiveRoles: CanonicalRoleCode[];
  assignments: AppRoleAssignmentSummary[];
  permissions: AppPermissionSummary;
  requiresPasswordChange: boolean;
}

export type AppActionRequest =
  | {
      action: "createEvent";
      payload: Omit<GatividhiEvent, "id" | "status">;
    }
  | {
      action: "updateEventStatus";
      payload: { id: string; status: EventStatus };
    }
  | {
      action: "updateFormConfig";
      payload: { eventId: string; config: FormConfig };
    }
  | {
      action: "addPoll";
      payload: { eventId: string; poll: Omit<VotePoll, "id" | "isFinalized"> };
    }
  | {
      action: "castVote";
      payload: { eventId: string; pollId: string; optionId: string };
    }
  | {
      action: "finalizePoll";
      payload: { eventId: string; pollId: string; winnerOptionId: string };
    }
  | {
      action: "addArticle";
      payload: Omit<AalekhArticle, "id" | "status">;
    }
  | {
      action: "updateArticleStatus";
      payload: {
        id: string;
        status: ArticleStatus;
        edits?: Partial<Pick<AalekhArticle, "title" | "content" | "summary">>;
        documentUrl?: string | null;
        reviewNotes?: string | null;
      };
    }
  | {
      action: "updatePracharPlatform";
      payload: {
        eventId: string;
        platform: PracharPlatform;
        done: boolean;
        skipReason?: string | null;
      };
    }
  | {
      action: "updateVritt";
      payload: {
        eventId: string;
        vrittContent?: string;
        vrittAttendanceCount?: number;
        vrittMediaUrls?: string[];
        vrittStatus?: VrittStatus;
      };
    }
  | {
      action: "markAttendance";
      payload: { eventId: string };
    };

export interface PublicRegistrationRequest {
  name: string;
  phone?: string;
  city?: string;
  attendingCount?: number;
  hasSpecialNeeds?: boolean;
  notes?: string;
  customAnswers?: Record<string, string>;
}

export interface PublicVoteRequest {
  optionId: string;
}
