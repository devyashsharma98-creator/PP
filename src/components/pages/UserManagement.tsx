"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  EyeOff,
  Loader2,
  Mail,
  Phone,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCog,
  UserPlus,
} from "lucide-react";

import { Masthead } from "@/components/Masthead";
import { useToast } from "@/components/ToastProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppContext } from "@/context/AppContext";
import {
  assignRole,
  createUser,
  fetchRoles,
  fetchUser,
  fetchUsers,
  removeRole,
  updateUser,
  type CreateUserInput,
  type UpdateUserInput,
  type UserDetail,
} from "@/lib/api/users";
import type { CanonicalRoleCode } from "@/lib/app/contracts";
import { canonicalRoleLabels, canonicalRoleLabelsHi } from "@/lib/app/constants";
import { getPrimaryRole, resolvePermissions } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "active" | "inactive";
type RoleFilter = "all" | CanonicalRoleCode;

const ADMIN_ROLE_CODES = new Set<CanonicalRoleCode>(["super_admin", "org_admin"]);

const ACCESS_ROWS = [
  {
    key: "canCreateEvent",
    label: "Create and update events",
    area: "Gatividhi",
    detail: "Programme planning, checklists, and local event control.",
  },
  {
    key: "canFinalizePoll",
    label: "Finalize polls and decisions",
    area: "Gatividhi",
    detail: "Locks public voting outcomes and operational choices.",
  },
  {
    key: "canPublishEvent",
    label: "Publish event workflows",
    area: "Governance",
    detail: "Moves programmes into the public or approved lane.",
  },
  {
    key: "canCreateArticle",
    label: "Create and edit aalekh",
    area: "Aalekh",
    detail: "Drafts, revisions, and editorial preparation.",
  },
  {
    key: "canPublishArticle",
    label: "Approve publication",
    area: "Aalekh",
    detail: "Final editorial authority for institutional writing.",
  },
  {
    key: "canUpdatePrachar",
    label: "Control prachar follow-through",
    area: "Prachar",
    detail: "Tracks publication, distribution, and outreach completion.",
  },
  {
    key: "canManageUsers",
    label: "Manage accounts and access",
    area: "Administration",
    detail: "Creates users, assigns roles, and governs account access.",
  },
] as const;

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not recorded";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function getRoleLabel(roleCode: CanonicalRoleCode, lang: "en" | "hi") {
  return lang === "hi" ? canonicalRoleLabelsHi[roleCode] : canonicalRoleLabels[roleCode];
}

function createStrongPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const symbols = "!@#$%";
  const randomChars = Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
  return `${randomChars}${randomSymbol}9`;
}

function isActiveRole(assignment: UserDetail["roleAssignments"][number]) {
  const now = new Date();
  const startsAt = new Date(assignment.startsAt);
  const endsAt = assignment.endsAt ? new Date(assignment.endsAt) : null;

  if (Number.isNaN(startsAt.getTime()) || startsAt > now) return false;
  if (endsAt && !Number.isNaN(endsAt.getTime()) && endsAt <= now) return false;
  return true;
}

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { authReady, lang, permissions, viewer } = useAppContext();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserInput>({
    email: "",
    password: createStrongPassword(),
    displayName: "",
    displayNameHi: "",
    phone: "",
    roleCode: "karyakarta",
  });
  const [profileForm, setProfileForm] = useState<UpdateUserInput>({
    displayName: "",
    displayNameHi: "",
    phone: "",
  });
  const [assignRoleCode, setAssignRoleCode] = useState<CanonicalRoleCode | "">("");

  const deferredSearch = useDeferredValue(search.trim());
  const canManageUsers = permissions.canManageUsers || Boolean(viewer?.effectiveRoles.some((role) => ADMIN_ROLE_CODES.has(role)));

  const rolesQuery = useQuery({
    queryKey: ["admin-role-options"],
    queryFn: fetchRoles,
    enabled: canManageUsers,
    staleTime: 300000,
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users", deferredSearch, statusFilter],
    queryFn: () =>
      fetchUsers({
        search: deferredSearch || undefined,
        isActive: statusFilter === "all" ? undefined : statusFilter === "active",
        limit: 100,
      }),
    enabled: canManageUsers,
  });

  const visibleUsers = useMemo(() => {
    const users = usersQuery.data ?? [];
    if (roleFilter === "all") return users;
    return users.filter((user) => user.roles.some((role) => role.code === roleFilter));
  }, [roleFilter, usersQuery.data]);

  useEffect(() => {
    if (!visibleUsers.length) {
      setSelectedUserId(null);
      return;
    }

    if (!selectedUserId || !visibleUsers.some((user) => user.id === selectedUserId)) {
      setSelectedUserId(visibleUsers[0]?.id ?? null);
    }
  }, [selectedUserId, visibleUsers]);

  const selectedUserQuery = useQuery({
    queryKey: ["admin-user", selectedUserId],
    queryFn: () => fetchUser(selectedUserId as string),
    enabled: canManageUsers && Boolean(selectedUserId),
  });

  const selectedUser = selectedUserQuery.data;

  useEffect(() => {
    if (!selectedUser) return;
    setProfileForm({
      displayName: selectedUser.displayName ?? "",
      displayNameHi: selectedUser.displayNameHi ?? "",
      phone: selectedUser.phone ?? "",
      isActive: selectedUser.isActive,
    });
  }, [selectedUser]);

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async (createdUser) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-user", createdUser.id] }),
      ]);
      setSelectedUserId(createdUser.id);
      setCreateOpen(false);
      setCreateForm({
        email: "",
        password: createStrongPassword(),
        displayName: "",
        displayNameHi: "",
        phone: "",
        roleCode: "karyakarta",
      });
      addToast("Account created", "success");
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : "Failed to create account", "error");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) => updateUser(id, input),
    onSuccess: async (_, vars) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-user", vars.id] }),
      ]);
      addToast("Account updated", "success");
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : "Failed to update account", "error");
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleCode }: { userId: string; roleCode: CanonicalRoleCode }) =>
      assignRole(userId, { roleCode, scopeType: "org", isPrimary: false }),
    onSuccess: async (_, vars) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-user", vars.userId] }),
      ]);
      setAssignRoleCode("");
      addToast("Access role assigned", "success");
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : "Failed to assign access", "error");
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: ({ userId, assignmentId }: { userId: string; assignmentId: string }) =>
      removeRole(userId, assignmentId),
    onSuccess: async (_, vars) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-user", vars.userId] }),
      ]);
      addToast("Role removed", "success");
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : "Failed to remove role", "error");
    },
  });

  const roleOptions = rolesQuery.data ?? [];
  const activeAssignments = useMemo(
    () => (selectedUser?.roleAssignments ?? []).filter(isActiveRole),
    [selectedUser?.roleAssignments],
  );
  const activeRoleCodes = activeAssignments.map((assignment) => assignment.roleCode) as CanonicalRoleCode[];
  const effectiveRoleCodes: CanonicalRoleCode[] = activeRoleCodes.length ? activeRoleCodes : ["karyakarta"];
  const effectivePermissions = resolvePermissions(effectiveRoleCodes);
  const effectivePrimaryRole = getPrimaryRole(effectiveRoleCodes);
  const createRolePreview = resolvePermissions([createForm.roleCode]);

  const totalUsers = usersQuery.data?.length ?? 0;
  const activeUsers = (usersQuery.data ?? []).filter((user) => user.isActive).length;
  const adminUsers = (usersQuery.data ?? []).filter((user) =>
    user.roles.some((role) => ADMIN_ROLE_CODES.has(role.code)),
  ).length;

  const createFormReady =
    Boolean(createForm.email.trim()) &&
    Boolean(createForm.password.trim()) &&
    Boolean(createForm.displayName?.trim());

  const createContexts = [
    {
      labelEn: "Accounts",
      labelHi: "Accounts",
      valueEn: String(totalUsers),
      detailEn: "Total identities available inside the organisation.",
      detailHi: "Total identities available inside the organisation.",
    },
    {
      labelEn: "Active",
      labelHi: "Active",
      valueEn: String(activeUsers),
      detailEn: "Members who can currently sign in and operate.",
      detailHi: "Members who can currently sign in and operate.",
    },
    {
      labelEn: "Admin seats",
      labelHi: "Admin seats",
      valueEn: String(adminUsers),
      detailEn: "Accounts carrying organisation or super-admin authority.",
      detailHi: "Accounts carrying organisation or super-admin authority.",
    },
  ];

  const accessPreviewRows = ACCESS_ROWS.map((row) => ({
    ...row,
    allowed: effectivePermissions[row.key],
  }));

  if (!authReady) {
    return null;
  }

  if (!canManageUsers) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <Masthead
          seal="Access Governance"
          sealHi="Access Governance"
          title="Super Admin Console"
          titleHi="Super Admin Console"
          subtitle="This page is reserved for super-admin and organisation-admin accounts."
          subtitleHi="This page is reserved for super-admin and organisation-admin accounts."
          icon={<ShieldCheck className="h-6 w-6 text-primary" />}
        />

        <Alert className="institution-panel border-primary/20 bg-primary/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Restricted surface</AlertTitle>
          <AlertDescription>
            Your current account can work inside the institutional workflows, but it cannot govern other accounts.
            Sign in with a super-admin or org-admin profile to create users and control access.
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Masthead
        seal="Access Governance"
        sealHi="Access Governance"
        title="Super Admin Console"
        titleHi="Super Admin Console"
        subtitle="Create institutional accounts, define role-based access, and keep authority boundaries explicit."
        subtitleHi="Create institutional accounts, define role-based access, and keep authority boundaries explicit."
        icon={<ShieldCheck className="h-6 w-6 text-primary" />}
        contexts={createContexts}
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Create account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-popover">
              <DialogHeader>
                <DialogTitle>Create a new institutional account</DialogTitle>
                <DialogDescription>
                  Set a temporary password, assign the first role, and let the access preview confirm what this
                  account can actually do.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-display-name">Display name</Label>
                      <Input
                        id="new-display-name"
                        value={createForm.displayName ?? ""}
                        onChange={(event) =>
                          setCreateForm((current) => ({ ...current, displayName: event.target.value }))
                        }
                        placeholder="Name used across the workspace"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-display-name-hi">Display name (Hindi)</Label>
                      <Input
                        id="new-display-name-hi"
                        value={createForm.displayNameHi ?? ""}
                        onChange={(event) =>
                          setCreateForm((current) => ({ ...current, displayNameHi: event.target.value }))
                        }
                        placeholder="Optional Hindi label"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-email">Email</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={createForm.email}
                        onChange={(event) =>
                          setCreateForm((current) => ({ ...current, email: event.target.value }))
                        }
                        placeholder="member@organisation.org"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-phone">Phone</Label>
                      <Input
                        id="new-phone"
                        value={createForm.phone ?? ""}
                        onChange={(event) =>
                          setCreateForm((current) => ({ ...current, phone: event.target.value }))
                        }
                        placeholder="Optional phone number"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="new-password">Temporary password</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() =>
                          setCreateForm((current) => ({ ...current, password: createStrongPassword() }))
                        }
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Generate
                      </Button>
                    </div>
                    <Input
                      id="new-password"
                      value={createForm.password}
                      onChange={(event) =>
                        setCreateForm((current) => ({ ...current, password: event.target.value }))
                      }
                      placeholder="Set a strong temporary password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-role">Initial access role</Label>
                    <Select
                      value={createForm.roleCode}
                      onValueChange={(value: CanonicalRoleCode) =>
                        setCreateForm((current) => ({ ...current, roleCode: value }))
                      }
                    >
                      <SelectTrigger id="new-role">
                        <SelectValue placeholder="Choose an access role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role.id} value={role.code}>
                            {getRoleLabel(role.code, lang)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="institution-panel-muted space-y-4 p-4">
                  <div className="space-y-1">
                    <p className="shell-copy">Access preview</p>
                    <h3 className="text-sm font-semibold">{getRoleLabel(createForm.roleCode, lang)}</h3>
                    <p className="text-xs leading-5 text-muted-foreground">
                      This preview is calculated from the current role matrix so the account scope is explicit before
                      creation.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {ACCESS_ROWS.map((row) => (
                      <div
                        key={row.key}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{row.label}</p>
                          <p className="text-xs leading-5 text-muted-foreground">{row.area}</p>
                        </div>
                        <Badge variant={createRolePreview[row.key] ? "default" : "secondary"}>
                          {createRolePreview[row.key] ? "Allowed" : "Locked"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => createUserMutation.mutate(createForm)}
                  disabled={!createFormReady || createUserMutation.isPending}
                  className="gap-2"
                >
                  {createUserMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Create account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
        <div className="space-y-6">
          <Card className="institution-panel">
            <CardHeader className="space-y-4 border-b border-border/60">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-lg">Account roster</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Search people, inspect authority, and keep access decisions legible.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative min-w-0 sm:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by name or email"
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                    <SelectTrigger className="sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="active">Active only</SelectItem>
                      <SelectItem value="inactive">Inactive only</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={roleFilter} onValueChange={(value: RoleFilter) => setRoleFilter(value)}>
                    <SelectTrigger className="sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.id} value={role.code}>
                          {getRoleLabel(role.code, lang)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-5">
              {usersQuery.isLoading ? (
                <div className="flex min-h-[18rem] items-center justify-center">
                  <div className="space-y-3 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading institutional accounts...</p>
                  </div>
                </div>
              ) : null}

              {!usersQuery.isLoading && usersQuery.isError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Unable to load accounts</AlertTitle>
                  <AlertDescription>
                    {usersQuery.error instanceof Error ? usersQuery.error.message : "Try refreshing the page."}
                  </AlertDescription>
                </Alert>
              ) : null}

              {!usersQuery.isLoading && !usersQuery.isError && !visibleUsers.length ? (
                <div className="rounded-3xl border border-dashed border-border/80 bg-background/60 px-6 py-12 text-center">
                  <UserCog className="mx-auto mb-4 h-10 w-10 text-muted-foreground/60" />
                  <p className="text-base font-semibold">No accounts match this filter</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Broaden the search or create a new institutional account from the masthead action.
                  </p>
                </div>
              ) : null}

              {!usersQuery.isLoading &&
                !usersQuery.isError &&
                visibleUsers.map((user) => {
                  const primaryRole = user.primaryRoleCode ?? user.roles[0]?.code ?? "karyakarta";
                  const isSelected = user.id === selectedUserId;

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedUserId(user.id)}
                      className={cn(
                        "w-full rounded-3xl border p-4 text-left transition-all",
                        isSelected
                          ? "border-primary/45 bg-primary/5 shadow-[0_16px_40px_-30px_hsl(var(--primary)/0.75)]"
                          : "border-border/70 bg-background/65 hover:border-primary/25 hover:bg-background/85",
                      )}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-semibold">
                              {user.displayName || user.email || "Unnamed account"}
                            </p>
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">{getRoleLabel(primaryRole, lang)}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5" />
                              {user.email || "No email"}
                            </span>
                            {user.phone ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5" />
                                {user.phone}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground sm:text-right">
                          <p>Last login: {formatDateTime(user.lastLoginAt)}</p>
                          <div className="flex flex-wrap gap-2 sm:justify-end">
                            {user.roles.slice(0, 3).map((role) => (
                              <Badge key={`${user.id}-${role.code}`} variant="secondary" className="gap-1.5">
                                <Shield className="h-3 w-3" />
                                {getRoleLabel(role.code, lang)}
                              </Badge>
                            ))}
                            {user.roles.length > 3 ? (
                              <Badge variant="outline">+{user.roles.length - 3} more</Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </CardContent>
          </Card>

          <Card className="institution-panel-muted">
            <CardHeader>
              <CardTitle className="text-base">Governance notes</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-sm font-semibold">Role-first access</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  This surface uses the canonical role hierarchy already present in the platform, so access remains
                  explainable and consistent across modules.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-sm font-semibold">Safe revocation</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Individual roles can be removed, but the final active role is protected. Use account deactivation
                  when someone should no longer sign in at all.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-sm font-semibold">Transparent authority</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The access matrix below every account makes it obvious what a role stack unlocks before anyone is
                  placed into a workflow lane.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {!selectedUserId ? (
            <Card className="institution-panel">
              <CardContent className="py-16 text-center">
                <UserCog className="mx-auto mb-4 h-10 w-10 text-muted-foreground/55" />
                <p className="text-base font-semibold">Select an account</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Pick someone from the roster to review their profile, assigned roles, and effective access.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {selectedUserId && selectedUserQuery.isLoading ? (
            <Card className="institution-panel">
              <CardContent className="flex min-h-[24rem] items-center justify-center">
                <div className="space-y-3 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading account details...</p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {selectedUserId && selectedUserQuery.isError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Unable to load account detail</AlertTitle>
              <AlertDescription>
                {selectedUserQuery.error instanceof Error
                  ? selectedUserQuery.error.message
                  : "Refresh the page and try again."}
              </AlertDescription>
            </Alert>
          ) : null}

          {selectedUser ? (
            <>
              <Card className="institution-panel">
                <CardHeader className="space-y-4 border-b border-border/60">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-xl">
                          {selectedUser.displayName || selectedUser.email || "Unnamed account"}
                        </CardTitle>
                        <Badge variant={selectedUser.isActive ? "default" : "secondary"}>
                          {selectedUser.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">{getRoleLabel(effectivePrimaryRole, lang)}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          {selectedUser.email || "No email"}
                        </span>
                        {selectedUser.phone ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            {selectedUser.phone}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <Button
                      variant={selectedUser.isActive ? "outline" : "default"}
                      className="gap-2"
                      onClick={() =>
                        updateUserMutation.mutate({
                          id: selectedUser.id,
                          input: { isActive: !selectedUser.isActive },
                        })
                      }
                      disabled={updateUserMutation.isPending}
                    >
                      {selectedUser.isActive ? <EyeOff className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      {selectedUser.isActive ? "Deactivate account" : "Reactivate account"}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-display-name">Display name</Label>
                      <Input
                        id="edit-display-name"
                        value={profileForm.displayName ?? ""}
                        onChange={(event) =>
                          setProfileForm((current) => ({ ...current, displayName: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-display-name-hi">Display name (Hindi)</Label>
                      <Input
                        id="edit-display-name-hi"
                        value={profileForm.displayNameHi ?? ""}
                        onChange={(event) =>
                          setProfileForm((current) => ({ ...current, displayNameHi: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="edit-phone">Phone</Label>
                      <Input
                        id="edit-phone"
                        value={profileForm.phone ?? ""}
                        onChange={(event) =>
                          setProfileForm((current) => ({ ...current, phone: event.target.value }))
                        }
                        placeholder="Optional phone number"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span>Created: {formatDateTime(selectedUser.createdAt)}</span>
                    <span>Last login: {formatDateTime(selectedUser.lastLoginAt)}</span>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => updateUserMutation.mutate({ id: selectedUser.id, input: profileForm })}
                      disabled={updateUserMutation.isPending}
                      className="gap-2"
                    >
                      {updateUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCog className="h-4 w-4" />}
                      Save profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="institution-panel">
                <CardHeader className="border-b border-border/60">
                  <CardTitle className="text-base">Assigned roles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {activeAssignments.length ? (
                    <div className="space-y-3">
                      {activeAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="gap-1.5">
                                <Shield className="h-3 w-3" />
                                {getRoleLabel(assignment.roleCode, lang)}
                              </Badge>
                              {assignment.isPrimary ? <Badge>Primary</Badge> : null}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Scope: {assignment.scopeType} · Active from {formatDateTime(assignment.startsAt)}
                            </p>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() =>
                              removeRoleMutation.mutate({
                                userId: selectedUser.id,
                                assignmentId: assignment.id,
                              })
                            }
                            disabled={removeRoleMutation.isPending}
                          >
                            {removeRoleMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 px-4 py-8 text-center">
                      <p className="text-sm font-medium">No active roles found</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Add an organisation-level role below to place this member into an operational lane.
                      </p>
                    </div>
                  )}

                  <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                      <div className="space-y-2">
                        <Label htmlFor="assign-role">Add role</Label>
                        <Select value={assignRoleCode} onValueChange={(value: CanonicalRoleCode) => setAssignRoleCode(value)}>
                          <SelectTrigger id="assign-role">
                            <SelectValue placeholder="Choose a role to add" />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions
                              .filter((role) => !activeAssignments.some((assignment) => assignment.roleCode === role.code))
                              .map((role) => (
                                <SelectItem key={role.id} value={role.code}>
                                  {getRoleLabel(role.code, lang)}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={() =>
                          assignRoleCode &&
                          assignRoleMutation.mutate({ userId: selectedUser.id, roleCode: assignRoleCode })
                        }
                        disabled={!assignRoleCode || assignRoleMutation.isPending}
                        className="gap-2"
                      >
                        {assignRoleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                        Assign access
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="institution-panel">
                <CardHeader className="border-b border-border/60">
                  <CardTitle className="text-base">Effective access matrix</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Capability</TableHead>
                        <TableHead>Area</TableHead>
                        <TableHead>Access</TableHead>
                        <TableHead>Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accessPreviewRows.map((row) => (
                        <TableRow key={row.key}>
                          <TableCell className="font-medium">{row.label}</TableCell>
                          <TableCell>{row.area}</TableCell>
                          <TableCell>
                            <Badge variant={row.allowed ? "default" : "secondary"}>
                              {row.allowed ? "Allowed" : "Restricted"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{row.detail}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                    Effective authority is currently derived from{" "}
                    <span className="font-medium text-foreground">{getRoleLabel(effectivePrimaryRole, lang)}</span>
                    {" "}plus {Math.max(activeAssignments.length - 1, 0)} additional active role
                    {activeAssignments.length === 1 ? "" : "s"}.
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
