"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  LogIn,
  Megaphone,
  MessagesSquare,
  PenLine,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";

import type { AalekhArticle, ArticleStatus, GatividhiEvent, PracharStatus } from "@/context/AppContext";
import { useAppContext } from "@/context/AppContext";
import { useOverview } from "@/hooks/api/use-overview";
import { useUnreadCount } from "@/hooks/api/use-notifications";
import { Masthead } from "@/components/Masthead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CanonicalRoleCode } from "@/lib/app/contracts";
import { getCanonicalRoleFromUiRole, getDashboardLane } from "@/lib/app/dashboard-lane";
import { eventStatusHi } from "@/components/pages/dashboard/config";
import { statusHi as articleStatusHi } from "@/components/pages/aalekh/shared";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/utils";

type QueueItem = {
  id: string;
  kind: "event" | "article" | "prachar";
  title: string;
  meta: string;
  statusLabel: string;
  href: string;
};

function parseMaybeDate(dateIso?: string, fallback?: string) {
  const raw = dateIso ?? fallback;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value: string | null) {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function translateLaneLabel(lane: string, t: (en: string, hi: string) => string) {
  const hiMap: Record<string, string> = {
    "Unit review": "इकाई समीक्षा",
    "Aayam review": "आयाम समीक्षा",
    "Vibhag review": "विभाग समीक्षा",
    "Prant review": "प्रान्त समीक्षा",
    "Prachar follow-through": "प्रचार अनुवर्ती",
  };
  return t(lane, hiMap[lane] ?? lane);
}

function translateOverviewWarning(message: string, t: (en: string, hi: string) => string) {
  const hi = message
    .replace("Prant Sanyojak", "प्रान्त संयोजक")
    .replace("Vibhag Pramukh", "विभाग प्रमुख")
    .replace("Unit Head", "इकाई प्रमुख")
    .replace("Aayam Pramukh", "आयाम प्रमुख")
    .replace("role is not assigned.", " की भूमिका निर्धारित नहीं है।")
    .replace(" units have no active Unit Head.", " इकाइयों में सक्रिय इकाई प्रमुख नहीं है।")
    .replace(" aayams have no active Aayam Pramukh.", " आयामों में सक्रिय आयाम प्रमुख नहीं है।")
    .replace(" inactive users still hold active assignments.", " निष्क्रिय उपयोगकर्ताओं के पास अभी भी सक्रिय दायित्व हैं।")
    .replace(" items are blocked in unit review.", " प्रविष्टियाँ इकाई समीक्षा में अटकी हुई हैं।")
    .replace(" items are blocked in aayam review.", " प्रविष्टियाँ आयाम समीक्षा में अटकी हुई हैं।")
    .replace(" items are blocked in vibhag review.", " प्रविष्टियाँ विभाग समीक्षा में अटकी हुई हैं।")
    .replace(" items are blocked in prant authorization.", " प्रविष्टियाँ प्रान्त अनुमोदन में अटकी हुई हैं।");
  return t(message, hi);
}

function roleEventActionStatuses(roleCode: CanonicalRoleCode) {
  if (roleCode === "unit_head") return new Set<GatividhiEvent["status"]>(["Draft", "Returned for Revision"]);
  if (roleCode === "aayam_pramukh" || roleCode === "prant_aayam_pramukh") {
    return new Set<GatividhiEvent["status"]>(["Pending Aayam Review"]);
  }
  if (roleCode === "vibhag_pramukh") return new Set<GatividhiEvent["status"]>(["Pending Vibhag Review"]);
  if (roleCode === "prant_sanyojak" || roleCode === "kshetra_reviewer" || roleCode === "super_admin" || roleCode === "org_admin") {
    return new Set<GatividhiEvent["status"]>(["Pending Prant Authorization", "Pending Prant Dual Authorization"]);
  }
  return new Set<GatividhiEvent["status"]>([]);
}

function roleArticleActionStatuses(roleCode: CanonicalRoleCode) {
  if (roleCode === "karyakarta") return new Set<AalekhArticle["status"]>(["Draft", "Returned for Revision"]);
  if (roleCode === "unit_head") return new Set<AalekhArticle["status"]>(["Pending Unit Head Review"]);
  if (roleCode === "aayam_pramukh" || roleCode === "prant_aayam_pramukh") {
    return new Set<AalekhArticle["status"]>(["Pending Aayam Review"]);
  }
  if (roleCode === "vibhag_pramukh") return new Set<AalekhArticle["status"]>(["Pending Vibhag Review"]);
  if (roleCode === "prant_sanyojak" || roleCode === "kshetra_reviewer" || roleCode === "super_admin" || roleCode === "org_admin") {
    return new Set<AalekhArticle["status"]>(["Pending Prant Authorization"]);
  }
  return new Set<AalekhArticle["status"]>([]);
}

function isPracharPlatformResolved(
  status: PracharStatus,
  platform: "whatsapp" | "facebook" | "instagram" | "telegram",
) {
  if (status.platforms[platform]) return true;
  const reason = status.skipReasons?.[platform];
  return Boolean(reason && reason.trim());
}

function isPracharCampaignResolved(status: PracharStatus) {
  return (["whatsapp", "facebook", "instagram", "telegram"] as const).every((platform) =>
    isPracharPlatformResolved(status, platform),
  );
}

function SummaryCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof LogIn;
  tone?: "default" | "warn" | "good";
}) {
  const toneClass =
    tone === "warn"
      ? "text-amber-600 bg-amber-500/10 border-amber-500/20"
      : tone === "good"
        ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
        : "text-primary bg-primary/10 border-primary/20";

  return (
    <Card className="institution-panel">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="shell-copy">{title}</p>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            <p className="text-xs leading-5 text-muted-foreground">{detail}</p>
          </div>
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", toneClass)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminListCard({
  title,
  emptyText,
  children,
}: {
  title: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="institution-panel">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {children ? children : <p className="text-sm text-muted-foreground">{emptyText}</p>}
      </CardContent>
    </Card>
  );
}

export default function Launchpad() {
  const { role, viewer, permissions, events, articles, pracharStatuses, lang } = useAppContext();
  const t = useT();
  const isHi = lang === "hi";
  const canManageUsers = permissions.canManageUsers;
  const primaryRoleCode = viewer?.primaryRoleCode ?? getCanonicalRoleFromUiRole(role);
  const dashboardLane = getDashboardLane(primaryRoleCode);
  const isKshetraLane = primaryRoleCode === "kshetra_reviewer";
  const isPrantLane = primaryRoleCode === "prant_sanyojak";
  const viewerUserId = viewer?.userId ?? null;

  const { data: unreadCount, error: unreadError } = useUnreadCount();
  const unreadSafe = typeof unreadCount === "number" && !Number.isNaN(unreadCount) ? unreadCount : null;
  const overviewQuery = useOverview();
  const overview = overviewQuery.data;

  const actionEventStatuses = useMemo(() => roleEventActionStatuses(primaryRoleCode), [primaryRoleCode]);
  const actionArticleStatuses = useMemo(() => roleArticleActionStatuses(primaryRoleCode), [primaryRoleCode]);

  const actionableEvents = useMemo(
    () => events.filter((event) => actionEventStatuses.has(event.status)),
    [events, actionEventStatuses],
  );

  const actionableArticles = useMemo(
    () => articles.filter((article) => actionArticleStatuses.has(article.status)),
    [articles, actionArticleStatuses],
  );

  const personalEvents = useMemo(
    () => (viewerUserId ? actionableEvents.filter((event) => event.createdByUserId === viewerUserId) : actionableEvents),
    [actionableEvents, viewerUserId],
  );

  const personalArticles = useMemo(
    () =>
      viewerUserId
        ? actionableArticles.filter(
            (article) => article.authorUserId === viewerUserId || article.createdByUserId === viewerUserId,
          )
        : actionableArticles,
    [actionableArticles, viewerUserId],
  );

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const floor = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return events
      .map((event) => ({ event, date: parseMaybeDate(event.dateIso, event.date) }))
      .filter((row): row is { event: GatividhiEvent; date: Date } => Boolean(row.date))
      .filter((row) => row.date >= floor)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5)
      .map((row) => row.event);
  }, [events]);

  const pracharCampaigns = useMemo(() => {
    const byEventId = new Map(pracharStatuses.map((status) => [status.eventId, status]));
    const published = events.filter((event) => event.status === "Published");
    const rows = published.map((event) => ({
      event,
      status:
        byEventId.get(event.id) ?? ({
          eventId: event.id,
          platforms: { whatsapp: false, facebook: false, instagram: false, telegram: false },
          skipReasons: { whatsapp: null, facebook: null, instagram: null, telegram: null },
        } as PracharStatus),
    }));

    return {
      total: rows.length,
      open: rows.filter((row) => !isPracharCampaignResolved(row.status)),
    };
  }, [events, pracharStatuses]);

  const queue = useMemo(() => {
    const items: QueueItem[] = [];
    const eventQueueSource =
      primaryRoleCode === "karyakarta" || primaryRoleCode === "unit_head" ? personalEvents : actionableEvents;
    const articleQueueSource =
      primaryRoleCode === "karyakarta" || primaryRoleCode === "unit_head" ? personalArticles : actionableArticles;

    eventQueueSource.slice(0, 6).forEach((event) => {
      items.push({
        id: event.id,
        kind: "event",
        title: event.title,
        meta: `${event.unit} · ${event.date}`,
        statusLabel: event.status,
        href: "/dashboard",
      });
    });

    articleQueueSource.slice(0, 6).forEach((article) => {
      items.push({
        id: article.id,
        kind: "article",
        title: article.title,
        meta: `${article.author} · ${article.date}`,
        statusLabel: article.status,
        href: "/aalekh",
      });
    });

    if (permissions.canUpdatePrachar) {
      pracharCampaigns.open.slice(0, 6).forEach(({ event, status }) => {
        const resolvedCount = (["whatsapp", "facebook", "instagram", "telegram"] as const).filter((platform) =>
          isPracharPlatformResolved(status, platform),
        ).length;

        items.push({
          id: event.id,
          kind: "prachar",
          title: event.title,
          meta: t(`${resolvedCount}/4 channels resolved`, `${resolvedCount}/4 माध्यम पूर्ण`),
          statusLabel: t("Reach pending", "पहुँच लंबित"),
          href: "/prachar",
        });
      });
    }

    return items.slice(0, 12);
  }, [
    actionableArticles,
    actionableEvents,
    permissions.canUpdatePrachar,
    personalArticles,
    personalEvents,
    pracharCampaigns.open,
    primaryRoleCode,
    t,
  ]);

  const quickActions = useMemo(
    () =>
      [
        {
          key: "events",
          title: t("Event workflow", "कार्यक्रम कार्यप्रवाह"),
          body: t(
            "Pre-event planning, vritt, attendance, approvals.",
            "पूर्व-कार्यक्रम योजना, वृत्त, उपस्थिति और अनुमोदन।",
          ),
          href: "/dashboard",
          icon: LayoutDashboard,
          accent: "from-primary/12 to-primary/4 border-primary/20",
          highlight: true,
        },
        {
          key: "prachar",
          title: t("Prachar follow-through", "प्रचार अनुवर्तन"),
          body: t(
            "Complete channel coverage and document skipped platforms.",
            "चैनल कवरेज पूर्ण करें और छोड़े गए माध्यमों का कारण दर्ज करें।",
          ),
          href: "/prachar",
          icon: Megaphone,
          accent: "from-emerald-500/12 to-emerald-500/4 border-emerald-500/20",
          highlight: true,
        },
        {
          key: "aalekh",
          title: t("Aalekh desk", "आलेख डेस्क"),
          body: t(
            "Write, review, and publish through the governed workflow.",
            "नियंत्रित कार्यप्रवाह के माध्यम से लिखें, समीक्षा करें और प्रकाशित करें।",
          ),
          href: "/aalekh",
          icon: PenLine,
          accent: "from-blue-500/12 to-blue-500/4 border-blue-500/20",
          highlight: false,
        },
        {
          key: "calendar",
          title: t("Annual calendar", "वार्षिक पंचांग"),
          body: t("See upcoming programmes and reminder rhythms.", "आगामी कार्यक्रम और स्मरण लय देखें।"),
          href: "/calendar",
          icon: CalendarDays,
          accent: "from-amber-500/12 to-amber-500/4 border-amber-500/20",
          highlight: false,
        },
        {
          key: "vimarsh",
          title: t("Vimarsh topics", "विमर्श विषय"),
          body: t(
            "Open curated discourse material and subject resources.",
            "चयनित विमर्श सामग्री और विषय संसाधन खोलें।",
          ),
          href: "/vimarsh",
          icon: MessagesSquare,
          accent: "from-violet-500/12 to-violet-500/4 border-violet-500/20",
          highlight: false,
        },
        {
          key: "library",
          title: t("E-Library", "ई-पुस्तकालय"),
          body: t(
            "Access PDFs and study material for circles and sessions.",
            "मंडलियों और सत्रों हेतु पीडीएफ़ व अध्ययन सामग्री देखें।",
          ),
          href: "/library",
          icon: BookOpen,
          accent: "from-orange-500/12 to-orange-500/4 border-orange-500/20",
          highlight: false,
        },
        {
          key: "sampark",
          title: t("Sampark directory", "सम्पर्क निर्देशिका"),
          body: t("Find the right contact across units and aayams.", "इकाइयों और आयामों में सही सम्पर्क खोजें।"),
          href: "/directory",
          icon: Users,
          accent: "from-slate-500/12 to-slate-500/4 border-slate-500/20",
          highlight: false,
        },
      ] as const,
    [t],
  );

  const contexts = [
    {
      labelEn: "Pilot scope",
      labelHi: "पायलट क्षेत्र",
      valueEn: "Bhopal Vibhag",
      valueHi: "भोपाल विभाग",
      detailEn: "Workflow, access, and oversight are being verified here first.",
      detailHi: "कार्यप्रवाह, प्रवेश और निगरानी का सत्यापन पहले यहीं किया जा रहा है।",
    },
    {
      labelEn: "Action queue",
      labelHi: "कार्य कतार",
      valueEn: `${queue.length} items`,
      valueHi: `${queue.length} कार्य`,
      detailEn: "Items that still need action in the current workflow lanes.",
      detailHi: "वर्तमान कार्यप्रवाह धारा में जिन कार्यों पर अभी कार्रवाई बाकी है।",
    },
    {
      labelEn: "Notifications",
      labelHi: "सूचनाएँ",
      valueEn: unreadSafe === null ? "--" : `${unreadSafe} unread`,
      valueHi: unreadSafe === null ? "--" : `${unreadSafe} अपठित`,
      detailEn: unreadSafe === null && unreadError ? "Notification count is not available." : "Role-relevant updates from the system.",
      detailHi: unreadSafe === null && unreadError ? "सूचना गणना अभी उपलब्ध नहीं है।" : "प्रणाली से भूमिका-सम्बन्धित अद्यतन।",
    },
  ];

  const summaryCards: Array<{
    title: string;
    value: string;
    detail: string;
    icon: typeof LogIn;
    tone: "default" | "warn" | "good";
  }> = [
    {
      title: t("Login health", "लॉगिन स्वास्थ्य"),
      value:
        overview && !overviewQuery.isError
          ? `${overview.login.loggedInLast7Days}/${overview.login.activeAccounts}`
          : "--",
      detail:
        overview && !overviewQuery.isError
          ? `${overview.login.successLast30Days} ${t("successful logins in 30 days", "पिछले 30 दिनों में सफल लॉगिन")}`
          : t("Recent login activity will load here.", "हाल की लॉगिन गतिविधि यहाँ दिखाई देगी।"),
      icon: LogIn,
      tone: "default" as const,
    },
    {
      title: t("Approval load", "अनुमोदन भार"),
      value:
        overview && !overviewQuery.isError
          ? `${overview.workflow.pendingEvents + overview.workflow.pendingArticles}`
          : `${actionableEvents.length + actionableArticles.length}`,
      detail:
        overview && !overviewQuery.isError
          ? t(
              `${overview.workflow.pendingEvents} events · ${overview.workflow.pendingArticles} articles`,
              `${overview.workflow.pendingEvents} कार्यक्रम · ${overview.workflow.pendingArticles} आलेख`,
            )
          : t("Pending items across approval lanes.", "अनुमोदन धाराओं में लंबित प्रविष्टियाँ।"),
      icon: Clock,
      tone: "warn" as const,
    },
    {
      title: t("Prachar closure", "प्रचार समापन"),
      value:
        overview && !overviewQuery.isError
          ? `${overview.workflow.openPracharCampaigns}`
          : `${pracharCampaigns.open.length}`,
      detail:
        overview && !overviewQuery.isError
          ? t("Published campaigns still needing channel completion", "प्रकाशित अभियानों में अभी चैनल समापन बाकी है।")
          : t("Open dissemination follow-through", "प्रसार अनुवर्ती खुला है"),
      icon: Megaphone,
      tone: overview?.workflow.openPracharCampaigns ? "warn" : "good",
    },
    {
      title: t("Hierarchy health", "संरचना स्वास्थ्य"),
      value:
        overview && !overviewQuery.isError
          ? `${overview.hierarchy.totalWarnings}`
          : "--",
      detail:
        overview && !overviewQuery.isError
          ? t("Warnings across roles, assignment gaps, and workflow chains", "भूमिकाओं, दायित्व अंतराल और कार्यप्रवाह शृंखला में चेतावनियाँ")
          : t("Role coverage and hierarchy checks", "भूमिका कवरेज और संरचना जाँच"),
      icon: ShieldAlert,
      tone: overview?.hierarchy.totalWarnings ? "warn" : "good",
    },
    ...(dashboardLane === "prant"
      ? [
          {
            title: isKshetraLane
              ? t("Escalation pressure", "अग्रेषण दबाव")
              : t("Final approvals", "अंतिम अनुमोदन"),
            value: `${isKshetraLane ? (overview ? overview.workflow.stalledEvents + overview.workflow.stalledArticles : 0) : (overview?.workflow.roleLaneCounts?.find((lane) => lane.lane === "Prant review")?.count ?? 0)}`,
            detail: isKshetraLane
              ? t(
                  "Stalled cross-vibhag items needing kshetra attention.",
                  "कई विभागों से जुड़े अटके कार्य जिन पर क्षेत्रीय ध्यान देना आवश्यक है।",
                )
              : t(
                  "Items currently awaiting prant authorization.",
                  "वर्तमान में प्रान्त अनुमोदन की प्रतीक्षा में लंबित प्रविष्टियाँ।",
                ),
            icon: isKshetraLane ? AlertTriangle : ShieldCheck,
            tone:
              (isKshetraLane
                ? (overview ? overview.workflow.stalledEvents + overview.workflow.stalledArticles : 0)
                : (overview?.workflow.roleLaneCounts?.find((lane) => lane.lane === "Prant review")?.count ?? 0)) > 0
                ? ("warn" as const)
                : ("good" as const),
          },
        ]
      : []),
  ];

  const laneCounts = overview?.workflow.roleLaneCounts ?? [];
  const hierarchyMessages = overview?.hierarchy.warningMessages ?? [];
  const adminDetails = overview?.admin ?? null;
  const dashboardFrame =
    dashboardLane === "super_admin"
      ? {
          seal: "ERP Governance Center",
          sealHi: "ईआरपी शासन केन्द्र",
          title: "System Oversight Dashboard",
          titleHi: "प्रणाली पर्यवेक्षण डैशबोर्ड",
          subtitleEn:
            "Monitor account health, blocked workflows, hierarchy gaps, and organisation-wide operational pressure.",
          subtitleHi:
            "खातों की स्थिति, अवरुद्ध कार्यप्रवाह, पदानुक्रम में अंतराल और संपूर्ण संगठन के संचालन दबाव पर नज़र रखें।",
        }
      : isKshetraLane
        ? {
            seal: "Kshetra Review Center",
            sealHi: "क्षेत्र समीक्षा केन्द्र",
            title: "Kshetra Escalation Dashboard",
            titleHi: "क्षेत्र अग्रेषण डैशबोर्ड",
            subtitleEn:
              "Track cross-vibhag escalation pressure, stalled review lanes, and structural risk before wider rollout.",
            subtitleHi:
              "कई विभागों पर फैला अग्रेषण दबाव, रुकी हुई समीक्षा धाराएँ और व्यापक विस्तार से पहले संरचनात्मक जोखिम पर ध्यान दें।",
          }
        : {
            seal: "Prant Operations Center",
            sealHi: "प्रान्त संचालन केन्द्र",
            title: "Prant Oversight Dashboard",
            titleHi: "प्रान्त पर्यवेक्षण डैशबोर्ड",
            subtitleEn:
              "Track final approvals, delayed vibhags, escalation pressure, and hierarchy health across the prant lane.",
            subtitleHi:
              "अंतिम अनुमोदन, विलंबित विभाग, अग्रेषण दबाव और प्रान्त धारा में संरचना स्वास्थ्य पर नज़र रखें।",
          };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-10">
      <Masthead
        seal={dashboardFrame.seal}
        sealHi={dashboardFrame.sealHi}
        title={dashboardFrame.title}
        titleHi={dashboardFrame.titleHi}
        subtitle={dashboardFrame.subtitleEn}
        subtitleHi={dashboardFrame.subtitleHi}
        contexts={contexts}
        lang={isHi ? "hi" : "en"}
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link href="/dashboard">
              <Button className="h-11 rounded-2xl gap-2">
                <LayoutDashboard className="w-4 h-4" />
                {t("Open Events Queue", "कार्यक्रम कतार खोलें")}
              </Button>
            </Link>
            <Link href="/prachar">
              <Button variant="outline" className="h-11 rounded-2xl gap-2">
                <Megaphone className="w-4 h-4" />
                {t("Open Prachar Flow", "प्रचार प्रवाह खोलें")}
              </Button>
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="institution-panel">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">{t("Approval visibility", "अनुमोदन दृश्यता")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {laneCounts.length ? (
                laneCounts.map((lane) => (
                  <div key={lane.lane} className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-4">
                    <p className="shell-copy">{translateLaneLabel(lane.lane, t)}</p>
                    <p className="mt-2 text-2xl font-semibold">{lane.count}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
                  {overviewQuery.isLoading ? t("Loading approval overview...", "अनुमोदन अवलोकन लोड हो रहा है...") : t("Approval overview is not available yet.", "अनुमोदन अवलोकन अभी उपलब्ध नहीं है।")}
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-4">
                <p className="shell-copy">{t("Published events", "प्रकाशित कार्यक्रम")}</p>
                <p className="mt-2 text-xl font-semibold">{overview?.workflow.publishedEvents ?? "--"}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-4">
                <p className="shell-copy">{t("Published articles", "प्रकाशित आलेख")}</p>
                <p className="mt-2 text-xl font-semibold">{overview?.workflow.publishedArticles ?? "--"}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-4">
                <p className="shell-copy">{t("Stalled items", "अटकी हुई प्रविष्टियाँ")}</p>
                <p className="mt-2 text-xl font-semibold">
                  {overview ? overview.workflow.stalledEvents + overview.workflow.stalledArticles : "--"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="institution-panel">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">{t("Hierarchy health", "संरचना स्वास्थ्य")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {hierarchyMessages.length ? (
              hierarchyMessages.map((message) => (
                <div key={message} className="rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-foreground/85">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <p className="leading-6">{translateOverviewWarning(message, t)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-4 text-sm text-foreground/85">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="leading-6">
                    {overviewQuery.isLoading
                      ? t("Checking hierarchy and role coverage...", "संरचना और भूमिका कवरेज जाँची जा रही है...")
                      : t("No hierarchy warnings found in the current overview.", "वर्तमान अवलोकन में कोई संरचनात्मक चेतावनी नहीं मिली।")}
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-4">
                <p className="shell-copy">{t("Missing Unit Heads", "अनुपस्थित इकाई प्रमुख")}</p>
                <p className="mt-2 text-xl font-semibold">{overview?.hierarchy.missingUnitHeads ?? "--"}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-4">
                <p className="shell-copy">{t("Missing Aayam Heads", "अनुपस्थित आयाम प्रमुख")}</p>
                <p className="mt-2 text-xl font-semibold">{overview?.hierarchy.missingAayamHeads ?? "--"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="institution-panel">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">{t("Work lanes", "कार्य धाराएँ")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.key} href={action.href} className="group">
                    <Card
                      className={cn(
                        "h-full overflow-hidden border border-border/60 bg-gradient-to-br transition-all hover:-translate-y-0.5 hover:shadow-lg",
                        action.accent,
                        action.highlight ? "shadow-md" : "",
                      )}
                    >
                      <CardContent className="pt-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/50 bg-background/60">
                            <Icon className="h-5 w-5 text-foreground/80" />
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <div className="space-y-1">
                          <p className={cn("text-sm font-semibold", isHi && "font-devanagari")}>{action.title}</p>
                          <p className={cn("text-xs leading-5 text-muted-foreground", isHi && "font-devanagari")}>
                            {action.body}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="institution-panel">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">{t("My action queue", "मेरी कार्य कतार")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {queue.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                {t("No pending items are assigned to your current workflow lane.", "आपकी वर्तमान कार्यधारा में कोई लंबित कार्य नहीं है।")}
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map((item) => {
                  const chipClass =
                    item.kind === "event"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : item.kind === "article"
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";

                  const kindLabel =
                    item.kind === "event"
                      ? t("Event", "कार्यक्रम")
                      : item.kind === "article"
                        ? t("Article", "आलेख")
                        : t("Prachar", "प्रचार");
                  const statusHiText =
                    item.kind === "event"
                      ? eventStatusHi[item.statusLabel] ?? item.statusLabel
                      : item.kind === "article"
                        ? articleStatusHi[item.statusLabel as ArticleStatus] ?? item.statusLabel
                        : item.statusLabel;

                  return (
                    <Link key={`${item.kind}-${item.id}`} href={item.href} className="group block">
                      <div className="flex items-start gap-4 rounded-2xl border border-border/70 bg-background/70 px-4 py-4 transition-all group-hover:border-primary/30">
                        <Badge
                          className={cn(
                            "shrink-0 border text-[10px] uppercase tracking-[0.16em]",
                            chipClass,
                            isHi && "font-devanagari normal-case tracking-normal",
                          )}
                        >
                          {kindLabel}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-sm font-semibold transition-colors group-hover:text-primary",
                              isHi && "font-devanagari",
                            )}
                          >
                            {item.title}
                          </p>
                          <p className={cn("mt-1 truncate text-xs text-muted-foreground", isHi && "font-devanagari")}>
                            {item.meta}
                          </p>
                          <p className={cn("mt-2 text-[11px] text-muted-foreground", isHi && "font-devanagari")}>
                            <span className="font-medium text-foreground/80">{t("Status:", "स्थिति:")}</span>{" "}
                            {t(item.statusLabel, statusHiText)}
                          </p>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="mt-5 border-t border-border/60 pt-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="shell-copy">{t("Upcoming programmes", "आगामी कार्यक्रम")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("Keep the next programmes visible while you clear the queue.", "कतार साफ़ करते समय आगामी कार्यक्रम भी दृष्टि में रखें।")}
                  </p>
                </div>
                <Link href="/calendar">
                  <Button variant="outline" className="h-10 rounded-2xl gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {t("Open Calendar", "कैलेंडर खोलें")}
                  </Button>
                </Link>
              </div>

              {upcomingEvents.length ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                      <p className="truncate text-xs font-semibold">{event.title}</p>
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">
                        {event.unit} · {event.date}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">{t("No upcoming events recorded yet.", "अभी कोई आगामी कार्यक्रम दर्ज नहीं है।")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {canManageUsers ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="dashboard-section-heading">{t("Admin detail", "प्रशासन विवरण")}</h2>
            <Link href="/super-admin">
              <Button variant="outline" className="h-10 rounded-2xl gap-2">
                <ShieldCheck className="h-4 w-4" />
                {t("Open System Access", "प्रवेश नियंत्रण खोलें")}
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <AdminListCard title={t("Recent logins", "हाल के लॉगिन")} emptyText={t("No recent logins recorded.", "हाल का कोई लॉगिन दर्ज नहीं है।")}>
              {adminDetails?.recentLogins?.length ? (
                <div className="space-y-3">
                  {adminDetails.recentLogins.map((record) => (
                    <div key={record.userId} className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">{record.displayName || record.email || "Unnamed user"}</p>
                          <p className="text-xs text-muted-foreground">{record.email || "No email"}</p>
                        </div>
                        <div className="space-y-1 text-left sm:text-right">
                          <Badge variant={record.isActive ? "default" : "secondary"}>
                            {record.primaryRoleCode ?? "unassigned"}
                          </Badge>
                          <p className="text-xs text-muted-foreground">{formatDateTime(record.lastLoginAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </AdminListCard>

            <AdminListCard title={t("Recent workflow actors", "हाल के कार्यकर्ता")} emptyText={t("No workflow actors recorded.", "हाल की कोई कार्य प्रविष्टि दर्ज नहीं है।")}>
              {adminDetails?.recentActors?.length ? (
                <div className="space-y-3">
                  {adminDetails.recentActors.map((actor) => (
                    <div key={actor.userId} className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">{actor.displayName || actor.email || "Unnamed user"}</p>
                          <p className="text-xs text-muted-foreground">{actor.email || "No email"}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div>
                            <p className="font-semibold">{actor.createdCount}</p>
                            <p className={cn("text-muted-foreground", isHi && "font-devanagari")}>
                              {t("Created", "निर्मित")}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold">{actor.reviewCount}</p>
                            <p className={cn("text-muted-foreground", isHi && "font-devanagari")}>
                              {t("Reviewed", "समीक्षित")}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold">{actor.publishedCount}</p>
                            <p className={cn("text-muted-foreground", isHi && "font-devanagari")}>
                              {t("Published", "प्रकाशित")}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className={cn("mt-2 text-xs text-muted-foreground", isHi && "font-devanagari")}>
                        {t("Last action:", "अंतिम कार्यवाही:")} {formatDateTime(actor.lastActionAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </AdminListCard>
          </div>
        </section>
      ) : null}
    </motion.div>
  );
}


