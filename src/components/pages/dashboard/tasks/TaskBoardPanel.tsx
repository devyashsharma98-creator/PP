"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ListTodo, User, Calendar, ArrowUp, Trash2, CheckCircle2, Circle, Clock, AlertCircle, Pencil, Search, X } from "lucide-react";

import { useAppContext } from "@/context/AppContext";
import { useTaskboard, useCreateProject, useDeleteProject, useProjectTasks, useCreateTask, useUpdateTask, useDeleteTask, useUpdateProject } from "@/hooks/api/use-tasks";
import { useUsers } from "@/hooks/api/use-users";
import { useT } from "@/lib/useT";
import { useToast } from "@/components/ToastProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
}

interface UserOption {
  id: string;
  displayName: string | null;
}

export function TaskBoardPanel() {
  const { permissions, lang } = useAppContext();
  const t = useT();
  const { addToast } = useToast();

  const { data: taskboard, isLoading, isError } = useTaskboard();
  const createProjectMutation = useCreateProject();
  const deleteProjectMutation = useDeleteProject();
  const updateProjectMutation = useUpdateProject();

  const { data: users = [] } = useUsers({ limit: 100 });

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [assigneeSearch, setAssigneeSearch] = useState("");

  const [newProject, setNewProject] = useState({ name: "", nameHi: "", description: "" });
  const [newTask, setNewTask] = useState({ title: "", titleHi: "", description: "", priority: "medium" as string, assigneeUserId: "", dueDate: "" });
  const [editProject, setEditProject] = useState({ name: "", nameHi: "", description: "", status: "planned" as string, deadline: "" });
  const [editTask, setEditTask] = useState({ title: "", titleHi: "", description: "", priority: "medium" as string, status: "todo" as string, assigneeUserId: "", dueDate: "" });

  const selectedProject = taskboard?.projects.find((p) => p.id === selectedProjectId);

  const { data: tasks = [], isLoading: tasksLoading } = useProjectTasks(selectedProjectId ?? "", { limit: "100" });
  const typedTasks = tasks as Task[];

  const createTaskMutation = useCreateTask(selectedProjectId ?? "");
  const updateTaskMutation = useUpdateTask(selectedProjectId ?? "");
  const deleteTaskMutation = useDeleteTask(selectedProjectId ?? "");

  const filteredUsers = assigneeSearch
    ? users.filter((u: UserOption) => u.displayName?.toLowerCase().includes(assigneeSearch.toLowerCase()))
    : users;

  const handleCreateProject = useCallback(async () => {
    if (!newProject.name.trim() || createProjectMutation.isPending) return;
    try {
      const result = await createProjectMutation.mutateAsync({
        name: newProject.name.trim(),
        nameHi: newProject.nameHi.trim() || undefined,
        description: newProject.description.trim() || undefined,
      });
      setSelectedProjectId(result.id);
      setShowCreateProject(false);
      setNewProject({ name: "", nameHi: "", description: "" });
      addToast(t("Project created!", "परियोजना बनाई गई!"), "success");
    } catch {
      addToast(t("Failed to create project", "परियोजना बनाने में विफल"), "error");
    }
  }, [newProject, createProjectMutation, t, addToast]);

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
          deadline: editProject.deadline || undefined,
        },
      });
      setShowEditProject(false);
      addToast(t("Project updated!", "परियोजना अद्यतन की गई!"), "success");
    } catch {
      addToast(t("Failed to update project", "परियोजना अद्यतन करने में विफल"), "error");
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
      setNewTask({ title: "", titleHi: "", description: "", priority: "medium", assigneeUserId: "", dueDate: "" });
      setAssigneeSearch("");
      addToast(t("Task added!", "कार्य जोड़ा गया!"), "success");
    } catch {
      addToast(t("Failed to create task", "कार्य बनाने में विफल"), "error");
    }
  }, [newTask, selectedProjectId, createTaskMutation, t, addToast]);

  const handleUpdateTask = useCallback(async () => {
    if (!editTask.title.trim() || !editingTask || !selectedProjectId || updateTaskMutation.isPending) return;
    try {
      await updateTaskMutation.mutateAsync({
        taskId: editingTask.id,
        input: {
          title: editTask.title.trim(),
          titleHi: editTask.titleHi.trim() || undefined,
          description: editTask.description.trim() || undefined,
          priority: editTask.priority,
          status: editTask.status,
          assigneeUserId: editTask.assigneeUserId || undefined,
          dueDate: editTask.dueDate || undefined,
        },
      });
      setEditingTask(null);
      setAssigneeSearch("");
      addToast(t("Task updated!", "कार्य अद्यतन किया गया!"), "success");
    } catch {
      addToast(t("Failed to update task", "कार्य अद्यतन करने में विफल"), "error");
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
    } catch {
      addToast(t("Failed to update task", "कार्य अद्यतन करने में विफल"), "error");
    }
  }, [updateTaskMutation, addToast, t, typedTasks]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteTaskMutation.mutateAsync(taskId);
    } catch {
      addToast(t("Failed to delete task", "कार्य हटाने में विफल"), "error");
    }
  }, [deleteTaskMutation, addToast, t]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      await deleteProjectMutation.mutateAsync(projectId);
      if (selectedProjectId === projectId) setSelectedProjectId(null);
    } catch {
      addToast(t("Failed to delete project", "परियोजना हटाने में विफल"), "error");
    }
  }, [deleteProjectMutation, selectedProjectId, addToast, t]);

  const openEditTask = useCallback((task: Task) => {
    setEditTask({
      title: task.title,
      titleHi: task.titleHi ?? "",
      description: task.description ?? "",
      priority: task.priority,
      status: task.status,
      assigneeUserId: task.assigneeUserId ?? "",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });
    setEditingTask(task);
  }, []);

  const openEditProject = useCallback(() => {
    if (!selectedProject) return;
    setEditProject({
      name: selectedProject.name,
      nameHi: selectedProject.nameHi ?? "",
      description: "",
      status: selectedProject.status,
      deadline: selectedProject.deadline ? selectedProject.deadline.slice(0, 10) : "",
    });
    setShowEditProject(true);
  }, [selectedProject]);

  const getTasksByStatus = (status: string) =>
    typedTasks.filter((task) => task.status === status);

  return (
    <Card id="task-board" className="mt-6 scroll-mt-24">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">
            {t("Task Board", "कार्य बोर्ड")}
          </CardTitle>
          {selectedProject && (
            <Badge variant="outline" className="ml-2 text-xs">
              {selectedProject.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {permissions.canCreateProject && (
            <Button variant="outline" size="sm" onClick={() => setShowCreateProject(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {t("Project", "परियोजना")}
            </Button>
          )}
          {selectedProjectId && permissions.canCreateTask && (
            <Button size="sm" onClick={() => setShowCreateTask(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {t("Task", "कार्य")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-destructive">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("Failed to load task board", "कार्य बोर्ड लोड करने में विफल")}</p>
          </div>
        ) : (
          <>
            {taskboard && taskboard.projects.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {taskboard.projects.map((project) => (
                  <div key={project.id} className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedProjectId(
                        selectedProjectId === project.id ? null : project.id
                      )}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedProjectId === project.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-foreground"
                      }`}
                    >
                      <span>{project.name}</span>
                      <span className="ml-2 text-xs opacity-70">
                        {project.taskCounts.todo + project.taskCounts.in_progress + project.taskCounts.done + project.taskCounts.blocked}
                      </span>
                    </button>
                    {selectedProjectId === project.id && permissions.canUpdateProject && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditProject(); }}
                        className="p-1 rounded hover:bg-muted transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    )}
                    {selectedProjectId === project.id && permissions.canUpdateProject && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                        className="p-1 rounded hover:bg-muted transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive/60 hover:text-destructive" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {taskboard && taskboard.projects.length === 0 && !showCreateProject && (
              <div className="text-center py-8 text-muted-foreground">
                <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t("No projects yet. Create your first project to get started.", "अभी तक कोई परियोजना नहीं। शुरू करने के लिए अपनी पहली परियोजना बनाएँ।")}</p>
              </div>
            )}

            {taskboard && taskboard.unassignedTasks.length > 0 && (
              <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    {t(`${taskboard.unassignedTasks.length} task(s) need assignment`, `${taskboard.unassignedTasks.length} कार्य जिम्मेदारी चाहते हैं`)}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {taskboard.unassignedTasks.slice(0, 6).map((ut) => (
                    <div key={ut.id} className="flex items-center gap-2 text-xs">
                      <Badge className={`text-[9px] px-1.5 py-0 font-medium ${PRIORITY_CONFIG[ut.priority as keyof typeof PRIORITY_CONFIG]?.color ?? ""}`}>
                        {t(
                          PRIORITY_CONFIG[ut.priority as keyof typeof PRIORITY_CONFIG]?.label ?? ut.priority,
                          PRIORITY_CONFIG[ut.priority as keyof typeof PRIORITY_CONFIG]?.labelHi ?? ut.priority,
                        )}
                      </Badge>
                      <span className="font-medium text-foreground/80 truncate flex-1">
                        {lang === "hi" && ut.titleHi ? ut.titleHi : ut.title}
                      </span>
                      {ut.projectName && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">{ut.projectName}</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] shrink-0"
                        onClick={() => setSelectedProjectId(ut.projectId)}
                      >
                        {t("Open", "खोलें")}
                      </Button>
                    </div>
                  ))}
                  {taskboard.unassignedTasks.length > 6 && (
                    <p className="text-[10px] text-muted-foreground pl-1">
                      {t(`+ ${taskboard.unassignedTasks.length - 6} more`, `+ ${taskboard.unassignedTasks.length - 6} और`)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedProjectId && (
              tasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : typedTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">{t("No tasks yet. Add a task to get started.", "अभी तक कोई कार्य नहीं। आरंभ करने के लिए एक कार्य जोड़ें।")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {STATUS_COLUMNS.map((column) => {
                    const tasksInColumn = getTasksByStatus(column.key);
                    const Icon = column.icon;
                    return (
                      <div key={column.key} className="space-y-2">
                        <div className="flex items-center gap-1.5 px-1">
                          <Icon className={`h-4 w-4 ${column.color}`} />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t(column.label, column.labelHi)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">{tasksInColumn.length}</span>
                        </div>
                        <div className="space-y-2 min-h-[120px]">
                          <AnimatePresence>
                            {tasksInColumn.map((task) => {
                              const nextStatus = column.key === "todo" ? "in_progress" :
                                column.key === "in_progress" ? "done" :
                                column.key === "done" ? "todo" : "in_progress";
                              return (
                                <motion.div
                                  key={task.id}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="bg-card border rounded-lg p-3 space-y-2 hover:shadow-sm transition-shadow cursor-pointer"
                                  onClick={() => openEditTask(task)}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium leading-snug flex-1">
                                      {lang === "hi" && task.titleHi ? task.titleHi : task.title}
                                    </p>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {permissions.canUpdateTask && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, nextStatus); }}
                                          className="p-1 rounded hover:bg-muted transition-colors"
                                          title={t("Advance status", "स्थिति बढ़ाएँ")}
                                        >
                                          <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
                                        </button>
                                      )}
                                      {permissions.canUpdateTask && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                          className="p-1 rounded hover:bg-muted transition-colors"
                                        >
                                          <Trash2 className="h-3.5 w-3.5 text-destructive/60 hover:text-destructive" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className={`text-[10px] px-1.5 py-0 font-medium ${PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]?.color ?? ""}`}>
                                      {t(
                                        PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]?.label ?? task.priority,
                                        PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]?.labelHi ?? task.priority,
                                      )}
                                    </Badge>
                                    {task.assigneeName && (
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {task.assigneeName}
                                      </span>
                                    )}
                                    {task.dueDate && (
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
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
              )
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
                <Label>{t("Project Name", "परियोजना का नाम")}</Label>
                <Input
                  value={newProject.name}
                  onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))}
                  placeholder={t("e.g. Quarterly Review", "जैसे त्रैमासिक समीक्षा")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("Name (Hindi)", "नाम (हिंदी)")}</Label>
                <Input
                  value={newProject.nameHi}
                  onChange={(e) => setNewProject((p) => ({ ...p, nameHi: e.target.value }))}
                  placeholder={t("Optional", "वैकल्पिक")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("Description", "विवरण")}</Label>
                <Textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateProject(false)}>
                  {t("Cancel", "रद्द करें")}
                </Button>
                <Button onClick={handleCreateProject} disabled={!newProject.name.trim() || createProjectMutation.isPending}>
                  {t("Create", "बनाएँ")}
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
                <Label>{t("Project Name", "परियोजना का नाम")}</Label>
                <Input
                  value={editProject.name}
                  onChange={(e) => setEditProject((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("Name (Hindi)", "नाम (हिंदी)")}</Label>
                <Input
                  value={editProject.nameHi}
                  onChange={(e) => setEditProject((p) => ({ ...p, nameHi: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("Description", "विवरण")}</Label>
                <Textarea
                  value={editProject.description}
                  onChange={(e) => setEditProject((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("Status", "स्थिति")}</Label>
                <Select
                  value={editProject.status}
                  onValueChange={(v) => setEditProject((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {t(s.label, s.labelHi)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("Deadline", "समय सीमा")}</Label>
                <Input
                  type="date"
                  value={editProject.deadline}
                  onChange={(e) => setEditProject((p) => ({ ...p, deadline: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditProject(false)}>
                  {t("Cancel", "रद्द करें")}
                </Button>
                <Button onClick={handleUpdateProject} disabled={!editProject.name.trim() || updateProjectMutation.isPending}>
                  {t("Save", "सहेजें")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Task Dialog */}
        <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("Add Task", "कार्य जोड़ें")}</DialogTitle>
              <DialogDescription>
                {t("Add a new task to the current project.", "वर्तमान परियोजना में एक नया कार्य जोड़ें।")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("Task Title", "कार्य का शीर्षक")}</Label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                  placeholder={t("e.g. Prepare agenda", "जैसे एजेंडा तैयार करें")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("Title (Hindi)", "शीर्षक (हिंदी)")}</Label>
                <Input
                  value={newTask.titleHi}
                  onChange={(e) => setNewTask((p) => ({ ...p, titleHi: e.target.value }))}
                  placeholder={t("Optional", "वैकल्पिक")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("Description", "विवरण")}</Label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder={t("Optional", "वैकल्पिक")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("Assignee", "जिम्मेदार")}</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder={t("Search members...", "सदस्य खोजें...")}
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                  />
                  {newTask.assigneeUserId && (
                    <button
                      className="absolute right-2 top-2.5"
                      onClick={() => { setNewTask((p) => ({ ...p, assigneeUserId: "" })); setAssigneeSearch(""); }}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <div className="max-h-32 overflow-y-auto border rounded-md">
                  {filteredUsers.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">{t("No members found", "कोई सदस्य नहीं मिला")}</p>
                  ) : (
                    filteredUsers.map((user: UserOption) => (
                      <button
                        key={user.id}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors ${
                          newTask.assigneeUserId === user.id ? "bg-primary/10 font-medium" : ""
                        }`}
                        onClick={() => {
                          setNewTask((p) => ({ ...p, assigneeUserId: p.assigneeUserId === user.id ? "" : user.id }));
                          setAssigneeSearch(user.displayName ?? "");
                        }}
                      >
                        <User className="h-3 w-3 inline mr-2 text-muted-foreground" />
                        {user.displayName}
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Priority", "प्राथमिकता")}</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(v) => setNewTask((p) => ({ ...p, priority: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t("Low", "निम्न")}</SelectItem>
                      <SelectItem value="medium">{t("Medium", "मध्यम")}</SelectItem>
                      <SelectItem value="high">{t("High", "उच्च")}</SelectItem>
                      <SelectItem value="urgent">{t("Urgent", "अति आवश्यक")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("Due Date", "नियत तारीख")}</Label>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask((p) => ({ ...p, dueDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateTask(false)}>
                  {t("Cancel", "रद्द करें")}
                </Button>
                <Button onClick={handleCreateTask} disabled={!newTask.title.trim() || createTaskMutation.isPending}>
                  {t("Add", "जोड़ें")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Task Dialog */}
        <Dialog open={!!editingTask} onOpenChange={(open) => { if (!open) { setEditingTask(null); setAssigneeSearch(""); } }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("Edit Task", "कार्य संपादित करें")}</DialogTitle>
              <DialogDescription>
                {t("Update task details, status, or assignment.", "कार्य विवरण, स्थिति या जिम्मेदारी अपडेट करें।")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("Task Title", "कार्य का शीर्षक")}</Label>
                <Input
                  value={editTask.title}
                  onChange={(e) => setEditTask((p) => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("Title (Hindi)", "शीर्षक (हिंदी)")}</Label>
                <Input
                  value={editTask.titleHi}
                  onChange={(e) => setEditTask((p) => ({ ...p, titleHi: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("Description", "विवरण")}</Label>
                <Textarea
                  value={editTask.description}
                  onChange={(e) => setEditTask((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("Status", "स्थिति")}</Label>
                <Select
                  value={editTask.status}
                  onValueChange={(v) => setEditTask((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_COLUMNS.map((col) => (
                      <SelectItem key={col.key} value={col.key}>
                        {t(col.label, col.labelHi)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("Assignee", "जिम्मेदार")}</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder={t("Search members...", "सदस्य खोजें...")}
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                  />
                  {editTask.assigneeUserId && (
                    <button
                      className="absolute right-2 top-2.5"
                      onClick={() => { setEditTask((p) => ({ ...p, assigneeUserId: "" })); setAssigneeSearch(""); }}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <div className="max-h-32 overflow-y-auto border rounded-md">
                  {filteredUsers.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">{t("No members found", "कोई सदस्य नहीं मिला")}</p>
                  ) : (
                    filteredUsers.map((user: UserOption) => (
                      <button
                        key={user.id}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors ${
                          editTask.assigneeUserId === user.id ? "bg-primary/10 font-medium" : ""
                        }`}
                        onClick={() => {
                          setEditTask((p) => ({ ...p, assigneeUserId: p.assigneeUserId === user.id ? "" : user.id }));
                          setAssigneeSearch(user.displayName ?? "");
                        }}
                      >
                        <User className="h-3 w-3 inline mr-2 text-muted-foreground" />
                        {user.displayName}
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Priority", "प्राथमिकता")}</Label>
                  <Select
                    value={editTask.priority}
                    onValueChange={(v) => setEditTask((p) => ({ ...p, priority: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t("Low", "निम्न")}</SelectItem>
                      <SelectItem value="medium">{t("Medium", "मध्यम")}</SelectItem>
                      <SelectItem value="high">{t("High", "उच्च")}</SelectItem>
                      <SelectItem value="urgent">{t("Urgent", "अति आवश्यक")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("Due Date", "नियत तारीख")}</Label>
                  <Input
                    type="date"
                    value={editTask.dueDate}
                    onChange={(e) => setEditTask((p) => ({ ...p, dueDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setEditingTask(null); setAssigneeSearch(""); }}>
                  {t("Cancel", "रद्द करें")}
                </Button>
                <Button onClick={handleUpdateTask} disabled={!editTask.title.trim() || updateTaskMutation.isPending}>
                  {t("Save", "सहेजें")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
