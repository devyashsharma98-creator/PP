"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ListTodo, User, Calendar, ArrowUp, Trash2, CheckCircle2, Circle, Clock,
  AlertCircle, Pencil, Search, X, Archive, RefreshCw, FolderOpen, Filter,
} from "lucide-react";

import { useAppContext } from "@/context/AppContext";
import {
  useTaskboard, useCreateProject, useRemoveProject, useProjectTasks, useCreateTask,
  useUpdateTask, useDeleteTask, useUpdateProject, useMyTasks,
} from "@/hooks/api/use-tasks";
import { useT } from "@/lib/useT";
import { useToast } from "@/components/ToastProvider";
import {
  EMPTY_TASK_BOARD_STATE, hasActiveFilters, parseTaskBoardState,
  serialiseTaskBoardState, taskQueryFilters, type TaskBoardState,
} from "@/lib/app/taskboard-url-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AssigneePicker } from "./AssigneePicker";

const STATUS_COLUMNS = [
  { key: "todo", label: "To Do", labelHi: "करना है", icon: Circle, color: "text-muted-foreground" },
  { key: "in_progress", label: "In Progress", labelHi: "प्रगति पर", icon: Clock, color: "text-blue-500" },
  { key: "done", label: "Done", labelHi: "पूर्ण", icon: CheckCircle2, color: "text-green-500" },
  { key: "blocked", label: "Blocked", labelHi: "अवरुद्ध", icon: AlertCircle, color: "text-red-500" },
] as const;

const PRIORITY_CONFIG = {
  low: { label: "Low", labelHi: "निम्न", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  medium: { label: "Medium", labelHi: "मध्यम", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  high: { label: "High", labelHi: "उच्च", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  urgent: { label: "Urgent", labelHi: "अति आवश्यक", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
} as const;

const PROJECT_STATUSES = [
  { value: "planned", label: "Planned", labelHi: "नियोजित" },
  { value: "active", label: "Active", labelHi: "सक्रिय" },
  { value: "completed", label: "Completed", labelHi: "पूर्ण" },
  { value: "archived", label: "Archived", labelHi: "संग्रहीत" },
] as const;

interface TaskCapabilities {
  canEditDetails: boolean;
  canChangeStatus: boolean;
  canReassign: boolean;
  canDelete: boolean;
}

interface Task {
  id: string;
  title: string;
  titleHi?: string | null;
  description?: string | null;
  assigneeUserId?: string | null;
  assigneeName?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  /** What this viewer may do to this task, decided by the server. */
  capabilities?: TaskCapabilities;
}

const NO_CAPABILITIES: TaskCapabilities = {
  canEditDetails: false,
  canChangeStatus: false,
  canReassign: false,
  canDelete: false,
};

/** A date input yields YYYY-MM-DD; the API's canonical form is the same. */
function toCalendarDate(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

export function TaskBoardPanel() {
  const { permissions, lang } = useAppContext();
  const t = useT();
  const { addToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Selection and filters live in the URL, so refresh, deep links from
  // reminders, and the browser's back button all restore the same view.
  const urlState = useMemo(
    () => parseTaskBoardState(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const patchUrl = useCallback(
    (patch: Partial<TaskBoardState>, options: { replace?: boolean } = {}) => {
      const next = { ...urlState, ...patch };
      const query = serialiseTaskBoardState(next);
      const href = query ? `${pathname}?${query}` : pathname;
      if (options.replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [urlState, pathname, router],
  );

  const selectedProjectId = urlState.projectId;

  const { data: taskboard, isLoading, isError, refetch: refetchBoard } = useTaskboard();
  const createProjectMutation = useCreateProject();
  const removeProjectMutation = useRemoveProject();
  const updateProjectMutation = useUpdateProject();

  const myTasksQuery = useMyTasks();

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<{ id: string; name: string; taskCount: number } | null>(null);
  const [searchDraft, setSearchDraft] = useState(urlState.search);

  const [newProject, setNewProject] = useState({ name: "", nameHi: "", description: "" });
  const [newTask, setNewTask] = useState({ title: "", titleHi: "", description: "", priority: "medium" as string, assigneeUserId: "", assigneeName: "", dueDate: "" });
  const [editProject, setEditProject] = useState({ name: "", nameHi: "", description: "", status: "planned" as string, deadline: "" });
  const [editTask, setEditTask] = useState({ title: "", titleHi: "", description: "", priority: "medium" as string, status: "todo" as string, assigneeUserId: "", assigneeName: "", dueDate: "" });

  // Keep the search box in step when the URL changes underneath us (back button).
  useEffect(() => { setSearchDraft(urlState.search); }, [urlState.search]);

  const selectedProject = taskboard?.projects.find((p) => p.id === selectedProjectId);
  const canManageSelected = selectedProject?.canManage ?? false;
  // Authority for the open task comes from the record itself, not from role flags.
  const editingCaps = editingTask?.capabilities ?? NO_CAPABILITIES;

  const filters = useMemo(() => taskQueryFilters(urlState), [urlState]);
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    isError: tasksError,
    refetch: refetchTasks,
  } = useProjectTasks(selectedProjectId ?? "", filters);
  const typedTasks = tasks as Task[];

  const createTaskMutation = useCreateTask(selectedProjectId ?? "");
  const updateTaskMutation = useUpdateTask(selectedProjectId ?? "");
  const deleteTaskMutation = useDeleteTask(selectedProjectId ?? "");

  const openEditTask = useCallback((task: Task) => {
    setEditTask({
      title: task.title,
      titleHi: task.titleHi ?? "",
      description: task.description ?? "",
      priority: task.priority,
      status: task.status,
      assigneeUserId: task.assigneeUserId ?? "",
      assigneeName: task.assigneeName ?? "",
      dueDate: toCalendarDate(task.dueDate),
    });
    setEditingTask(task);
  }, []);

  // Deep link from a reminder: ?projectId=…&taskId=… opens that exact task once
  // its project's tasks have loaded.
  const consumedDeepLink = useRef<string | null>(null);
  useEffect(() => {
    if (!urlState.taskId || tasksLoading) return;
    if (consumedDeepLink.current === urlState.taskId) return;
    const target = typedTasks.find((task) => task.id === urlState.taskId);
    if (!target) return;
    consumedDeepLink.current = urlState.taskId;
    openEditTask(target);
  }, [urlState.taskId, tasksLoading, typedTasks, openEditTask]);

  const handleCreateProject = useCallback(async () => {
    if (!newProject.name.trim() || createProjectMutation.isPending) return;
    try {
      const result = await createProjectMutation.mutateAsync({
        name: newProject.name.trim(),
        nameHi: newProject.nameHi.trim() || undefined,
        description: newProject.description.trim() || undefined,
      });
      patchUrl({ projectId: result.id, taskId: null });
      setShowCreateProject(false);
      setNewProject({ name: "", nameHi: "", description: "" });
      addToast(t("Project created!", "परियोजना बनाई गई!"), "success");
    } catch {
      addToast(t("Failed to create project", "परियोजना बनाने में विफल"), "error");
    }
  }, [newProject, createProjectMutation, t, addToast, patchUrl]);

  const handleUpdateProject = useCallback(async () => {
    if (!editProject.name.trim() || !selectedProjectId || updateProjectMutation.isPending) return;
    try {
      await updateProjectMutation.mutateAsync({
        projectId: selectedProjectId,
        input: {
          name: editProject.name.trim(),
          nameHi: editProject.nameHi.trim() || undefined,
          description: editProject.description.trim() || undefined,
          status: editProject.status,
          deadline: editProject.deadline || null,
        },
      });
      setShowEditProject(false);
      addToast(t("Project updated!", "परियोजना अद्यतन की गई!"), "success");
    } catch (error) {
      addToast(
        t("Failed to update project", "परियोजना अद्यतन करने में विफल"),
        "error",
        error instanceof Error ? error.message : undefined,
      );
    }
  }, [editProject, selectedProjectId, updateProjectMutation, t, addToast]);

  const handleCreateTask = useCallback(async () => {
    if (!newTask.title.trim() || !selectedProjectId || createTaskMutation.isPending) return;
    try {
      await createTaskMutation.mutateAsync({
        title: newTask.title.trim(),
        titleHi: newTask.titleHi.trim() || undefined,
        description: newTask.description.trim() || undefined,
        priority: newTask.priority,
        assigneeUserId: newTask.assigneeUserId || undefined,
        dueDate: newTask.dueDate || undefined,
      });
      setShowCreateTask(false);
      setNewTask({ title: "", titleHi: "", description: "", priority: "medium", assigneeUserId: "", assigneeName: "", dueDate: "" });
      addToast(t("Task added!", "कार्य जोड़ा गया!"), "success");
    } catch (error) {
      addToast(
        t("Failed to create task", "कार्य बनाने में विफल"),
        "error",
        error instanceof Error ? error.message : undefined,
      );
    }
  }, [newTask, selectedProjectId, createTaskMutation, t, addToast]);

  /**
   * Send only what actually changed, and only what this viewer is allowed to
   * change. Sending the whole form made every save look like a detail edit, so
   * an assignee reporting progress on somebody else's task was refused for
   * lacking detail-edit authority on fields they had not touched.
   */
  const handleUpdateTask = useCallback(async () => {
    if (!editingTask || !selectedProjectId || updateTaskMutation.isPending) return;
    const caps = editingTask.capabilities ?? NO_CAPABILITIES;

    const input: Record<string, unknown> = {};

    if (caps.canEditDetails) {
      if (!editTask.title.trim()) return;
      if (editTask.title.trim() !== editingTask.title) input.title = editTask.title.trim();
      if (editTask.titleHi.trim() !== (editingTask.titleHi ?? "")) {
        input.titleHi = editTask.titleHi.trim() || undefined;
      }
      if (editTask.description.trim() !== (editingTask.description ?? "")) {
        input.description = editTask.description.trim() || undefined;
      }
      if (editTask.priority !== editingTask.priority) input.priority = editTask.priority;
      if (editTask.dueDate !== toCalendarDate(editingTask.dueDate)) {
        // An empty box clears the date; null survives JSON where undefined does not.
        input.dueDate = editTask.dueDate || null;
      }
    }

    if (caps.canChangeStatus && editTask.status !== editingTask.status) {
      input.status = editTask.status;
    }

    if (caps.canReassign && editTask.assigneeUserId !== (editingTask.assigneeUserId ?? "")) {
      input.assigneeUserId = editTask.assigneeUserId || null;
    }

    if (Object.keys(input).length === 0) {
      setEditingTask(null);
      return;
    }

    try {
      await updateTaskMutation.mutateAsync({ taskId: editingTask.id, input });
      setEditingTask(null);
      addToast(t("Task updated!", "कार्य अद्यतन किया गया!"), "success");
    } catch (error) {
      addToast(
        t("Failed to update task", "कार्य अद्यतन करने में विफल"),
        "error",
        error instanceof Error ? error.message : undefined,
      );
    }
  }, [editTask, editingTask, selectedProjectId, updateTaskMutation, t, addToast]);

  const handleStatusChange = useCallback(async (taskId: string, status: string) => {
    try {
      await updateTaskMutation.mutateAsync({ taskId, input: { status } });
      if (status === "done") {
        const remaining = typedTasks.filter((tk) => tk.id !== taskId && tk.status !== "done").length;
        addToast(
          t("Task completed!", "कार्य पूर्ण!"),
          "success",
          remaining > 0
            ? t(`${remaining} task(s) still pending in this project`, `${remaining} कार्य इस परियोजना में अब भी लंबित`)
            : t("All tasks in this project are done.", "इस परियोजना के सभी कार्य पूर्ण।"),
        );
      }
    } catch (error) {
      addToast(
        t("Failed to update task", "कार्य अद्यतन करने में विफल"),
        "error",
        error instanceof Error ? error.message : undefined,
      );
    }
  }, [updateTaskMutation, addToast, t, typedTasks]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteTaskMutation.mutateAsync(taskId);
      addToast(t("Task deleted", "कार्य हटाया गया"), "success");
    } catch (error) {
      addToast(
        t("Failed to delete task", "कार्य हटाने में विफल"),
        "error",
        error instanceof Error ? error.message : undefined,
      );
    }
  }, [deleteTaskMutation, addToast, t]);

  /** Archive is the default. Permanent deletion is confirmed separately. */
  const handleArchiveProject = useCallback(async (projectId: string) => {
    try {
      await removeProjectMutation.mutateAsync({ projectId });
      if (selectedProjectId === projectId) patchUrl({ projectId: null, taskId: null });
      addToast(t("Project archived", "परियोजना संग्रहीत"), "success");
    } catch (error) {
      addToast(
        t("Failed to archive project", "परियोजना संग्रहीत करने में विफल"),
        "error",
        error instanceof Error ? error.message : undefined,
      );
    }
  }, [removeProjectMutation, selectedProjectId, addToast, t, patchUrl]);

  const handleConfirmPermanentDelete = useCallback(async () => {
    if (!pendingRemoval) return;
    try {
      await removeProjectMutation.mutateAsync({
        projectId: pendingRemoval.id,
        hardDelete: true,
        expectedTaskCount: pendingRemoval.taskCount,
      });
      if (selectedProjectId === pendingRemoval.id) patchUrl({ projectId: null, taskId: null });
      setPendingRemoval(null);
      addToast(t("Project permanently deleted", "परियोजना स्थायी रूप से हटाई गई"), "success");
    } catch (error) {
      addToast(
        t("Failed to delete project", "परियोजना हटाने में विफल"),
        "error",
        error instanceof Error ? error.message : undefined,
      );
    }
  }, [pendingRemoval, removeProjectMutation, selectedProjectId, addToast, t, patchUrl]);

  const openEditProject = useCallback(() => {
    if (!selectedProject) return;
    setEditProject({
      name: selectedProject.name,
      nameHi: selectedProject.nameHi ?? "",
      description: "",
      status: selectedProject.status,
      deadline: toCalendarDate(selectedProject.deadline),
    });
    setShowEditProject(true);
  }, [selectedProject]);

  const getTasksByStatus = (status: string) => typedTasks.filter((task) => task.status === status);

  const filtersActive = hasActiveFilters(urlState);
  const myTasks = myTasksQuery.data ?? taskboard?.myTasks ?? [];

  return (
    <Card id="task-board" className="mt-6 scroll-mt-24">
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <ListTodo className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <CardTitle className="text-lg font-semibold">{t("Task Board", "कार्य बोर्ड")}</CardTitle>
          {selectedProject && urlState.view === "board" && (
            <Badge variant="outline" className="max-w-[12rem] truncate text-xs" title={selectedProject.name}>
              {selectedProject.name}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {permissions.canCreateProject && (
            <Button variant="outline" size="sm" onClick={() => setShowCreateProject(true)}>
              <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
              {t("Project", "परियोजना")}
            </Button>
          )}
          {selectedProjectId && canManageSelected && urlState.view === "board" && (
            <Button size="sm" onClick={() => setShowCreateTask(true)}>
              <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
              {t("Task", "कार्य")}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* View switch — the board, or everything assigned to me across projects. */}
        <div className="mb-4 flex flex-wrap gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label={t("Task views", "कार्य दृश्य")}>
          <button
            role="tab"
            aria-selected={urlState.view === "board"}
            onClick={() => patchUrl({ view: "board", taskId: null })}
            className={`min-h-[36px] flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              urlState.view === "board" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("Projects", "परियोजनाएँ")}
          </button>
          <button
            role="tab"
            aria-selected={urlState.view === "mine"}
            onClick={() => patchUrl({ view: "mine", taskId: null })}
            className={`min-h-[36px] flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              urlState.view === "mine" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("My tasks", "मेरे कार्य")}
            {myTasks.length > 0 && (
              <span className="ml-1.5 text-xs opacity-70">{myTasks.length}</span>
            )}
          </button>
        </div>

        {urlState.view === "mine" ? (
          <MyTasksView
            tasks={myTasks}
            isLoading={myTasksQuery.isLoading}
            isError={myTasksQuery.isError}
            onRetry={() => void myTasksQuery.refetch()}
            onOpen={(task) => patchUrl({ view: "board", projectId: task.projectId, taskId: task.id })}
            lang={lang}
            t={t}
          />
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <span className="sr-only">{t("Loading task board…", "कार्य बोर्ड लोड हो रहा है…")}</span>
          </div>
        ) : isError ? (
          <div className="py-8 text-center" role="alert">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-destructive opacity-50" aria-hidden="true" />
            <p className="text-sm text-destructive">
              {t("Failed to load task board", "कार्य बोर्ड लोड करने में विफल")}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetchBoard()}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              {t("Try again", "पुनः प्रयास करें")}
            </Button>
          </div>
        ) : (
          <>
            {taskboard && taskboard.projects.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {taskboard.projects.map((project) => {
                  const isSelected = selectedProjectId === project.id;
                  const total =
                    project.taskCounts.todo + project.taskCounts.in_progress +
                    project.taskCounts.done + project.taskCounts.blocked;
                  return (
                    <div key={project.id} className="flex max-w-full items-center gap-1">
                      <button
                        onClick={() => patchUrl({ projectId: isSelected ? null : project.id, taskId: null })}
                        aria-pressed={isSelected}
                        className={`min-h-[36px] max-w-[15rem] rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"
                        }`}
                      >
                        <span className="line-clamp-1 break-words">{project.name}</span>
                        <span className="ml-2 text-xs opacity-70">{total}</span>
                      </button>
                      {isSelected && project.canManage && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditProject(); }}
                            className="rounded p-1.5 transition-colors hover:bg-muted"
                            aria-label={t("Edit project", "परियोजना संपादित करें")}
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); void handleArchiveProject(project.id); }}
                            className="rounded p-1.5 transition-colors hover:bg-muted"
                            aria-label={t("Archive project", "परियोजना संग्रहीत करें")}
                            title={t("Archive project", "परियोजना संग्रहीत करें")}
                          >
                            <Archive className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingRemoval({ id: project.id, name: project.name, taskCount: total });
                            }}
                            className="rounded p-1.5 transition-colors hover:bg-muted"
                            aria-label={t("Delete project permanently", "परियोजना स्थायी रूप से हटाएँ")}
                            title={t("Delete project permanently", "परियोजना स्थायी रूप से हटाएँ")}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive/60 hover:text-destructive" aria-hidden="true" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {taskboard && taskboard.projects.length === 0 && !showCreateProject && (
              <div className="py-8 text-center text-muted-foreground">
                <FolderOpen className="mx-auto mb-2 h-8 w-8 opacity-50" aria-hidden="true" />
                <p className="text-sm">
                  {permissions.canCreateProject
                    ? t(
                        "No projects yet. Create your first project to get started.",
                        "अभी तक कोई परियोजना नहीं। शुरू करने के लिए अपनी पहली परियोजना बनाएँ।",
                      )
                    : t(
                        "No projects are within your scope yet. Work assigned to you appears under My tasks.",
                        "आपके क्षेत्र में अभी कोई परियोजना नहीं। आपको सौंपा गया कार्य 'मेरे कार्य' में दिखेगा।",
                      )}
                </p>
              </div>
            )}

            {taskboard && taskboard.unassignedTasks.length > 0 && (
              <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    {t(
                      `${taskboard.unassignedTasks.length} task(s) need assignment`,
                      `${taskboard.unassignedTasks.length} कार्य जिम्मेदारी चाहते हैं`,
                    )}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {taskboard.unassignedTasks.slice(0, 6).map((ut) => (
                    <div key={ut.id} className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge className={`px-1.5 py-0 text-[9px] font-medium ${PRIORITY_CONFIG[ut.priority as keyof typeof PRIORITY_CONFIG]?.color ?? ""}`}>
                        {t(
                          PRIORITY_CONFIG[ut.priority as keyof typeof PRIORITY_CONFIG]?.label ?? ut.priority,
                          PRIORITY_CONFIG[ut.priority as keyof typeof PRIORITY_CONFIG]?.labelHi ?? ut.priority,
                        )}
                      </Badge>
                      <span className="min-w-0 flex-1 break-words font-medium text-foreground/80">
                        {lang === "hi" && ut.titleHi ? ut.titleHi : ut.title}
                      </span>
                      {ut.projectName && (
                        <Badge variant="outline" className="max-w-[8rem] shrink-0 truncate px-1.5 py-0 text-[9px]">
                          {ut.projectName}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 shrink-0 px-2 text-[10px]"
                        onClick={() => patchUrl({ projectId: ut.projectId, taskId: ut.id })}
                      >
                        {t("Open", "खोलें")}
                      </Button>
                    </div>
                  ))}
                  {taskboard.unassignedTasks.length > 6 && (
                    <p className="pl-1 text-[10px] text-muted-foreground">
                      {t(`+ ${taskboard.unassignedTasks.length - 6} more`, `+ ${taskboard.unassignedTasks.length - 6} और`)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedProjectId && (
              <>
                {/* Filters, persisted in the URL alongside the selection. */}
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                      className="pl-8"
                      placeholder={t("Search tasks…", "कार्य खोजें…")}
                      value={searchDraft}
                      onChange={(e) => setSearchDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") patchUrl({ search: searchDraft, taskId: null }, { replace: true });
                      }}
                      onBlur={() => {
                        if (searchDraft !== urlState.search) {
                          patchUrl({ search: searchDraft, taskId: null }, { replace: true });
                        }
                      }}
                      aria-label={t("Search tasks", "कार्य खोजें")}
                    />
                  </div>
                  <Select
                    value={urlState.status ?? "all"}
                    onValueChange={(v) => patchUrl({ status: v === "all" ? null : v, taskId: null }, { replace: true })}
                  >
                    <SelectTrigger className="sm:w-40" aria-label={t("Filter by status", "स्थिति से छाँटें")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("All statuses", "सभी स्थितियाँ")}</SelectItem>
                      {STATUS_COLUMNS.map((c) => (
                        <SelectItem key={c.key} value={c.key}>{t(c.label, c.labelHi)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={urlState.priority ?? "all"}
                    onValueChange={(v) => patchUrl({ priority: v === "all" ? null : v, taskId: null }, { replace: true })}
                  >
                    <SelectTrigger className="sm:w-40" aria-label={t("Filter by priority", "प्राथमिकता से छाँटें")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("All priorities", "सभी प्राथमिकताएँ")}</SelectItem>
                      {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{t(cfg.label, cfg.labelHi)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filtersActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => patchUrl({ status: null, priority: null, search: "", taskId: null }, { replace: true })}
                    >
                      <X className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                      {t("Clear", "साफ़ करें")}
                    </Button>
                  )}
                </div>

                {tasksLoading ? (
                  <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    <span className="sr-only">{t("Loading tasks…", "कार्य लोड हो रहे हैं…")}</span>
                  </div>
                ) : tasksError ? (
                  <div className="py-8 text-center" role="alert">
                    <AlertCircle className="mx-auto mb-2 h-8 w-8 text-destructive opacity-50" aria-hidden="true" />
                    <p className="text-sm text-destructive">
                      {t("Failed to load tasks for this project", "इस परियोजना के कार्य लोड करने में विफल")}
                    </p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetchTasks()}>
                      <RefreshCw className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                      {t("Try again", "पुनः प्रयास करें")}
                    </Button>
                  </div>
                ) : typedTasks.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    {filtersActive ? (
                      <>
                        <Filter className="mx-auto mb-2 h-8 w-8 opacity-50" aria-hidden="true" />
                        <p className="text-sm">
                          {t("No task matches these filters.", "इन छाँटों से कोई कार्य मेल नहीं खाता।")}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => patchUrl({ status: null, priority: null, search: "", taskId: null }, { replace: true })}
                        >
                          {t("Clear filters", "छाँट हटाएँ")}
                        </Button>
                      </>
                    ) : (
                      <p className="text-sm">
                        {canManageSelected
                          ? t("No tasks yet. Add a task to get started.", "अभी तक कोई कार्य नहीं। आरंभ करने के लिए एक कार्य जोड़ें।")
                          : t("You have no tasks in this project.", "इस परियोजना में आपका कोई कार्य नहीं है।")}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {STATUS_COLUMNS.map((column) => {
                      const tasksInColumn = getTasksByStatus(column.key);
                      const Icon = column.icon;
                      return (
                        <div key={column.key} className="space-y-2">
                          <div className="flex items-center gap-1.5 px-1">
                            <Icon className={`h-4 w-4 ${column.color}`} aria-hidden="true" />
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              {t(column.label, column.labelHi)}
                            </span>
                            <span className="ml-auto text-xs text-muted-foreground">{tasksInColumn.length}</span>
                          </div>
                          <div className="min-h-[120px] space-y-2">
                            <AnimatePresence>
                              {tasksInColumn.map((task) => {
                                const nextStatus = column.key === "todo" ? "in_progress"
                                  : column.key === "in_progress" ? "done"
                                  : column.key === "done" ? "todo" : "in_progress";
                                const isDeepLinked = urlState.taskId === task.id;
                                return (
                                  <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`cursor-pointer space-y-2 rounded-lg border bg-card p-3 transition-shadow hover:shadow-sm ${
                                      isDeepLinked ? "ring-2 ring-primary" : ""
                                    }`}
                                    onClick={() => openEditTask(task)}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="min-w-0 flex-1 break-words text-sm font-medium leading-snug">
                                        {lang === "hi" && task.titleHi ? task.titleHi : task.title}
                                      </p>
                                      <div className="flex shrink-0 items-center gap-1">
                                        {(task.capabilities?.canChangeStatus ?? false) && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); void handleStatusChange(task.id, nextStatus); }}
                                            className="rounded p-1.5 transition-colors hover:bg-muted"
                                            aria-label={t("Advance status", "स्थिति बढ़ाएँ")}
                                            title={t("Advance status", "स्थिति बढ़ाएँ")}
                                          >
                                            <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                                          </button>
                                        )}
                                        {(task.capabilities?.canDelete ?? false) && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); void handleDeleteTask(task.id); }}
                                            className="rounded p-1.5 transition-colors hover:bg-muted"
                                            aria-label={t("Delete task", "कार्य हटाएँ")}
                                          >
                                            <Trash2 className="h-3.5 w-3.5 text-destructive/60 hover:text-destructive" aria-hidden="true" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge className={`px-1.5 py-0 text-[10px] font-medium ${PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]?.color ?? ""}`}>
                                        {t(
                                          PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]?.label ?? task.priority,
                                          PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]?.labelHi ?? task.priority,
                                        )}
                                      </Badge>
                                      {task.assigneeName && (
                                        <span className="flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground">
                                          <User className="h-3 w-3 shrink-0" aria-hidden="true" />
                                          <span className="break-words">{task.assigneeName}</span>
                                        </span>
                                      )}
                                      {task.dueDate && (
                                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                          <Calendar className="h-3 w-3" aria-hidden="true" />
                                          {new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Create Project Dialog */}
        <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Create Project", "परियोजना बनाएँ")}</DialogTitle>
              <DialogDescription>
                {t("A project groups related tasks together.", "एक परियोजना संबंधित कार्यों को एक साथ समूहित करती है।")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-project-name">{t("Project Name", "परियोजना का नाम")}</Label>
                <Input
                  id="new-project-name"
                  value={newProject.name}
                  onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))}
                  placeholder={t("e.g. Quarterly Review", "जैसे त्रैमासिक समीक्षा")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-project-name-hi">{t("Name (Hindi)", "नाम (हिंदी)")}</Label>
                <Input
                  id="new-project-name-hi"
                  value={newProject.nameHi}
                  onChange={(e) => setNewProject((p) => ({ ...p, nameHi: e.target.value }))}
                  placeholder={t("Optional", "वैकल्पिक")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-project-desc">{t("Description", "विवरण")}</Label>
                <Textarea
                  id="new-project-desc"
                  value={newProject.description}
                  onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setShowCreateProject(false)}>
                  {t("Cancel", "रद्द करें")}
                </Button>
                <Button onClick={handleCreateProject} disabled={!newProject.name.trim() || createProjectMutation.isPending}>
                  {createProjectMutation.isPending ? t("Creating…", "बनाया जा रहा है…") : t("Create", "बनाएँ")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Project Dialog */}
        <Dialog open={showEditProject} onOpenChange={setShowEditProject}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Edit Project", "परियोजना संपादित करें")}</DialogTitle>
              <DialogDescription>
                {t("Update project details and status.", "परियोजना विवरण और स्थिति अपडेट करें।")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-project-name">{t("Project Name", "परियोजना का नाम")}</Label>
                <Input
                  id="edit-project-name"
                  value={editProject.name}
                  onChange={(e) => setEditProject((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-project-name-hi">{t("Name (Hindi)", "नाम (हिंदी)")}</Label>
                <Input
                  id="edit-project-name-hi"
                  value={editProject.nameHi}
                  onChange={(e) => setEditProject((p) => ({ ...p, nameHi: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-project-desc">{t("Description", "विवरण")}</Label>
                <Textarea
                  id="edit-project-desc"
                  value={editProject.description}
                  onChange={(e) => setEditProject((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("Status", "स्थिति")}</Label>
                <Select value={editProject.status} onValueChange={(v) => setEditProject((p) => ({ ...p, status: v }))}>
                  <SelectTrigger aria-label={t("Project status", "परियोजना स्थिति")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{t(s.label, s.labelHi)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-project-deadline">{t("Deadline", "समय सीमा")}</Label>
                <Input
                  id="edit-project-deadline"
                  type="date"
                  value={editProject.deadline}
                  onChange={(e) => setEditProject((p) => ({ ...p, deadline: e.target.value }))}
                />
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setShowEditProject(false)}>
                  {t("Cancel", "रद्द करें")}
                </Button>
                <Button onClick={handleUpdateProject} disabled={!editProject.name.trim() || updateProjectMutation.isPending}>
                  {updateProjectMutation.isPending ? t("Saving…", "सहेजा जा रहा है…") : t("Save", "सहेजें")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Permanent deletion — explicit affected-record confirmation */}
        <Dialog open={!!pendingRemoval} onOpenChange={(open) => { if (!open) setPendingRemoval(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Delete project permanently?", "परियोजना स्थायी रूप से हटाएँ?")}</DialogTitle>
              <DialogDescription>
                {t(
                  "This cannot be undone. Archiving keeps the record and is usually the right choice.",
                  "यह पूर्ववत नहीं किया जा सकता। संग्रह करने से अभिलेख बना रहता है और प्रायः वही उचित है।",
                )}
              </DialogDescription>
            </DialogHeader>
            {pendingRemoval && (
              <div className="space-y-4">
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                  <p className="break-words text-sm font-medium">{pendingRemoval.name}</p>
                  <p className="mt-1 text-sm text-destructive">
                    {t(
                      `${pendingRemoval.taskCount} task(s) will be destroyed with it.`,
                      `इसके साथ ${pendingRemoval.taskCount} कार्य भी नष्ट हो जाएँगे।`,
                    )}
                  </p>
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => setPendingRemoval(null)}>
                    {t("Cancel", "रद्द करें")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const id = pendingRemoval.id;
                      setPendingRemoval(null);
                      void handleArchiveProject(id);
                    }}
                  >
                    <Archive className="mr-1 h-4 w-4" aria-hidden="true" />
                    {t("Archive instead", "इसके बजाय संग्रह करें")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleConfirmPermanentDelete}
                    disabled={removeProjectMutation.isPending}
                  >
                    {removeProjectMutation.isPending
                      ? t("Deleting…", "हटाया जा रहा है…")
                      : t(
                          `Delete ${pendingRemoval.taskCount} task(s)`,
                          `${pendingRemoval.taskCount} कार्य हटाएँ`,
                        )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Task Dialog */}
        <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Add Task", "कार्य जोड़ें")}</DialogTitle>
              <DialogDescription>
                {t("Add a new task to the current project.", "वर्तमान परियोजना में एक नया कार्य जोड़ें।")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-task-title">{t("Task Title", "कार्य का शीर्षक")}</Label>
                <Input
                  id="new-task-title"
                  value={newTask.title}
                  onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                  placeholder={t("e.g. Prepare agenda", "जैसे एजेंडा तैयार करें")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-task-title-hi">{t("Title (Hindi)", "शीर्षक (हिंदी)")}</Label>
                <Input
                  id="new-task-title-hi"
                  value={newTask.titleHi}
                  onChange={(e) => setNewTask((p) => ({ ...p, titleHi: e.target.value }))}
                  placeholder={t("Optional", "वैकल्पिक")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-task-desc">{t("Description", "विवरण")}</Label>
                <Textarea
                  id="new-task-desc"
                  value={newTask.description}
                  onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder={t("Optional", "वैकल्पिक")}
                />
              </div>
              <div className="space-y-2">
                <Label id="new-task-assignee-label">{t("Assignee", "जिम्मेदार")}</Label>
                <AssigneePicker
                  labelId="new-task-assignee-label"
                  canAssign={permissions.canAssignTask}
                  value={newTask.assigneeUserId}
                  selectedName={newTask.assigneeName}
                  onChange={(id, name) => setNewTask((p) => ({ ...p, assigneeUserId: id, assigneeName: name }))}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("Priority", "प्राथमिकता")}</Label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask((p) => ({ ...p, priority: v }))}>
                    <SelectTrigger aria-label={t("Priority", "प्राथमिकता")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{t(cfg.label, cfg.labelHi)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-task-due">{t("Due Date", "नियत तारीख")}</Label>
                  <Input
                    id="new-task-due"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask((p) => ({ ...p, dueDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setShowCreateTask(false)}>
                  {t("Cancel", "रद्द करें")}
                </Button>
                <Button onClick={handleCreateTask} disabled={!newTask.title.trim() || createTaskMutation.isPending}>
                  {createTaskMutation.isPending ? t("Adding…", "जोड़ा जा रहा है…") : t("Add", "जोड़ें")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Task Dialog */}
        <Dialog
          open={!!editingTask}
          onOpenChange={(open) => {
            if (!open) {
              setEditingTask(null);
              if (urlState.taskId) patchUrl({ taskId: null }, { replace: true });
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Edit Task", "कार्य संपादित करें")}</DialogTitle>
              <DialogDescription>
                {t("Update task details, status, or assignment.", "कार्य विवरण, स्थिति या जिम्मेदारी अपडेट करें।")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-task-title">{t("Task Title", "कार्य का शीर्षक")}</Label>
                <Input
                  id="edit-task-title"
                  value={editTask.title}
                  onChange={(e) => setEditTask((p) => ({ ...p, title: e.target.value }))}
                  disabled={!editingCaps.canEditDetails}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-title-hi">{t("Title (Hindi)", "शीर्षक (हिंदी)")}</Label>
                <Input
                  id="edit-task-title-hi"
                  value={editTask.titleHi}
                  onChange={(e) => setEditTask((p) => ({ ...p, titleHi: e.target.value }))}
                  disabled={!editingCaps.canEditDetails}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-desc">{t("Description", "विवरण")}</Label>
                <Textarea
                  id="edit-task-desc"
                  value={editTask.description}
                  onChange={(e) => setEditTask((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  disabled={!editingCaps.canEditDetails}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("Status", "स्थिति")}</Label>
                <Select
                  value={editTask.status}
                  onValueChange={(v) => setEditTask((p) => ({ ...p, status: v }))}
                  disabled={!editingCaps.canChangeStatus}
                >
                  <SelectTrigger aria-label={t("Task status", "कार्य स्थिति")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_COLUMNS.map((col) => (
                      <SelectItem key={col.key} value={col.key}>{t(col.label, col.labelHi)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!editingCaps.canEditDetails && editingCaps.canChangeStatus && (
                <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground" role="note">
                  {t(
                    "This task was set by someone else. You can report its status; its details are theirs to change.",
                    "यह कार्य किसी और ने निर्धारित किया है। आप इसकी स्थिति बता सकते हैं; विवरण बदलना उनका अधिकार है।",
                  )}
                </p>
              )}
              <div className="space-y-2">
                <Label id="edit-task-assignee-label">{t("Assignee", "जिम्मेदार")}</Label>
                <AssigneePicker
                  labelId="edit-task-assignee-label"
                  canAssign={editingCaps.canReassign}
                  value={editTask.assigneeUserId}
                  selectedName={editTask.assigneeName}
                  onChange={(id, name) => setEditTask((p) => ({ ...p, assigneeUserId: id, assigneeName: name }))}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("Priority", "प्राथमिकता")}</Label>
                  <Select
                    value={editTask.priority}
                    onValueChange={(v) => setEditTask((p) => ({ ...p, priority: v }))}
                    disabled={!editingCaps.canEditDetails}
                  >
                    <SelectTrigger aria-label={t("Priority", "प्राथमिकता")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{t(cfg.label, cfg.labelHi)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-task-due">{t("Due Date", "नियत तारीख")}</Label>
                  <Input
                    id="edit-task-due"
                    type="date"
                    value={editTask.dueDate}
                    onChange={(e) => setEditTask((p) => ({ ...p, dueDate: e.target.value }))}
                    disabled={!editingCaps.canEditDetails}
                  />
                </div>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setEditingTask(null)}>
                  {t("Cancel", "रद्द करें")}
                </Button>
                <Button
                  onClick={handleUpdateTask}
                  disabled={
                    updateTaskMutation.isPending ||
                    (editingCaps.canEditDetails && !editTask.title.trim()) ||
                    (!editingCaps.canEditDetails && !editingCaps.canChangeStatus && !editingCaps.canReassign)
                  }
                >
                  {updateTaskMutation.isPending ? t("Saving…", "सहेजा जा रहा है…") : t("Save", "सहेजें")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ── My tasks across projects ─────────────────────────────────────────────────

interface MyTasksViewProps {
  tasks: Array<{
    id: string; projectId: string; projectName: string; projectNameHi?: string | null;
    title: string; titleHi?: string | null; status: string; priority: string; dueDate?: string | null;
  }>;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onOpen: (task: { id: string; projectId: string }) => void;
  lang: string;
  t: (en: string, hi: string) => string;
}

function MyTasksView({ tasks, isLoading, isError, onRetry, onOpen, lang, t }: MyTasksViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <span className="sr-only">{t("Loading your tasks…", "आपके कार्य लोड हो रहे हैं…")}</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 text-center" role="alert">
        <AlertCircle className="mx-auto mb-2 h-8 w-8 text-destructive opacity-50" aria-hidden="true" />
        <p className="text-sm text-destructive">
          {t("Your tasks could not be loaded.", "आपके कार्य लोड नहीं हो सके।")}
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          {t("Try again", "पुनः प्रयास करें")}
        </Button>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 opacity-50" aria-hidden="true" />
        <p className="text-sm">{t("No tasks are assigned to you.", "आपको कोई कार्य नहीं सौंपा गया है।")}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li key={task.id}>
          <button
            onClick={() => onOpen(task)}
            className="flex w-full flex-col gap-2 rounded-lg border bg-card p-3 text-left transition-shadow hover:shadow-sm sm:flex-row sm:items-center"
          >
            <span className="min-w-0 flex-1">
              <span className="block break-words text-sm font-medium">
                {lang === "hi" && task.titleHi ? task.titleHi : task.title}
              </span>
              <span className="mt-0.5 block break-words text-xs text-muted-foreground">
                {lang === "hi" && task.projectNameHi ? task.projectNameHi : task.projectName}
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <Badge className={`px-1.5 py-0 text-[10px] font-medium ${PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]?.color ?? ""}`}>
                {t(
                  PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]?.label ?? task.priority,
                  PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]?.labelHi ?? task.priority,
                )}
              </Badge>
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                {t(
                  STATUS_COLUMNS.find((c) => c.key === task.status)?.label ?? task.status,
                  STATUS_COLUMNS.find((c) => c.key === task.status)?.labelHi ?? task.status,
                )}
              </Badge>
              {task.dueDate && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
