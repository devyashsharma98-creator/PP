/**
 * Pragya Pravah — Task Board URL State
 *
 * The board's selection and filters live in the query string rather than in
 * component state, so that a refresh, a shared link and the browser's back
 * button all land on the same view. Reminder deep links use exactly this shape,
 * which is why parsing and serialising are kept as pure functions with their own
 * tests.
 */

export const TASK_VIEWS = ["board", "mine"] as const;
export type TaskView = (typeof TASK_VIEWS)[number];

export interface TaskBoardState {
  view: TaskView;
  projectId: string | null;
  /** Task to reveal and highlight on arrival — how reminders deep-link. */
  taskId: string | null;
  status: string | null;
  priority: string | null;
  search: string;
}

export const EMPTY_TASK_BOARD_STATE: TaskBoardState = {
  view: "board",
  projectId: null,
  taskId: null,
  status: null,
  priority: null,
  search: "",
};

const VALID_STATUSES = new Set(["todo", "in_progress", "done", "blocked"]);
const VALID_PRIORITIES = new Set(["low", "medium", "high", "urgent"]);

function readOne(params: URLSearchParams | Record<string, string | undefined>, key: string): string | null {
  const value = params instanceof URLSearchParams ? params.get(key) : params[key];
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseTaskBoardState(
  params: URLSearchParams | Record<string, string | undefined>,
): TaskBoardState {
  const rawView = readOne(params, "view");
  const view: TaskView = TASK_VIEWS.includes(rawView as TaskView) ? (rawView as TaskView) : "board";

  const status = readOne(params, "status");
  const priority = readOne(params, "priority");

  return {
    view,
    projectId: readOne(params, "projectId"),
    taskId: readOne(params, "taskId"),
    status: status && VALID_STATUSES.has(status) ? status : null,
    priority: priority && VALID_PRIORITIES.has(priority) ? priority : null,
    search: readOne(params, "q") ?? "",
  };
}

/** Serialise back to a query string, omitting defaults so links stay readable. */
export function serialiseTaskBoardState(state: TaskBoardState): string {
  const params = new URLSearchParams();
  if (state.view !== "board") params.set("view", state.view);
  if (state.projectId) params.set("projectId", state.projectId);
  if (state.taskId) params.set("taskId", state.taskId);
  if (state.status) params.set("status", state.status);
  if (state.priority) params.set("priority", state.priority);
  if (state.search.trim()) params.set("q", state.search.trim());
  return params.toString();
}

/** Filters to send to the tasks endpoint for the current state. */
export function taskQueryFilters(state: TaskBoardState): Record<string, string> {
  const filters: Record<string, string> = { limit: "100" };
  if (state.status) filters.status = state.status;
  if (state.priority) filters.priority = state.priority;
  if (state.search.trim()) filters.search = state.search.trim();
  return filters;
}

export function hasActiveFilters(state: TaskBoardState): boolean {
  return Boolean(state.status || state.priority || state.search.trim());
}
