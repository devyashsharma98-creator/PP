"use client";

import type { AppPermissionSummary, GatividhiEvent } from "@/lib/app/contracts";

export type TranslateFn = (en: string, hi: string) => string;

export interface DashboardRoleViewProps {
  events: GatividhiEvent[];
  permissions: AppPermissionSummary;
  t: TranslateFn;
  eventStatusHi: Record<string, string>;
  statusBadge: (status: string) => string;
  onOpenVrittEditor: (event: GatividhiEvent) => void;
  onOpenQr: (event: GatividhiEvent) => void;
  /** Active workbench tab (today | queue | create | published | followup) */
  activeTab?: string;
}

export interface VibhagDashboardViewProps extends DashboardRoleViewProps {
  lastPublished: string | null;
  workflowPending?: boolean;
  onDismissPublished: () => void;
  onForwardToPrant: (eventId: string) => void | Promise<void>;
  onPublishEvent: (eventId: string, title: string, currentStatus: GatividhiEvent["status"]) => void | Promise<void>;
}

export interface AayamDashboardViewProps extends DashboardRoleViewProps {
  dashboardKind?: "aayam_pramukh" | "prant_aayam_pramukh";
  workflowPending?: boolean;
  onForwardToVibhag: (eventId: string, currentStatus: GatividhiEvent["status"]) => void | Promise<void>;
}

export interface UnitDashboardViewProps {
  dashboardKind?: "unit_head" | "karyakarta" | "super_admin";
  events: GatividhiEvent[];
  isApiConnected: boolean;
  statusBadge: (status: string) => string;
  statusLabel: (status: string) => string;
  vrittStatusLabel: (status: "draft" | "submitted" | "reviewed") => string;
  onOpenVrittEditor: (event: GatividhiEvent) => void;
  onOpenQr: (event: GatividhiEvent) => void;
  workflowPending?: boolean;
  onSubmitForReview: (eventId: string) => void | Promise<void>;
  onForwardToVibhag?: (eventId: string, currentStatus: GatividhiEvent["status"]) => void | Promise<void>;
  onForwardToPrant?: (eventId: string) => void | Promise<void>;
  onPublishEvent?: (eventId: string, title: string, currentStatus: GatividhiEvent["status"]) => void | Promise<void>;
  /** Auto-open the create-event dialog (from ?tab=create) */
  autoOpenCreate?: boolean;
  /** Event id to scroll to + highlight (from ?event=) */
  focusEventId?: string | null;
  /** Active workbench tab (today | queue | create | published | followup) */
  activeTab?: string;
}

export interface VrittEditorState {
  content: string;
  attendanceCount: number;
  mediaUrls: string[];
  status: "draft" | "submitted" | "reviewed";
}
