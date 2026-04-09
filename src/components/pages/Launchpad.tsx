"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  PenLine,
  Users,
} from "lucide-react";

import { useAppContext, type Role, type GatividhiEvent, type AalekhArticle, type PracharStatus } from "@/context/AppContext";
import { Masthead } from "@/components/Masthead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUnreadCount } from "@/hooks/api/use-notifications";
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
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function roleEventActionStatuses(role: Role) {
  if (role === "unit_head") return new Set<GatividhiEvent["status"]>(["Draft", "Returned for Revision"]);
  if (role === "aayam_pramukh") return new Set<GatividhiEvent["status"]>(["Pending Aayam Review"]);
  if (role === "vibhag_pramukh")
    return new Set<GatividhiEvent["status"]>([
      "Pending Vibhag Review",
      "Pending Prant Authorization",
      "Pending Prant Dual Authorization",
    ]);
  return new Set<GatividhiEvent["status"]>();
}

function roleArticleActionStatuses(role: Role) {
  if (role === "karyakarta") return new Set<AalekhArticle["status"]>(["Draft", "Returned for Revision"]);
  if (role === "unit_head") return new Set<AalekhArticle["status"]>(["Pending Unit Head Review"]);
  if (role === "aayam_pramukh") return new Set<AalekhArticle["status"]>(["Pending Aayam Review"]);
  if (role === "vibhag_pramukh")
    return new Set<AalekhArticle["status"]>(["Pending Vibhag Review", "Pending Prant Authorization"]);
  return new Set<AalekhArticle["status"]>();
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
  return (["whatsapp", "facebook", "instagram", "telegram"] as const).every((p) => isPracharPlatformResolved(status, p));
}

export default function Launchpad() {
  const { role, permissions, events, articles, pracharStatuses, lang } = useAppContext();
  const t = useT();
  const isHi = lang === "hi";

  const { data: unreadCount, error: unreadError } = useUnreadCount();
  const unreadSafe = typeof unreadCount === "number" && !Number.isNaN(unreadCount) ? unreadCount : null;

  const actionEventStatuses = useMemo(() => roleEventActionStatuses(role), [role]);
  const actionArticleStatuses = useMemo(() => roleArticleActionStatuses(role), [role]);

  const actionableEvents = useMemo(
    () => events.filter((e) => actionEventStatuses.has(e.status)),
    [events, actionEventStatuses],
  );

  const actionableArticles = useMemo(
    () => articles.filter((a) => actionArticleStatuses.has(a.status)),
    [articles, actionArticleStatuses],
  );

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const floor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return events
      .map((e) => ({ event: e, date: parseMaybeDate(e.dateIso, e.date) }))
      .filter((row): row is { event: GatividhiEvent; date: Date } => Boolean(row.date))
      .filter((row) => row.date >= floor)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5)
      .map((row) => row.event);
  }, [events]);

  const pracharCampaigns = useMemo(() => {
    const byEventId = new Map(pracharStatuses.map((s) => [s.eventId, s]));
    const published = events.filter((e) => e.status === "Published");
    const rows = published.map((event) => ({
      event,
      status:
        byEventId.get(event.id) ?? ({
          eventId: event.id,
          platforms: { whatsapp: false, facebook: false, instagram: false, telegram: false },
          skipReasons: { whatsapp: null, facebook: null, instagram: null, telegram: null },
        } as PracharStatus),
    }));

    const resolved = rows.filter((r) => isPracharCampaignResolved(r.status));
    const open = rows.filter((r) => !isPracharCampaignResolved(r.status));

    return { total: rows.length, resolved, open };
  }, [events, pracharStatuses]);

  const queue = useMemo(() => {
    const items: QueueItem[] = [];

    actionableEvents
      .slice(0, 6)
      .forEach((event) => {
        items.push({
          id: event.id,
          kind: "event",
          title: event.title,
          meta: `${event.unit} · ${event.date}`,
          statusLabel: event.status,
          href: "/dashboard",
        });
      });

    actionableArticles
      .slice(0, 6)
      .forEach((article) => {
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
        const resolvedCount = (["whatsapp", "facebook", "instagram", "telegram"] as const).filter((p) =>
          isPracharPlatformResolved(status, p),
        ).length;
        items.push({
          id: event.id,
          kind: "prachar",
          title: event.title,
          meta: `${resolvedCount}/4 ${t("channels resolved", "चैनल पूर्ण/स्किप दर्ज")}`,
          statusLabel: t("Reach pending", "पहुँच लंबित"),
          href: "/prachar",
        });
      });
    }

    return items.slice(0, 12);
  }, [actionableArticles, actionableEvents, permissions.canUpdatePrachar, pracharCampaigns.open, t]);

  const contexts = useMemo(
    () => [
      {
        labelEn: "Pilot scope",
        labelHi: "पायलट दायरा",
        valueEn: "Bhopal Vibhag",
        valueHi: "भोपाल विभाग",
        detailEn: "Start here. Scale to all vibhags after stability.",
        detailHi: "पहले यहाँ स्थिर करें, फिर 8 विभागों में विस्तार।",
      },
      {
        labelEn: "Action queue",
        labelHi: "कार्य कतार",
        valueEn: `${queue.length} items`,
        valueHi: `${queue.length} कार्य`,
        detailEn: "Items that need review, follow-through, or revision.",
        detailHi: "समीक्षा/अनुवर्तन/संशोधन हेतु कार्य।",
      },
      {
        labelEn: "Notifications",
        labelHi: "सूचनाएँ",
        valueEn: unreadSafe === null ? "—" : `${unreadSafe} unread`,
        valueHi: unreadSafe === null ? "—" : `${unreadSafe} अपठित`,
        detailEn: unreadSafe === null && unreadError ? "Not available yet." : "Role-relevant updates.",
        detailHi: unreadSafe === null && unreadError ? "अभी उपलब्ध नहीं।" : "भूमिका अनुसार अपडेट।",
      },
    ],
    [queue.length, unreadError, unreadSafe],
  );

  const quickActions = useMemo(
    () => [
      {
        key: "events",
        titleEn: "Event Workflow",
        titleHi: "कार्यक्रम प्रवाह",
        bodyEn: "Pre-event planning, post-event vritt, attendance, approvals.",
        bodyHi: "पूर्व-कार्य, वृत्त, उपस्थिति, अनुमोदन।",
        href: "/dashboard",
        icon: LayoutDashboard,
        accent: "from-primary/12 to-primary/4 border-primary/20",
        highlight: true,
      },
      {
        key: "prachar",
        titleEn: "Prachar Follow-through",
        titleHi: "प्रचार अनुवर्तन",
        bodyEn: "Confirm distribution across channels with skip reasons.",
        bodyHi: "चैनल वार प्रसार की पुष्टि, स्किप कारण सहित।",
        href: "/prachar",
        icon: Megaphone,
        accent: "from-emerald-500/12 to-emerald-500/4 border-emerald-500/20",
        highlight: true,
      },
      {
        key: "aalekh",
        titleEn: "Aalekh Desk",
        titleHi: "आलेख कक्ष",
        bodyEn: "Write, review, and publish with governed workflow.",
        bodyHi: "नियंत्रित प्रवाह में लेखन, समीक्षा, प्रकाशन।",
        href: "/aalekh",
        icon: PenLine,
        accent: "from-blue-500/12 to-blue-500/4 border-blue-500/20",
      },
      {
        key: "calendar",
        titleEn: "Annual Calendar",
        titleHi: "वार्षिक पंचांग",
        bodyEn: "Institutional rhythm and reminders.",
        bodyHi: "संगठनात्मक लय और स्मरण।",
        href: "/calendar",
        icon: CalendarDays,
        accent: "from-amber-500/12 to-amber-500/4 border-amber-500/20",
      },
      {
        key: "vimarsh",
        titleEn: "Vimarsh Topics",
        titleHi: "विमर्श विषय",
        bodyEn: "Curated resources across discourse bindu.",
        bodyHi: "विषयवार चुने हुए संसाधन।",
        href: "/vimarsh",
        icon: MessagesSquare,
        accent: "from-violet-500/12 to-violet-500/4 border-violet-500/20",
      },
      {
        key: "library",
        titleEn: "E‑Library",
        titleHi: "ई‑पुस्तकालय",
        bodyEn: "PDF archive for study circles (curated).",
        bodyHi: "अध्ययन हेतु PDF संग्रह (क्यूरेटेड)।",
        href: "/library",
        icon: BookOpen,
        accent: "from-orange-500/12 to-orange-500/4 border-orange-500/20",
      },
      {
        key: "sampark",
        titleEn: "Sampark Directory",
        titleHi: "संपर्क निर्देशिका",
        bodyEn: "Find the right aayam/pramukh across units.",
        bodyHi: "इकाई/आयाम अनुसार सही संपर्क।",
        href: "/directory",
        icon: Users,
        accent: "from-slate-500/12 to-slate-500/4 border-slate-500/20",
      },
    ],
    [],
  );

  const actionSummary = useMemo(() => {
    const pendingEvents = actionableEvents.length;
    const pendingArticles = actionableArticles.length;
    const pendingPrachar = permissions.canUpdatePrachar ? pracharCampaigns.open.length : 0;
    return { pendingEvents, pendingArticles, pendingPrachar };
  }, [actionableArticles.length, actionableEvents.length, permissions.canUpdatePrachar, pracharCampaigns.open.length]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-10">
      <Masthead
        seal={t("ERP Launchpad", "ERP लॉन्चपैड")}
        sealHi={t("ERP Launchpad", "ERP लॉन्चपैड")}
        title={t("Pragya Pravah — Operational Home", "प्रज्ञा प्रवाह — संचालन गृह")}
        titleHi={t("Pragya Pravah — Operational Home", "प्रज्ञा प्रवाह — संचालन गृह")}
        subtitle={t(
          "Quick access for Bhopal Vibhag pilot: review queues, prachar follow-through, and governed publishing.",
          "भोपाल विभाग पायलट हेतु त्वरित पहुँच: समीक्षा कतार, प्रचार अनुवर्तन, और नियंत्रित प्रकाशन।",
        )}
        subtitleHi={t(
          "Quick access for Bhopal Vibhag pilot: review queues, prachar follow-through, and governed publishing.",
          "भोपाल विभाग पायलट हेतु त्वरित पहुँच: समीक्षा कतार, प्रचार अनुवर्तन, और नियंत्रित प्रकाशन।",
        )}
        contexts={contexts}
        lang={isHi ? "hi" : "en"}
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link href="/dashboard">
              <Button className="h-11 rounded-2xl gap-2">
                <LayoutDashboard className="w-4 h-4" />
                {t("Open Dashboard", "डैशबोर्ड खोलें")}
              </Button>
            </Link>
            <Link href="/prachar">
              <Button variant="outline" className="h-11 rounded-2xl gap-2">
                <Megaphone className="w-4 h-4" />
                {t("Open Prachar", "प्रचार खोलें")}
              </Button>
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="institution-panel">
          <CardContent className="pt-5">
            <p className="shell-copy">{t("Pending reviews", "समीक्षा लंबित")}</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-border/50 bg-muted/20 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t("Events", "कार्यक्रम")}</p>
                <p className="mt-1 text-xl font-semibold">{actionSummary.pendingEvents}</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-muted/20 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t("Aalekh", "आलेख")}</p>
                <p className="mt-1 text-xl font-semibold">{actionSummary.pendingArticles}</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-muted/20 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t("Prachar", "प्रचार")}</p>
                <p className="mt-1 text-xl font-semibold">{permissions.canUpdatePrachar ? actionSummary.pendingPrachar : "—"}</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              {t(
                "This reflects what needs action in your current dayitva lane.",
                "यह आपके वर्तमान दायित्व के अनुसार कार्य दर्शाता है।",
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="institution-panel lg:col-span-2">
          <CardContent className="pt-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="shell-copy">{t("Upcoming rhythm", "आगामी लय")}</p>
                <h2 className="mt-2 text-lg font-semibold">{t("Next programmes", "अगले कार्यक्रम")}</h2>
              </div>
              <Link href="/calendar" className="shrink-0">
                <Button variant="outline" className="h-10 rounded-2xl gap-2">
                  <CalendarDays className="w-4 h-4" />
                  {t("Open Calendar", "पंचांग खोलें")}
                </Button>
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {t("No upcoming events recorded yet.", "अभी कोई आगामी कार्यक्रम दर्ज नहीं।")}
              </p>
            ) : (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {upcomingEvents.map((e) => (
                  <div key={e.id} className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3">
                    <p className="text-xs font-semibold truncate">{e.title}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground truncate">
                      {e.unit} · {e.date}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="dashboard-section-heading">{t("Quick actions", "त्वरित कार्य")}</h2>
          <Badge variant="outline" className="text-[10px] uppercase tracking-[0.16em]">
            {t("Pilot priority: Events + Prachar", "पायलट प्राथमिकता: कार्यक्रम + प्रचार")}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.key} href={action.href} className="group">
                <Card
                  className={cn(
                    "h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg",
                    "border border-border/60 bg-gradient-to-br",
                    action.accent,
                    action.highlight ? "shadow-md" : "",
                  )}
                >
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-background/60 border border-border/50 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-foreground/80" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="space-y-1">
                      <p className={cn("text-sm font-semibold", isHi && "font-devanagari")}>
                        {t(action.titleEn, action.titleHi)}
                      </p>
                      <p className={cn("text-xs text-muted-foreground leading-5", isHi && "font-devanagari")}>
                        {t(action.bodyEn, action.bodyHi)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="dashboard-section-heading">{t("My queue", "मेरी कतार")}</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{t("Actionable items first", "पहले आवश्यक कार्य")}</span>
          </div>
        </div>

        {queue.length === 0 ? (
          <Card className="institution-panel-muted">
            <CardContent className="py-10 text-center text-muted-foreground text-sm space-y-3">
              <CheckCircle2 className="w-8 h-8 mx-auto opacity-40" />
              <p>{t("No pending items in your lane right now.", "अभी आपके दायित्व में कोई लंबित कार्य नहीं।")}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <Link href="/dashboard">
                  <Button variant="outline" className="h-10 rounded-2xl">
                    {t("Open Dashboard", "डैशबोर्ड खोलें")}
                  </Button>
                </Link>
                <Link href="/prachar">
                  <Button variant="outline" className="h-10 rounded-2xl">
                    {t("Open Prachar", "प्रचार खोलें")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2 lg:grid-cols-2">
            {queue.map((item) => {
              const badge =
                item.kind === "event"
                  ? t("Event", "कार्यक्रम")
                  : item.kind === "article"
                    ? t("Aalekh", "आलेख")
                    : t("Prachar", "प्रचार");
              const chipClass =
                item.kind === "event"
                  ? "bg-primary/10 text-primary border-primary/20"
                  : item.kind === "article"
                    ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";

              return (
                <Link key={`${item.kind}-${item.id}`} href={item.href} className="group">
                  <Card className="institution-panel-muted hover:border-primary/25 transition-all">
                    <CardContent className="py-4 flex items-start gap-4">
                      <Badge className={cn("shrink-0 border text-[10px] uppercase tracking-[0.16em]", chipClass)}>
                        {badge}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{item.meta}</p>
                        <p className="text-[11px] text-muted-foreground mt-2">
                          <span className="font-medium text-foreground/80">{t("Status", "स्थिति")}:</span>{" "}
                          {item.statusLabel}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </motion.div>
  );
}

