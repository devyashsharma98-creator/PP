"use client";

import { useEffect, useState } from "react";
import { Star, Loader2, CheckCircle2, XCircle, RotateCcw, Send, Eye } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import { useToast } from "@/components/ToastProvider";
import { useUpdateArticle, type PublicationArticle, type ArticleStatus, type Recommendation } from "@/hooks/api/use-publications";
import { ARTICLE_STATUS_STYLE } from "@/lib/app/publication-style";
import { VishayChips } from "@/components/vishay/VishayChips";

export function ArticleReviewPanel({ article, open, onOpenChange, canReview, canPublish }: {
  article: PublicationArticle | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  canReview: boolean;
  canPublish: boolean;
}) {
  const t = useT();
  const isHi = t("en", "hi") === "hi";
  const { addToast } = useToast();
  const update = useUpdateArticle();

  const [rating, setRating] = useState(0);
  const [recommendation, setRecommendation] = useState<Recommendation | "">("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (open && article) {
      setRating(article.rating ?? 0);
      setRecommendation(article.recommendation ?? "");
      setComment(article.reviewComment ?? "");
    }
  }, [open, article]);

  if (!article) return null;
  const style = ARTICLE_STATUS_STYLE[article.status];

  const transition = async (status: ArticleStatus) => {
    try {
      await update.mutateAsync({
        id: article.id,
        status,
        ...(["accepted", "rejected", "revision_requested"].includes(status)
          ? { recommendation: recommendation || null, rating: rating || null, reviewComment: comment.trim() || null }
          : {}),
      });
      addToast(t("Review saved.", "समीक्षा सहेजी गई।"), "success");
      onOpenChange(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : t("Action failed.", "क्रिया विफल।"), "error");
    }
  };

  const pending = update.isPending;
  const recOptions: Recommendation[] = ["accept", "minor_revision", "major_revision", "reject"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-6 leading-snug">{isHi ? (article.titleHi || article.title) : article.title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-[1.3fr_1fr]">
          {/* Left: article content */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("text-[10px]", style.className)}>{isHi ? style.labelHi : style.labelEn}</Badge>
              <span className="text-[11px] text-muted-foreground">v{article.version}</span>
              {article.submitterName && <span className="text-[11px] text-muted-foreground">· {article.submitterName}</span>}
            </div>
            {article.publicationTitle && (
              <p className="text-xs text-muted-foreground">{t("Issue:", "अंक:")} <span className="font-medium text-foreground/80">{article.publicationTitle}</span></p>
            )}
            {article.abstract && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("Abstract", "सारांश")}</p>
                <p className="text-sm leading-relaxed text-foreground/85">{article.abstract}</p>
              </div>
            )}
            <VishayChips contentType="publication" contentId={article.id} />
          </div>

          {/* Right: review form */}
          <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("Peer Review", "सहकर्मी समीक्षा")}</p>

            {canReview ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("Rating", "मूल्यांकन")}</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setRating(n === rating ? 0 : n)} aria-label={`${n} stars`}>
                        <Star className={cn("h-5 w-5 transition-colors", n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{t("Recommendation", "अनुशंसा")}</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {recOptions.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRecommendation(r === recommendation ? "" : r)}
                        className={cn(
                          "rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors",
                          recommendation === r ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {t(r.replace(/_/g, " "), r)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{t("Comments", "टिप्पणी")}</Label>
                  <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder={t("Notes for the author…", "लेखक हेतु टिप्पणी…")} />
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("You can view this submission. Editorial decisions are made by reviewers.", "आप यह प्रस्तुति देख सकते हैं। संपादकीय निर्णय समीक्षक करते हैं।")}
              </p>
            )}

            {/* Existing recorded review (read-only echo) */}
            {!canReview && article.reviewComment && (
              <p className="rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-xs text-muted-foreground">{article.reviewComment}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        {canReview && (
          <div className="flex flex-wrap gap-2 border-t border-border/50 pt-4">
            {article.status === "submitted" && (
              <Button size="sm" variant="outline" className="gap-1.5" disabled={pending} onClick={() => void transition("under_review")}>
                <Eye className="h-3.5 w-3.5" /> {t("Start review", "समीक्षा आरंभ")}
              </Button>
            )}
            {(article.status === "submitted" || article.status === "under_review") && (
              <>
                <Button size="sm" className="gap-1.5" disabled={pending} onClick={() => void transition("accepted")}>
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} {t("Accept", "स्वीकार")}
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-amber-600" disabled={pending} onClick={() => void transition("revision_requested")}>
                  <RotateCcw className="h-3.5 w-3.5" /> {t("Request revision", "संशोधन माँगें")}
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-destructive" disabled={pending} onClick={() => void transition("rejected")}>
                  <XCircle className="h-3.5 w-3.5" /> {t("Reject", "अस्वीकार")}
                </Button>
              </>
            )}
            {article.status === "accepted" && canPublish && (
              <Button size="sm" className="gap-1.5" disabled={pending} onClick={() => void transition("published")}>
                <Send className="h-3.5 w-3.5" /> {t("Publish", "प्रकाशित करें")}
              </Button>
            )}
            {(article.status === "accepted" || article.status === "rejected" || article.status === "revision_requested") && (
              <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" disabled={pending} onClick={() => void transition("under_review")}>
                <RotateCcw className="h-3.5 w-3.5" /> {t("Reopen review", "समीक्षा पुनः खोलें")}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
