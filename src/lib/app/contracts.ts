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
  /** Intellectual event type key (study_circle | shivir | ...), from metadata.eventType. */
  eventType?: string | null;
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
  canUpdateEvent: boolean;
  canSubmitEvent: boolean;
  canReviewEvent: boolean;
  canPublishEvent: boolean;
  canCancelEvent: boolean;
  canManageEventForm: boolean;
  canManagePolls: boolean;
  canFinalizePoll: boolean;
  canViewRegistrations: boolean;
  canCreateArticle: boolean;
  canUpdateArticle: boolean;
  canSubmitArticle: boolean;
  canReviewArticle: boolean;
  canPublishArticle: boolean;
  canArchiveArticle: boolean;
  canUpdatePrachar: boolean;
  canViewPracharReport: boolean;
  canManageUsers: boolean;
  canAssignRoles: boolean;
  canViewDirectory: boolean;
  canCreateProject: boolean;
  canUpdateProject: boolean;
  canCreateTask: boolean;
  canUpdateTask: boolean;
  canAssignTask: boolean;
  canCreateCircular: boolean;
  canBroadcastCircular: boolean;
  canManageVolunteers: boolean;
  canLogActivity: boolean;
  canUploadMedia: boolean;
  canDeleteMedia: boolean;
  canManageMediaLibrary: boolean;
  canCreateConference: boolean;
  canManageConference: boolean;
  canManageConferenceSessions: boolean;
  canManageConferenceSpeakers: boolean;
  canViewConferenceRegistrations: boolean;
  canCreateSurvey: boolean;
  canManageSurvey: boolean;
  canViewSurveyResponses: boolean;
  canViewAuditLogs: boolean;
  canManageOrg: boolean;
}

// ── Circular Types ───────────────────────────────────────────────────────────
export interface CircularItem {
  id: string;
  title: string;
  titleHi?: string | null;
  body: string;
  bodyHi?: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  scope: "org" | "unit" | "department";
  authorName?: string | null;
  publishedAt?: string | null;
  expiresAt?: string | null;
  readAt?: string | null;
  createdAt: string;
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

// ── Task / Project Types ─────────────────────────────────────────────────────
export type ProjectStatus = "planned" | "active" | "completed" | "archived";
export type TaskStatus = "todo" | "in_progress" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface ProjectSummary {
  id: string;
  name: string;
  nameHi?: string | null;
  description?: string | null;
  departmentId?: string | null;
  status: ProjectStatus;
  ownerUserId?: string | null;
  deadline?: string | null;
  taskCount: number;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  titleHi?: string | null;
  description?: string | null;
  assigneeUserId?: string | null;
  assigneeName?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  sortOrder: number;
  completedAt?: string | null;
  createdAt: string;
}

// ── Volunteer Types ──────────────────────────────────────────────────────────
export type VolunteerActivityType = "shakha_attendance" | "event_duty" | "training" | "outreach" | "admin" | "other";

export interface VolunteerProfileSummary {
  id: string;
  profileId: string;
  displayName?: string | null;
  email?: string | null;
  skills?: string[];
  joinedAt?: string | null;
  serviceSpanMonths?: number | null;
  totalHours: number;
  activityCount: number;
}

export interface VolunteerActivityItem {
  id: string;
  volunteerId: string;
  activityType: VolunteerActivityType;
  description?: string | null;
  hoursLogged?: number | null;
  date: string;
  eventId?: string | null;
}

export type MediaCategory = "image" | "document" | "video" | "audio" | "other";

export interface MediaAssetItem {
  id: string;
  filename: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  bucket: string;
  category: MediaCategory;
  altText?: string | null;
  altTextHi?: string | null;
  tags?: string[];
  width?: number | null;
  height?: number | null;
  uploadedByName?: string | null;
  createdAt: string;
}

export interface MediaLibrarySummary {
  totalAssets: number;
  totalSizeBytes: number;
  categoryCounts: Record<string, number>;
}

export type ConferenceStatus = "draft" | "planning" | "registration_open" | "ongoing" | "completed" | "cancelled";
export type SessionType = "keynote" | "panel" | "paper_presentation" | "workshop" | "cultural" | "other";
export type RegistrationCategory = "delegate" | "student" | "speaker" | "vip" | "media" | "other";

export interface ConferenceSummary {
  id: string;
  title: string;
  titleHi?: string | null;
  theme?: string | null;
  venue?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  status: ConferenceStatus;
  departmentId?: string | null;
  unitId?: string | null;
  registrationEnabled: boolean;
  sessionCount: number;
  registrationCount: number;
  createdBy?: string | null;
  createdAt: string;
}

export interface ConferenceSessionItem {
  id: string;
  conferenceId: string;
  title: string;
  titleHi?: string | null;
  description?: string | null;
  sessionType: SessionType;
  startsAt?: string | null;
  endsAt?: string | null;
  venue?: string | null;
  chairpersonName?: string | null;
  sortOrder: number;
  speakerCount: number;
}

export interface SessionSpeakerItem {
  id: string;
  sessionId: string;
  profileId?: string | null;
  name: string;
  nameHi?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  topic?: string | null;
  affiliation?: string | null;
  sortOrder: number;
}

export interface ConferenceRegistrationItem {
  id: string;
  conferenceId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  organization?: string | null;
  category: RegistrationCategory;
  isAttended: boolean;
  notes?: string | null;
  submittedAt: string;
}

// ── Survey Types ─────────────────────────────────────────────────────────────
export type SurveyStatus = "draft" | "published" | "closed" | "archived";

export interface SurveySummary {
  id: string;
  title: string;
  titleHi?: string | null;
  description?: string | null;
  status: SurveyStatus;
  questionCount: number;
  responseCount: number;
  isPublic: boolean;
  createdAt: string;
}

export interface SurveyDetail {
  id: string;
  title: string;
  titleHi?: string | null;
  description?: string | null;
  descriptionHi?: string | null;
  status: SurveyStatus;
  scope: string;
  scopeEntityId?: string | null;
  allowMultipleSubmissions: boolean;
  maxSubmissions?: number | null;
  opensAt?: string | null;
  closesAt?: string | null;
  isPublic: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  questions: SurveyQuestionItem[];
}

export interface SurveyQuestionItem {
  id: string;
  questionKey: string;
  label: string;
  labelHi?: string | null;
  questionType: QuestionType;
  isRequired: boolean;
  displayOrder: number;
  options?: string[];
}

export interface SurveyResponseItem {
  id: string;
  respondentName?: string | null;
  respondentEmail?: string | null;
  respondentPhone?: string | null;
  submittedAt: string;
  answers: SurveyAnswerItem[];
}

export interface SurveyAnswerItem {
  id: string;
  questionKey: string;
  value?: string | null;
}
