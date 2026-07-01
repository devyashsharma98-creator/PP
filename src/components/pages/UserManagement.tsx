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
import { Switch } from "@/components/ui/switch";
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
  deleteUser,
  fetchAccessScopes,
  fetchRoles,
  fetchUser,
  fetchUsers,
  removeRole,
  updateUser,
  type AssignRoleInput,
  type CreateUserInput,
  type UpdateUserInput,
  type UserDetail,
  type UserRoleAssignment,
} from "@/lib/api/users";
import type { CanonicalRoleCode } from "@/lib/app/contracts";
import { canonicalRoleLabels, canonicalRoleLabelsHi } from "@/lib/app/constants";
import { getPrimaryRole, resolvePermissions } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { displayBilingualHi, repairBrokenHindi, useT } from "@/lib/useT";

type StatusFilter = "all" | "active" | "inactive";
type RoleFilter = "all" | CanonicalRoleCode;
type AssignmentScopeType = NonNullable<AssignRoleInput["scopeType"]>;
type DisplayScopeType = UserRoleAssignment["scopeType"];

const ADMIN_ROLE_CODES = new Set<CanonicalRoleCode>(["super_admin", "org_admin"]);

const ACCESS_ROWS = [
  {
    key: "canCreateEvent",
    label: "Create and update events",
    labelHi: "कार्यक्रम बनाना और अद्यतन करना",
    area: "Gatividhi",
    areaHi: "गतिविधि",
    detail: "Programme planning, checklists, and local event control.",
    detailHi: "कार्यक्रम योजना, चेकलिस्ट और स्थानीय कार्यक्रम नियंत्रण।",
  },
  {
    key: "canFinalizePoll",
    label: "Finalize polls and decisions",
    labelHi: "मतदान और निर्णय अंतिम करना",
    area: "Gatividhi",
    areaHi: "गतिविधि",
    detail: "Locks public voting outcomes and operational choices.",
    detailHi: "सार्वजनिक मतदान परिणाम और परिचालन विकल्पों को अंतिम करता है।",
  },
  {
    key: "canPublishEvent",
    label: "Publish event workflows",
    labelHi: "कार्यक्रम प्रवाह प्रकाशित करना",
    area: "Governance",
    areaHi: "शासन",
    detail: "Moves programmes into the public or approved lane.",
    detailHi: "कार्यक्रमों को सार्वजनिक या अनुमोदित धारा में ले जाता है।",
  },
  {
    key: "canCreateArticle",
    label: "Create and edit aalekh",
    labelHi: "आलेख बनाना और संपादित करना",
    area: "Aalekh",
    areaHi: "आलेख",
    detail: "Drafts, revisions, and editorial preparation.",
    detailHi: "प्रारूप, संशोधन और संपादकीय तैयारी।",
  },
  {
    key: "canPublishArticle",
    label: "Approve publication",
    labelHi: "प्रकाशन अनुमोदित करना",
    area: "Aalekh",
    areaHi: "आलेख",
    detail: "Final editorial authority for institutional writing.",
    detailHi: "संस्थागत लेखन के लिए अंतिम संपादकीय अधिकार।",
  },
  {
    key: "canUpdatePrachar",
    label: "Control prachar follow-through",
    labelHi: "प्रचार अनुवर्ती नियंत्रित करना",
    area: "Prachar",
    areaHi: "प्रचार",
    detail: "Tracks publication, distribution, and outreach completion.",
    detailHi: "प्रकाशन, प्रसार और पहुँच-समापन को ट्रैक करता है।",
  },
  {
    key: "canManageUsers",
    label: "Manage accounts and access",
    labelHi: "खाते और प्रवेश प्रबंधन",
    area: "Administration",
    areaHi: "प्रशासन",
    detail: "Creates users, assigns roles, and governs account access.",
    detailHi: "उपयोगकर्ता बनाता है, भूमिकाएँ निर्धारित करता है और खाते का प्रवेश नियंत्रित करता है।",
  },
] as const;

function formatDateTime(value: string | null | undefined, lang: "en" | "hi") {
  if (!value) return lang === "hi" ? "रिकॉर्ड उपलब्ध नहीं" : "Not recorded";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return lang === "hi" ? "रिकॉर्ड उपलब्ध नहीं" : "Not recorded";

  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function getRoleLabel(roleCode: CanonicalRoleCode, lang: "en" | "hi") {
  return lang === "hi" ? repairBrokenHindi(canonicalRoleLabelsHi[roleCode] ?? roleCode) : canonicalRoleLabels[roleCode];
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

function getScopeTypeLabel(scopeType: DisplayScopeType, lang: "en" | "hi") {
  const labels: Record<DisplayScopeType, { en: string; hi: string }> = {
    org: { en: "Whole organisation", hi: "पूरी संस्था" },
    unit: { en: "Specific unit", hi: "विशिष्ट इकाई" },
    department: { en: "Specific aayam", hi: "विशिष्ट आयाम" },
    event: { en: "Specific event", hi: "विशिष्ट कार्यक्रम" },
    article: { en: "Specific article", hi: "विशिष्ट आलेख" },
  };
  return labels[scopeType][lang];
}

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { authReady, lang, permissions, viewer } = useAppContext();
  const t = useT();

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
    responsibility: "",
    responsibilityHi: "",
    roleCode: "karyakarta",
    unitId: undefined,
    departmentId: undefined,
  });
  const [createScopeType, setCreateScopeType] = useState<"org" | "unit" | "department">("org");
  const [profileForm, setProfileForm] = useState<UpdateUserInput>({
    displayName: "",
    displayNameHi: "",
    phone: "",
    responsibility: "",
    responsibilityHi: "",
  });
  const [assignRoleCode, setAssignRoleCode] = useState<CanonicalRoleCode | "">("");
  const [assignScopeType, setAssignScopeType] = useState<AssignmentScopeType>("org");
  const [assignUnitId, setAssignUnitId] = useState("");
  const [assignDepartmentId, setAssignDepartmentId] = useState("");
  const [assignPrimary, setAssignPrimary] = useState(false);

  const deferredSearch = useDeferredValue(search.trim());
  const canManageUsers = permissions.canManageUsers || Boolean(viewer?.effectiveRoles.some((role) => ADMIN_ROLE_CODES.has(role)));

  const rolesQuery = useQuery({
    queryKey: ["admin-role-options"],
    queryFn: fetchRoles,
    enabled: canManageUsers,
    staleTime: 300000,
  });

  const scopesQuery = useQuery({
    queryKey: ["admin-access-scopes"],
    queryFn: fetchAccessScopes,
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
      responsibility: selectedUser.responsibility ?? "",
      responsibilityHi: selectedUser.responsibilityHi ?? "",
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
        responsibility: "",
        responsibilityHi: "",
        roleCode: "karyakarta",
        unitId: undefined,
        departmentId: undefined,
      });
      setCreateScopeType("org");
      addToast(t("Account created", "खाता बनाया गया"), "success");
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : t("Failed to create account", "खाता बनाया नहीं जा सका"), "error");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) => updateUser(id, input),
    onSuccess: async (_, vars) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-user", vars.id] }),
      ]);
      addToast(t("Account updated", "खाता अद्यतन किया गया"), "success");
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : t("Failed to update account", "खाता अद्यतन नहीं हो सका"), "error");
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: AssignRoleInput }) =>
      assignRole(userId, input),
    onSuccess: async (_, vars) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-user", vars.userId] }),
      ]);
      setAssignRoleCode("");
      setAssignScopeType("org");
      setAssignUnitId("");
      setAssignDepartmentId("");
      setAssignPrimary(false);
      addToast(t("Access role assigned", "प्रवेश भूमिका निर्धारित की गई"), "success");
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : t("Failed to assign access", "प्रवेश निर्धारित नहीं हो सका"), "error");
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
      addToast(t("Role removed", "भूमिका हटाई गई"), "success");
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : t("Failed to remove role", "भूमिका हटाई नहीं जा सकी"), "error");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: () => deleteUser(selectedUserId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setSelectedUserId(null);
      addToast(t("Account deleted permanently", "खाता स्थायी रूप से हटा दिया गया"), "success");
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : t("Failed to delete account", "खाता हटा नहीं सका"), "error");
    },
  });

  const roleOptions = rolesQuery.data ?? [];
  const scopeOptions = scopesQuery.data;
  const units = useMemo(() => scopeOptions?.units ?? [], [scopeOptions]);
  const departments = useMemo(() => scopeOptions?.departments ?? [], [scopeOptions]);
  const activeAssignments = useMemo(
    () => (selectedUser?.roleAssignments ?? []).filter(isActiveRole),
    [selectedUser?.roleAssignments],
  );
  const activeRoleCodes = activeAssignments.map((assignment) => assignment.roleCode) as CanonicalRoleCode[];
  const effectiveRoleCodes: CanonicalRoleCode[] = activeRoleCodes.length ? activeRoleCodes : ["karyakarta"];
  const effectivePermissions = resolvePermissions(effectiveRoleCodes);
  const effectivePrimaryRole = getPrimaryRole(effectiveRoleCodes);
  const createRolePreview = resolvePermissions([createForm.roleCode]);
  const selectedAssignRolePreview = assignRoleCode ? resolvePermissions([assignRoleCode]) : null;
  const scopeTargetReady =
    assignScopeType === "unit" ? Boolean(assignUnitId) :
    assignScopeType === "department" ? Boolean(assignDepartmentId) :
    true;
  const assignRoleReady = Boolean(assignRoleCode) && scopeTargetReady;

  const unitNameById = useMemo(
    () => new Map(units.map((unit) => [unit.id, displayBilingualHi(unit.name, unit.nameHi, lang)])),
    [lang, units],
  );
  const departmentNameById = useMemo(
    () =>
      new Map(
        departments.map((department) => [department.id, displayBilingualHi(department.name, department.nameHi, lang)]),
      ),
    [departments, lang],
  );

  function formatAssignmentScope(assignment: UserDetail["roleAssignments"][number]) {
    if (assignment.scopeType === "org") return scopeOptions?.org?.name ?? t("Whole organisation", "पूरी संस्था");
    if (assignment.scopeType === "unit") {
      return assignment.unitId
        ? unitNameById.get(assignment.unitId) ?? t("Selected unit", "चयनित इकाई")
        : t("Unit scope", "इकाई क्षेत्र");
    }
    if (assignment.scopeType === "department") {
      return assignment.departmentId
        ? departmentNameById.get(assignment.departmentId) ?? t("Selected aayam", "चयनित आयाम")
        : t("Aayam scope", "आयाम क्षेत्र");
    }
    return getScopeTypeLabel(assignment.scopeType, lang);
  }

  function buildAssignmentInput(): AssignRoleInput | null {
    if (!assignRoleCode || !scopeTargetReady) return null;
    return {
      roleCode: assignRoleCode,
      scopeType: assignScopeType,
      unitId: assignScopeType === "unit" ? assignUnitId : undefined,
      departmentId: assignScopeType === "department" ? assignDepartmentId : undefined,
      isPrimary: assignPrimary,
    };
  }

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
      labelHi: "खाते",
      valueEn: String(totalUsers),
      valueHi: String(totalUsers),
      detailEn: "Total identities available inside the organisation.",
      detailHi: "संस्था के भीतर उपलब्ध कुल पहचानें।",
    },
    {
      labelEn: "Active",
      labelHi: "सक्रिय",
      valueEn: String(activeUsers),
      valueHi: String(activeUsers),
      detailEn: "Members who can currently sign in and operate.",
      detailHi: "वे सदस्य जो अभी लॉगिन कर कार्य कर सकते हैं।",
    },
    {
      labelEn: "Admin seats",
      labelHi: "प्रशासन सीटें",
      valueEn: String(adminUsers),
      valueHi: String(adminUsers),
      detailEn: "Accounts carrying organisation or super-admin authority.",
      detailHi: "वे खाते जिनके पास संस्था या सुपर-एडमिन अधिकार हैं।",
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
          sealHi="प्रवेश संचालन"
          title="Super Admin Console"
          titleHi="सुपर एडमिन कंसोल"
          subtitle="This page is reserved for super-admin and organisation-admin accounts."
          subtitleHi="यह पृष्ठ केवल सुपर-एडमिन और संस्था-एडमिन खातों के लिए सुरक्षित है।"
          icon={<ShieldCheck className="h-6 w-6 text-primary" />}
        />

        <Alert className="institution-panel border-primary/20 bg-primary/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("Restricted surface", "सीमित सतह")}</AlertTitle>
          <AlertDescription>
            {t(
              "Your current account can work inside the institutional workflows, but it cannot govern other accounts. Sign in with a super-admin or org-admin profile to create users and control access.",
              "आपका वर्तमान खाता संस्थागत कार्यप्रवाह में काम कर सकता है, लेकिन अन्य खातों का संचालन नहीं कर सकता। उपयोगकर्ता बनाने और प्रवेश नियंत्रित करने के लिए सुपर-एडमिन या संस्था-एडमिन प्रोफ़ाइल से लॉगिन करें।",
            )}
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Masthead
        seal="Access Governance"
        sealHi="प्रवेश संचालन"
        title="Super Admin Console"
        titleHi="सुपर एडमिन कंसोल"
        subtitle="Create institutional accounts, define role-based access, and keep authority boundaries explicit."
        subtitleHi="संस्थागत खाते बनाइए, भूमिका-आधारित प्रवेश निर्धारित कीजिए और अधिकार सीमाएँ स्पष्ट रखिए।"
        icon={<ShieldCheck className="h-6 w-6 text-primary" />}
        contexts={createContexts}
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                {t("Create account", "खाता बनाएं")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-2xl bg-popover">
              <DialogHeader>
                <DialogTitle>{t("Create a new institutional account", "नया संस्थागत खाता बनाएं")}</DialogTitle>
                <DialogDescription>
                  {t(
                    "Set a temporary password, assign the first role, and let the access preview confirm what this account can actually do.",
                    "अस्थायी पासवर्ड निर्धारित करें, पहली भूमिका दें, और प्रवेश पूर्वावलोकन से पुष्टि करें कि यह खाता वास्तव में क्या कर सकता है।",
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-display-name">{t("Display name", "प्रदर्शित नाम")}</Label>
                      <Input
                        id="new-display-name"
                        value={createForm.displayName ?? ""}
                        onChange={(event) =>
                          setCreateForm((current) => ({ ...current, displayName: event.target.value }))
                        }
                        placeholder={t("Name used across the workspace", "पूरे कार्यक्षेत्र में प्रयुक्त नाम")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-display-name-hi">{t("Display name (Hindi)", "प्रदर्शित नाम (हिंदी)")}</Label>
                      <Input
                        id="new-display-name-hi"
                        value={createForm.displayNameHi ?? ""}
                        onChange={(event) =>
                          setCreateForm((current) => ({ ...current, displayNameHi: event.target.value }))
                        }
                        placeholder={t("Optional Hindi label", "वैकल्पिक हिंदी नाम")}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-email">{t("Email", "ईमेल")}</Label>
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
                      <Label htmlFor="new-phone">{t("Phone", "फोन")}</Label>
                      <Input
                        id="new-phone"
                        value={createForm.phone ?? ""}
                        onChange={(event) =>
                          setCreateForm((current) => ({ ...current, phone: event.target.value }))
                        }
                        placeholder={t("Optional phone number", "वैकल्पिक फोन नंबर")}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-responsibility">{t("Responsibility", "दायित्व")}</Label>
                      <Input
                        id="new-responsibility"
                        value={createForm.responsibility ?? ""}
                        onChange={(event) =>
                          setCreateForm((current) => ({ ...current, responsibility: event.target.value }))
                        }
                        placeholder={t("e.g. Coordinator, Yuva Aayam", "उदाहरण: संयोजक, युवा आयाम")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-responsibility-hi">{t("Responsibility (Hindi)", "दायित्व (हिंदी)")}</Label>
                      <Input
                        id="new-responsibility-hi"
                        value={createForm.responsibilityHi ?? ""}
                        onChange={(event) =>
                          setCreateForm((current) => ({ ...current, responsibilityHi: event.target.value }))
                        }
                        placeholder={t("Optional Hindi label", "वैकल्पिक हिंदी नाम")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="new-password">{t("Temporary password", "अस्थायी पासवर्ड")}</Label>
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
                        {t("Generate", "बनाएँ")}
                      </Button>
                    </div>
                    <Input
                      id="new-password"
                      value={createForm.password}
                      onChange={(event) =>
                        setCreateForm((current) => ({ ...current, password: event.target.value }))
                      }
                      placeholder={t("Set a strong temporary password", "मज़बूत अस्थायी पासवर्ड रखें")}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-role">{t("Initial access role", "प्रारम्भिक प्रवेश भूमिका")}</Label>
                      <Select
                        value={createForm.roleCode}
                        onValueChange={(value: CanonicalRoleCode) =>
                          setCreateForm((current) => ({ ...current, roleCode: value }))
                        }
                      >
                        <SelectTrigger id="new-role">
                          <SelectValue placeholder={t("Choose an access role", "प्रवेश भूमिका चुनें")} />
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
                    <div className="space-y-2">
                      <Label htmlFor="new-scope-type">{t("Scope", "क्षेत्र")}</Label>
                      <Select
                        value={createScopeType}
                        onValueChange={(value: "org" | "unit" | "department") => {
                          setCreateScopeType(value);
                          setCreateForm((current) => ({ ...current, unitId: undefined, departmentId: undefined }));
                        }}
                      >
                        <SelectTrigger id="new-scope-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="org">{t("Whole organisation", "पूरी संस्था")}</SelectItem>
                          <SelectItem value="unit">{t("Specific unit / vibhag", "विशिष्ट इकाई / विभाग")}</SelectItem>
                          <SelectItem value="department">{t("Specific aayam", "विशिष्ट आयाम")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {createScopeType === "unit" && (
                    <div className="space-y-2">
                      <Label htmlFor="new-unit">{t("Unit / Vibhag", "इकाई / विभाग")}</Label>
                      <Select
                        value={createForm.unitId ?? ""}
                        onValueChange={(value) =>
                          setCreateForm((current) => ({ ...current, unitId: value || undefined }))
                        }
                      >
                        <SelectTrigger id="new-unit">
                          <SelectValue placeholder={t("Choose unit", "इकाई चुनें")} />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {displayBilingualHi(unit.name, unit.nameHi, lang)}
                              <span className="ml-1 text-xs text-muted-foreground uppercase tracking-widest">· {unit.unitKind}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {createScopeType === "department" && (
                    <div className="space-y-2">
                      <Label htmlFor="new-department">{t("Aayam / Department", "आयाम / विभाग")}</Label>
                      <Select
                        value={createForm.departmentId ?? ""}
                        onValueChange={(value) =>
                          setCreateForm((current) => ({ ...current, departmentId: value || undefined }))
                        }
                      >
                        <SelectTrigger id="new-department">
                          <SelectValue placeholder={t("Choose aayam", "आयाम चुनें")} />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((department) => (
                            <SelectItem key={department.id} value={department.id}>
                              {displayBilingualHi(department.name, department.nameHi, lang)}
                              {department.unitId ? ` — ${unitNameById.get(department.unitId) ?? ""}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="institution-panel-muted space-y-4 p-4">
                  <div className="space-y-1">
                    <p className="shell-copy">{t("Access preview", "प्रवेश पूर्वावलोकन")}</p>
                    <h3 className="text-sm font-semibold">{getRoleLabel(createForm.roleCode, lang)}</h3>
                    <p className="text-xs text-muted-foreground">
                      {t("Scope", "क्षेत्र")}:{" "}
                      {createScopeType === "unit" && createForm.unitId
                        ? unitNameById.get(createForm.unitId) ?? t("Selected unit", "चयनित इकाई")
                        : createScopeType === "department" && createForm.departmentId
                          ? departmentNameById.get(createForm.departmentId) ?? t("Selected aayam", "चयनित आयाम")
                          : t("Whole organisation", "पूरी संस्था")}
                    </p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {t(
                        "This preview is calculated from the current role matrix so the account scope is explicit before creation.",
                        "यह पूर्वावलोकन वर्तमान भूमिका-मैट्रिक्स से निकाला जाता है ताकि खाता बनने से पहले इसका प्रवेश-क्षेत्र स्पष्ट हो।",
                      )}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {ACCESS_ROWS.map((row) => (
                      <div
                        key={row.key}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{lang === "hi" ? row.labelHi : row.label}</p>
                          <p className="text-xs leading-5 text-muted-foreground">{lang === "hi" ? row.areaHi : row.area}</p>
                        </div>
                        <Badge variant={createRolePreview[row.key] ? "default" : "secondary"}>
                          {createRolePreview[row.key] ? t("Allowed", "अनुमत") : t("Locked", "सीमित")}
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
                  {t("Create account", "खाता बनाएं")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
        <div className="space-y-6">
          <Card className="institution-panel">
            <CardHeader className="space-y-4 border-b border-border/60">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-lg">{t("Account roster", "खाता सूची")}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("Search people, inspect authority, and keep access decisions legible.", "लोगों को खोजें, अधिकार देखें और प्रवेश-निर्णयों को स्पष्ट रखें।")}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative min-w-0 sm:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={t("Search by name or email", "नाम या ईमेल से खोजें")}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                    <SelectTrigger className="sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("All statuses", "सभी स्थितियाँ")}</SelectItem>
                      <SelectItem value="active">{t("Active only", "केवल सक्रिय")}</SelectItem>
                      <SelectItem value="inactive">{t("Inactive only", "केवल निष्क्रिय")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={roleFilter} onValueChange={(value: RoleFilter) => setRoleFilter(value)}>
                    <SelectTrigger className="sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("All roles", "सभी भूमिकाएँ")}</SelectItem>
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
                    <p className="text-sm text-muted-foreground">{t("Loading institutional accounts...", "संस्थागत खाते लोड हो रहे हैं...")}</p>
                  </div>
                </div>
              ) : null}

              {!usersQuery.isLoading && usersQuery.isError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{t("Unable to load accounts", "खाते लोड नहीं हो सके")}</AlertTitle>
                  <AlertDescription>
                    {usersQuery.error instanceof Error ? usersQuery.error.message : t("Try refreshing the page.", "कृपया पृष्ठ रीफ़्रेश करें।")}
                  </AlertDescription>
                </Alert>
              ) : null}

              {!usersQuery.isLoading && !usersQuery.isError && !visibleUsers.length ? (
                <div className="rounded-3xl border border-dashed border-border/80 bg-background/60 px-6 py-12 text-center">
                  <UserCog className="mx-auto mb-4 h-10 w-10 text-muted-foreground/60" />
                  <p className="text-base font-semibold">{t("No accounts match this filter", "इस फ़िल्टर से कोई खाता नहीं मिला")}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t("Broaden the search or create a new institutional account from the masthead action.", "खोज को विस्तृत करें या ऊपर दिए गए बटन से नया संस्थागत खाता बनाएं।")}
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
                              {displayBilingualHi(user.displayName || user.email || "", user.displayNameHi, lang) ||
                                t("Unnamed account", "अनाम खाता")}
                            </p>
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? t("Active", "सक्रिय") : t("Inactive", "निष्क्रिय")}
                            </Badge>
                            <Badge variant="outline">{getRoleLabel(primaryRole, lang)}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5" />
                              {user.email || t("No email", "कोई ईमेल नहीं")}
                            </span>
                            {user.phone ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5" />
                                {user.phone}
                              </span>
                            ) : null}
                            {user.responsibility ? (
                              <span className="inline-flex items-center gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {displayBilingualHi(user.responsibility, user.responsibilityHi, lang)}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground sm:text-right">
                          <p>{t("Last login", "अंतिम लॉगिन")}: {formatDateTime(user.lastLoginAt, lang)}</p>
                          <div className="flex flex-wrap gap-2 sm:justify-end">
                            {user.roles.slice(0, 3).map((role, idx) => (
                              <Badge key={`${user.id}-${role.code}-${idx}`} variant="secondary" className="gap-1.5">
                                <Shield className="h-3 w-3" />
                                {getRoleLabel(role.code, lang)}
                              </Badge>
                            ))}
                            {user.roles.length > 3 ? (
                              <Badge variant="outline">+{user.roles.length - 3} {t("more", "और")}</Badge>
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
              <CardTitle className="text-base">{t("Governance notes", "प्रशासन टिप्पणियाँ")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-sm font-semibold">{t("Role-first access", "भूमिका-प्रथम प्रवेश")}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(
                    "This surface uses the canonical role hierarchy already present in the platform, so access remains explainable and consistent across modules.",
                    "यह सतह प्लेटफ़ॉर्म में पहले से मौजूद मानक भूमिका-क्रम का उपयोग करती है, इसलिए प्रवेश सभी मॉड्यूलों में स्पष्ट और समान रहता है।",
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-sm font-semibold">{t("Safe revocation", "सुरक्षित निरस्तीकरण")}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(
                    "Individual roles can be removed, but the final active role is protected. Use account deactivation when someone should no longer sign in at all.",
                    "व्यक्तिगत भूमिकाएँ हटाई जा सकती हैं, लेकिन अंतिम सक्रिय भूमिका सुरक्षित रहती है। जब किसी को बिल्कुल भी लॉगिन नहीं करना हो, तब खाता निष्क्रिय करें।",
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-sm font-semibold">{t("Transparent authority", "पारदर्शी अधिकार")}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(
                    "The access matrix below every account makes it obvious what a role stack unlocks before anyone is placed into a workflow lane.",
                    "हर खाते के नीचे दिया गया प्रवेश-मैट्रिक्स स्पष्ट करता है कि किसी भूमिका-संयोजन से क्या-क्या अधिकार खुलते हैं।",
                  )}
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
                <p className="text-base font-semibold">{t("Select an account", "एक खाता चुनें")}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(
                    "Pick someone from the roster to review their profile, assigned roles, and effective access.",
                    "सूची से किसी व्यक्ति को चुनकर उसका प्रोफ़ाइल, दी गई भूमिकाएँ और प्रभावी प्रवेश देखें।",
                  )}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {selectedUserId && selectedUserQuery.isLoading ? (
            <Card className="institution-panel">
              <CardContent className="flex min-h-[24rem] items-center justify-center">
                <div className="space-y-3 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">{t("Loading account details...", "खाते का विवरण लोड हो रहा है...")}</p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {selectedUserId && selectedUserQuery.isError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t("Unable to load account detail", "खाते का विवरण लोड नहीं हो सका")}</AlertTitle>
              <AlertDescription>
                {selectedUserQuery.error instanceof Error
                  ? selectedUserQuery.error.message
                  : t("Refresh the page and try again.", "पृष्ठ रीफ़्रेश करके फिर प्रयास करें।")}
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
                          {displayBilingualHi(
                            selectedUser.displayName || selectedUser.email || "",
                            selectedUser.displayNameHi,
                            lang,
                          ) || t("Unnamed account", "बिना नाम का खाता")}
                        </CardTitle>
                        <Badge variant={selectedUser.isActive ? "default" : "secondary"}>
                          {selectedUser.isActive ? t("Active", "सक्रिय") : t("Inactive", "निष्क्रिय")}
                        </Badge>
                        <Badge variant="outline">{getRoleLabel(effectivePrimaryRole, lang)}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          {selectedUser.email || t("No email", "कोई ईमेल नहीं")}
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
                      {selectedUser.isActive
                        ? t("Deactivate account", "खाता निष्क्रिय करें")
                        : t("Reactivate account", "खाता पुनः सक्रिय करें")}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          aria-label={t("Delete account permanently", "खाता स्थायी रूप से हटाएँ")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-popover">
                        <DialogHeader>
                          <DialogTitle>{t("Delete account permanently?", "खाता स्थायी रूप से हटाएँ?")}</DialogTitle>
                        <DialogDescription>
                          {t(
                            "This will permanently erase " + (selectedUser.email || "this account") + " and all their role assignments. This action cannot be undone.",
                            "यह " + (selectedUser.email || "इस खाते") + " को और उनकी सभी भूमिका आवंटनों को स्थायी रूप से मिटा देगा। यह कार्रवाई पूर्ववत नहीं की जा सकती।",
                          )}
                        </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="destructive" onClick={() => deleteUserMutation.mutate()} disabled={deleteUserMutation.isPending}>
                            {deleteUserMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            {t("Delete permanently", "स्थायी रूप से हटाएँ")}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-display-name">{t("Display name", "प्रदर्शित नाम")}</Label>
                      <Input
                        id="edit-display-name"
                        value={profileForm.displayName ?? ""}
                        onChange={(event) =>
                          setProfileForm((current) => ({ ...current, displayName: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-display-name-hi">{t("Display name (Hindi)", "प्रदर्शित नाम (हिंदी)")}</Label>
                      <Input
                        id="edit-display-name-hi"
                        value={profileForm.displayNameHi ?? ""}
                        onChange={(event) =>
                          setProfileForm((current) => ({ ...current, displayNameHi: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="edit-phone">{t("Phone", "फोन")}</Label>
                      <Input
                        id="edit-phone"
                        value={profileForm.phone ?? ""}
                        onChange={(event) =>
                          setProfileForm((current) => ({ ...current, phone: event.target.value }))
                        }
                        placeholder={t("Optional phone number", "वैकल्पिक फोन नंबर")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-responsibility">{t("Responsibility", "दायित्व")}</Label>
                      <Input
                        id="edit-responsibility"
                        value={profileForm.responsibility ?? ""}
                        onChange={(event) =>
                          setProfileForm((current) => ({ ...current, responsibility: event.target.value }))
                        }
                        placeholder={t("e.g. Coordinator, Yuva Aayam", "उदाहरण: संयोजक, युवा आयाम")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-responsibility-hi">{t("Responsibility (Hindi)", "दायित्व (हिंदी)")}</Label>
                      <Input
                        id="edit-responsibility-hi"
                        value={profileForm.responsibilityHi ?? ""}
                        onChange={(event) =>
                          setProfileForm((current) => ({ ...current, responsibilityHi: event.target.value }))
                        }
                        placeholder={t("Optional Hindi label", "वैकल्पिक हिंदी नाम")}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span>{t("Created", "निर्मित")}: {formatDateTime(selectedUser.createdAt, lang)}</span>
                    <span>{t("Last login", "अंतिम लॉगिन")}: {formatDateTime(selectedUser.lastLoginAt, lang)}</span>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => updateUserMutation.mutate({ id: selectedUser.id, input: profileForm })}
                      disabled={updateUserMutation.isPending}
                      className="gap-2"
                    >
                      {updateUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCog className="h-4 w-4" />}
                      {t("Save profile", "प्रोफ़ाइल सहेजें")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="institution-panel">
                <CardHeader className="border-b border-border/60">
                  <CardTitle className="text-base">{t("Assigned roles", "निर्धारित भूमिकाएँ")}</CardTitle>
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
                              {assignment.isPrimary ? <Badge>{t("Primary", "प्राथमिक")}</Badge> : null}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {t("Scope", "क्षेत्र")}: {getScopeTypeLabel(assignment.scopeType, lang)} · {formatAssignmentScope(assignment)} · {t("Active from", "प्रभावी तिथि")} {formatDateTime(assignment.startsAt, lang)}
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
                            {t("Remove", "हटाएँ")}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border/80 bg-background/60 px-4 py-8 text-center">
                      <p className="text-sm font-medium">{t("No active roles found", "कोई सक्रिय भूमिका नहीं मिली")}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t(
                          "Add an organisation-level role below to place this member into an operational lane.",
                          "इस सदस्य को किसी कार्यधारा में रखने के लिए नीचे संस्था-स्तरीय भूमिका जोड़ें।",
                        )}
                      </p>
                    </div>
                  )}

                  <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="assign-role">{t("Add role", "भूमिका जोड़ें")}</Label>
                        <Select value={assignRoleCode} onValueChange={(value: CanonicalRoleCode) => setAssignRoleCode(value)}>
                          <SelectTrigger id="assign-role">
                            <SelectValue placeholder={t("Choose a role to add", "जोड़ने हेतु भूमिका चुनें")} />
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

                      <div className="space-y-2">
                        <Label htmlFor="assign-scope">{t("Scope", "क्षेत्र")}</Label>
                        <Select
                          value={assignScopeType}
                          onValueChange={(value: AssignmentScopeType) => {
                            setAssignScopeType(value);
                            setAssignUnitId("");
                            setAssignDepartmentId("");
                          }}
                        >
                          <SelectTrigger id="assign-scope">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="org">{t("Whole organisation", "पूरी संस्था")}</SelectItem>
                            <SelectItem value="unit">{t("Specific unit / vibhag", "विशिष्ट इकाई / विभाग")}</SelectItem>
                            <SelectItem value="department">{t("Specific aayam", "विशिष्ट आयाम")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {assignScopeType === "unit" ? (
                        <div className="space-y-2 lg:col-span-2">
                          <Label htmlFor="assign-unit">{t("Unit / Vibhag", "इकाई / विभाग")}</Label>
                          <Select value={assignUnitId} onValueChange={setAssignUnitId}>
                            <SelectTrigger id="assign-unit">
                              <SelectValue placeholder={t("Choose unit", "इकाई चुनें")} />
                            </SelectTrigger>
                            <SelectContent>
                              {units.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id}>
                                  {displayBilingualHi(unit.name, unit.nameHi, lang)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : null}

                      {assignScopeType === "department" ? (
                        <div className="space-y-2 lg:col-span-2">
                          <Label htmlFor="assign-aayam">{t("Aayam / Department", "आयाम / विभाग")}</Label>
                          <Select value={assignDepartmentId} onValueChange={setAssignDepartmentId}>
                            <SelectTrigger id="assign-aayam">
                              <SelectValue placeholder={t("Choose aayam", "आयाम चुनें")} />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((department) => (
                                <SelectItem key={department.id} value={department.id}>
                                  {displayBilingualHi(department.name, department.nameHi, lang)}
                                  {department.unitId ? ` - ${unitNameById.get(department.unitId) ?? ""}` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : null}

                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 lg:col-span-2">
                        <div>
                          <p className="text-sm font-medium">{t("Make primary role", "प्राथमिक भूमिका बनाएँ")}</p>
                          <p className="text-xs text-muted-foreground">{t("Used for the default lane after next login.", "अगले लॉगिन के बाद डिफ़ॉल्ट कार्यधारा के लिए उपयोग होगा।")}</p>
                        </div>
                        <Switch checked={assignPrimary} onCheckedChange={setAssignPrimary} />
                      </div>

                      {selectedAssignRolePreview ? (
                        <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-3 text-xs text-muted-foreground lg:col-span-2">
                          <p className="font-medium text-foreground">{t("Preview", "पूर्वावलोकन")}: {getRoleLabel(assignRoleCode as CanonicalRoleCode, lang)}</p>
                          <p className="mt-1">
                            {t("Scope", "क्षेत्र")}: {getScopeTypeLabel(assignScopeType, lang)}
                            {assignScopeType === "unit" && assignUnitId ? ` - ${unitNameById.get(assignUnitId) ?? t("Selected unit", "चयनित इकाई")}` : ""}
                            {assignScopeType === "department" && assignDepartmentId ? ` - ${departmentNameById.get(assignDepartmentId) ?? t("Selected aayam", "चयनित आयाम")}` : ""}
                          </p>
                          <p className="mt-1">
                            {t("Capabilities", "क्षमताएँ")}: {ACCESS_ROWS.filter((row) => selectedAssignRolePreview[row.key]).map((row) => (lang === "hi" ? row.areaHi : row.area)).join(", ") || t("Restricted", "प्रतिबंधित")}
                          </p>
                        </div>
                      ) : null}

                      <Button
                        onClick={() => {
                          const input = buildAssignmentInput();
                          if (input) assignRoleMutation.mutate({ userId: selectedUser.id, input });
                        }}
                        disabled={!assignRoleReady || assignRoleMutation.isPending}
                        className="gap-2 lg:col-span-2"
                      >
                        {assignRoleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                        {t("Assign scoped access", "सीमित प्रवेश निर्धारित करें")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="institution-panel">
                <CardHeader className="border-b border-border/60">
                  <CardTitle className="text-base">{t("Effective access matrix", "प्रभावी प्रवेश मैट्रिक्स")}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("Capability", "क्षमता")}</TableHead>
                        <TableHead>{t("Area", "क्षेत्र")}</TableHead>
                        <TableHead>{t("Access", "प्रवेश")}</TableHead>
                        <TableHead>{t("Detail", "विवरण")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accessPreviewRows.map((row) => (
                        <TableRow key={row.key}>
                          <TableCell className="font-medium">{lang === "hi" ? row.labelHi : row.label}</TableCell>
                          <TableCell>{lang === "hi" ? row.areaHi : row.area}</TableCell>
                          <TableCell>
                            <Badge variant={row.allowed ? "default" : "secondary"}>
                              {row.allowed ? t("Allowed", "अनुमत") : t("Restricted", "सीमित")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{lang === "hi" ? row.detailHi : row.detail}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                    {lang === "hi" ? (
                      <>
                        वर्तमान प्रभावी अधिकार <span className="font-medium text-foreground">{getRoleLabel(effectivePrimaryRole, lang)}</span> से प्राप्त हो रहा है, साथ में {Math.max(activeAssignments.length - 1, 0)} अतिरिक्त सक्रिय {Math.max(activeAssignments.length - 1, 0) === 1 ? "भूमिका" : "भूमिकाएँ"}।
                      </>
                    ) : (
                      <>
                        Effective authority is currently derived from <span className="font-medium text-foreground">{getRoleLabel(effectivePrimaryRole, lang)}</span> plus {Math.max(activeAssignments.length - 1, 0)} additional active {Math.max(activeAssignments.length - 1, 0) === 1 ? "role" : "roles"}.
                      </>
                    )}
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


