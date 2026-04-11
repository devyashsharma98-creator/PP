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
}

export interface VibhagDashboardViewProps extends DashboardRoleViewProps {
  lastPublished: string | null;
  onDismissPublished: () => void;
  onForwardToPrant: (eventId: string) => void | Promise<void>;
  onPublishEvent: (eventId: string, title: string, currentStatus: GatividhiEvent["status"]) => void | Promise<void>;
}

export interface AayamDashboardViewProps extends DashboardRoleViewProps {
  onForwardToVibhag: (eventId: string, currentStatus: GatividhiEvent["status"]) => void | Promise<void>;
}

export interface UnitDashboardViewProps {
  events: GatividhiEvent[];
  isApiConnected: boolean;
  statusBadge: (status: string) => string;
  statusLabel: (status: string) => string;
  vrittStatusLabel: (status: "draft" | "submitted" | "reviewed") => string;
  onOpenVrittEditor: (event: GatividhiEvent) => void;
  onOpenQr: (event: GatividhiEvent) => void;
  onSubmitForReview: (eventId: string) => void | Promise<void>;
}

export interface VrittEditorState {
  content: string;
  attendanceCount: number;
  mediaUrls: string[];
  status: "draft" | "submitted" | "reviewed";
}
