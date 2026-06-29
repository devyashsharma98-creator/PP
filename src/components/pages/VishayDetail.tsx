"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, PenLine, CalendarDays, GraduationCap, FileText, Layers, BookMarked, FlaskConical } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import { useVishayContent } from "@/hooks/api/use-vishayas";
import { vishayaColor, vishayaIcon } from "@/lib/app/vishaya-style";

function formatEventDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function VishayDetail({ vishayId }: { vishayId: string }) {
  const t = useT();
  const isHi = t("en", "hi") === "hi";
  const { data, isLoading, error } = useVishayContent(vishayId);

  if (error) {
    return (
      <div className="space-y-6 py-10">
        <Link href="/vishay"><Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4" />{t("Back to Vishay", "विषय पर वापस")}</Button></Link>
        <div className="py-24 text-center text-sm text-muted-foreground">{t("Vishay not found.", "विषय नहीं मिला।")}</div>
      </div>
    );
  }

  const c = vishayaColor(data?.vishay.color);
  const Icon = vishayaIcon(data?.vishay.icon);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-10">
      <div>
        <Link href="/vishay">
          <Button variant="ghost" size="sm" className="mb-4 gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            {t("All Vishayas", "सभी विषय")}
          </Button>
        </Link>

        {/* Masthead */}
        <div className={cn("relative overflow-hidden rounded-[2rem] border p-6 md:p-8", c.border, c.bg)}>
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-foreground/[0.03] blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <span className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border bg-background/60 shadow-sm", c.border)}>
              {isLoading ? <Skeleton className="h-8 w-8 rounded-lg" /> : <Icon className={cn("h-8 w-8", c.text)} />}
            </span>
            <div className="space-y-1.5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-muted-foreground">
                {t("Vishay", "विषय")}
              </p>
              {isLoading ? (
                <Skeleton className="h-9 w-64" />
              ) : (
                <>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                    {isHi ? data?.vishay.nameHi : data?.vishay.nameEn}
                  </h1>
                  <p className={cn("text-sm text-muted-foreground", !isHi && "font-devanagari")}>
                    {isHi ? data?.vishay.nameEn : data?.vishay.nameHi}
                  </p>
                </>
              )}
              {!isLoading && (isHi ? data?.vishay.descriptionHi : data?.vishay.description) && (
                <p className="max-w-2xl pt-1 text-sm leading-relaxed text-muted-foreground">
                  {isHi ? data?.vishay.descriptionHi : data?.vishay.description}
                </p>
              )}
            </div>
            {!isLoading && (
              <div className="sm:ml-auto sm:text-right">
                <p className="text-3xl font-bold text-foreground">{data?.totals.all ?? 0}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("Linked items", "जुड़े आइटम")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : data && data.totals.all === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border/80 bg-muted/30 py-24 text-center">
          <Layers className="mx-auto mb-6 h-16 w-16 text-muted-foreground/20" />
          <p className="font-devanagari text-base font-medium text-muted-foreground">
            {t("Nothing tagged with this vishay yet.", "अभी इस विषय से कुछ भी संबद्ध नहीं।")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("Tag articles, events, or scholars to see them gather here.", "लेख, कार्यक्रम या विद्वानों को टैग करें — वे यहाँ एकत्र होंगे।")}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Articles */}
          {data && data.groups.article.length > 0 && (
            <RelatedSection icon={FileText} label={t(`Articles (${data.totals.article})`, `आलेख (${data.totals.article})`)} seal={t("Aalekh", "आलेख")}>
              {data.groups.article.map((a) => (
                <Link key={a.id} href="/aalekh">
                  <RelatedRow title={a.title} meta={[a.category, a.status.replace(/_/g, " ")]} />
                </Link>
              ))}
            </RelatedSection>
          )}

          {/* Events */}
          {data && data.groups.event.length > 0 && (
            <RelatedSection icon={CalendarDays} label={t(`Events (${data.totals.event})`, `कार्यक्रम (${data.totals.event})`)} seal={t("Calendar", "कार्यक्रम")}>
              {data.groups.event.map((e) => (
                <Link key={e.id} href={`/calendar?event=${e.id}`}>
                  <RelatedRow title={e.title} meta={[formatEventDate(e.startsAt), e.status.replace(/_/g, " ")].filter(Boolean) as string[]} />
                </Link>
              ))}
            </RelatedSection>
          )}

          {/* Research projects */}
          {data && data.groups.project.length > 0 && (
            <RelatedSection icon={FlaskConical} label={t(`Research (${data.totals.project})`, `शोध (${data.totals.project})`)} seal={t("Shodh", "शोध")}>
              {data.groups.project.map((p) => (
                <Link key={p.id} href="/shodh">
                  <RelatedRow title={isHi ? (p.titleHi || p.title) : p.title} meta={[p.status.replace(/_/g, " ")]} />
                </Link>
              ))}
            </RelatedSection>
          )}

          {/* Publications */}
          {data && data.groups.publication.length > 0 && (
            <RelatedSection icon={BookMarked} label={t(`Publications (${data.totals.publication})`, `प्रकाशन (${data.totals.publication})`)} seal={t("Prakashan", "प्रकाशन")}>
              {data.groups.publication.map((p) => (
                <Link key={p.id} href="/prakashan">
                  <RelatedRow title={isHi ? (p.titleHi || p.title) : p.title} meta={[p.status.replace(/_/g, " ")]} />
                </Link>
              ))}
            </RelatedSection>
          )}

          {/* Scholars */}
          {data && data.groups.scholar.length > 0 && (
            <RelatedSection icon={GraduationCap} label={t(`Scholars (${data.totals.scholar})`, `विद्वान (${data.totals.scholar})`)} seal={t("Vidvat Mandal", "विद्वत मंडल")}>
              {data.groups.scholar.map((s) => (
                <Link key={s.id} href={`/scholars/${s.slug}`}>
                  <RelatedRow title={isHi ? s.nameHi : s.name} meta={s.designation ? [s.designation] : []} />
                </Link>
              ))}
            </RelatedSection>
          )}
        </div>
      )}
    </motion.div>
  );
}

function RelatedSection({ icon: Icon, label, seal, children }: {
  icon: typeof FileText;
  label: string;
  seal: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1.5">
        <p className="section-seal">{seal}</p>
        <h2 className="dashboard-section-heading">
          <Icon className="h-5 w-5 text-primary" />
          {label}
        </h2>
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function RelatedRow({ title, meta }: { title: string; meta: string[] }) {
  return (
    <Card className="institution-panel group transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <CardContent className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="min-w-0 space-y-1">
          <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">{title}</h3>
          {meta.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {meta.map((m, i) => (
                <Badge key={i} variant="outline" className="bg-muted/40 text-[10px] font-medium capitalize">
                  {m}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <PenLine className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </CardContent>
    </Card>
  );
}
