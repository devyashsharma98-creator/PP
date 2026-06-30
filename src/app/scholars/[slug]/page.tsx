import "server-only";

import { notFound } from "next/navigation";
import { and, eq, desc, or, ilike } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/db/client";
import { scholars, articles } from "@/db/schema/index";
import { requirePageSession } from "@/lib/server/require-page-session";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GraduationCap, FileText, CalendarDays, Clock } from "lucide-react";
import { WeeklyAvailabilityDisplay } from "@/components/scholars/ScholarAvailability";
import type { WeeklyAvailability } from "@/lib/validators/scholars";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export default async function ScholarProfilePage({ params }: Params) {
  const session = await requirePageSession("/scholars");
  const { slug } = await params;

  const scholar = await db.query.scholars.findFirst({
    where: and(eq(scholars.slug, slug), eq(scholars.orgId, session.orgId)),
  });

  if (!scholar) notFound();

  const authorArticles = scholar.linkedProfileId
    ? await db
        .select({
          id: articles.id,
          title: articles.title,
          summary: articles.summary,
          category: articles.category,
          publishedAt: articles.publishedAt,
          createdAt: articles.createdAt,
        })
        .from(articles)
        .where(
          and(
            eq(articles.orgId, session.orgId),
            eq(articles.status, "authorized_public"),
            or(
              eq(articles.authorUserId, scholar.linkedProfileId),
              or(
                ilike(articles.authorNameSnapshot, scholar.name),
                ilike(articles.authorNameSnapshot, scholar.nameHi),
              ),
            ),
          ),
        )
        .orderBy(desc(articles.publishedAt))
        .limit(20)
    : await db
        .select({
          id: articles.id,
          title: articles.title,
          summary: articles.summary,
          category: articles.category,
          publishedAt: articles.publishedAt,
          createdAt: articles.createdAt,
        })
        .from(articles)
        .where(
          and(
            eq(articles.orgId, session.orgId),
            eq(articles.status, "authorized_public"),
            or(
              ilike(articles.authorNameSnapshot, scholar.name),
              ilike(articles.authorNameSnapshot, scholar.nameHi),
            ),
          ),
        )
        .orderBy(desc(articles.publishedAt))
        .limit(20);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <Link
        href="/scholars"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Scholars
      </Link>

      <Card className="institution-panel border-primary/25">
        <div className="h-2 bg-gradient-to-r from-primary via-primary/60 to-primary/30" />
        <CardContent className="py-8 px-6 md:px-10 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1">
                Scholar Profile
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground/90 font-devanagari">
              {scholar.nameHi ?? scholar.name}
            </h1>
            {scholar.designation && (
              <p className="text-base text-muted-foreground font-medium">{scholar.designation}</p>
            )}
          </div>

          {scholar.expertise.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {scholar.expertise.map((ex) => (
                <Badge key={ex} variant="outline" className="text-[10px] font-medium">
                  {ex}
                </Badge>
              ))}
            </div>
          )}

          {scholar.bio && (
            <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">{scholar.bio}</p>
          )}

          {scholar.affiliation && (
            <p className="text-xs text-muted-foreground">
              <GraduationCap className="w-3.5 h-3.5 inline mr-1.5 opacity-60" />
              {scholar.affiliation}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Weekly availability schedule */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-foreground/80">
            Available Hours <span className="font-devanagari text-muted-foreground">· उपलब्ध समय</span>
          </h2>
        </div>
        <Card className="border-border/50 bg-background/40">
          <CardContent className="py-5 px-6">
            <WeeklyAvailabilityDisplay value={scholar.availability as WeeklyAvailability | null | undefined} />
          </CardContent>
        </Card>
      </div>

      {authorArticles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground/80">
              Published Aalekh ({authorArticles.length})
            </h2>
          </div>
          <div className="space-y-2">
            {authorArticles.map((a) => (
              <Link
                key={a.id}
                href={`/aalekh/${a.id}`}
                className="block rounded-xl border border-border/50 bg-background/40 hover:border-primary/20 transition-all px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground/90 truncate">{a.title}</p>
                  <Badge variant="outline" className="text-[9px] shrink-0">{a.category}</Badge>
                </div>
                {a.summary && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.summary}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <CalendarDays className="w-2.5 h-2.5" />
                  {new Date(a.publishedAt ?? a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
