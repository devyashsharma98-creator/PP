"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAppContext, type ArticleStatus } from "@/context/AppContext";
import { useArticles, useCreateArticle, useUpdateArticleStatus, useResubmitArticle, type ResubmitForm } from "@/hooks/api/use-aalekh";
import { useVimarshTopics } from "@/hooks/api/use-vimarsh-topics";
import { useToast } from '@/components/ToastProvider';
import { useT } from '@/lib/useT';
import { emptyForm } from "./aalekh/shared";
import { KaryakartaView } from "./aalekh/KaryakartaView";
import { UnitHeadView } from "./aalekh/UnitHeadView";
import { AayamView } from "./aalekh/AayamView";
import { VibhagView } from "./aalekh/VibhagView";
import { GalleryView } from "./aalekh/GalleryView";
import { LayoutGrid, List, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const pipelineSteps = [
  { en: "Writer", hi: "लेखक" },
  { en: "Unit Review", hi: "इकाई समीक्षा" },
  { en: "Aayam Review", hi: "आयाम समीक्षा" },
  { en: "Vibhag Review", hi: "विभाग समीक्षा" },
  { en: "Published", hi: "प्रकाशित" },
];

function AalekhPipeline({ role, t, lang }: { role: string; t: (en: string, hi: string) => string; lang: string }) {
  const activeIndex = role === "karyakarta" ? 0 : role === "unit_head" ? 1 : role === "aayam_pramukh" ? 2 : 3;

  return (
    <section className="institution-panel p-4 md:p-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              {t("Publication Pipeline", "प्रकाशन प्रवाह")}
            </p>
            <h2 className="text-base font-semibold tracking-tight">
              {t("Idea to institutional record", "विचार से संस्थागत अभिलेख तक")}
            </h2>
          </div>
          <p className="text-xs leading-5 text-muted-foreground md:text-sm">
            {t("Your current lane is highlighted below.", "आपकी वर्तमान धारा नीचे चिह्नित है।")}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-5">
          {pipelineSteps.map((step, index) => {
            const active = index <= activeIndex;
            const current = index === activeIndex;

            return (
              <div key={step.en} className="relative">
                <div className={cn("rounded-xl border p-3 text-center transition-colors", current ? "border-primary bg-primary/5 text-primary" : active ? "border-success/30 bg-success/[0.04] text-foreground" : "border-border/70 bg-muted/20 text-muted-foreground")}>
                  <p className="text-xs font-semibold">{t(step.en, step.hi)}</p>
                  <p className="mt-1 text-[10px] leading-4">
                    {index === 0 ? t("Draft", "मसौदा") : index === pipelineSteps.length - 1 ? t("Record", "अभिलेख") : t("Lane", "धारा")}
                  </p>
                </div>
                {index < pipelineSteps.length - 1 && <ArrowRight className="mx-auto my-1 h-3 w-3 text-muted-foreground sm:hidden" />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function Aalekh() {
  const { role, lang, permissions } = useAppContext();
  const { data: articles = [], isLoading } = useArticles();
  const createArticleMutation = useCreateArticle();
  const updateStatusMutation = useUpdateArticleStatus();
  const resubmitMutation = useResubmitArticle();
  const searchParams = useSearchParams();
  const topic = searchParams.get("topic");
  const topicId = searchParams.get("topicId");
  const { data: topicGroups } = useVimarshTopics();

  const vimarshTopic = useMemo(() => {
    if (!topicId || !topicGroups) return null;
    for (const g of topicGroups) {
      const found = g.topics.find((t) => t.id === topicId);
      if (found) return found;
    }
    return null;
  }, [topicId, topicGroups]);

  const initialArticleData = useMemo(() => {
    if (!vimarshTopic) return { title: topic ?? '', content: '' };
    const desc = vimarshTopic.description ?? '';
    const resourceList = vimarshTopic.resources.length > 0
      ? '\n\nReferences:\n' + vimarshTopic.resources.map((r) => `- ${r.title}: ${r.url}`).join('\n')
      : '';
    return { title: vimarshTopic.title, content: desc + resourceList };
  }, [vimarshTopic, topic]);
  
  const { addToast } = useToast();
  const t = useT();
  const [lastPublished, setLastPublished] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "gallery">("list");

  const handleSubmit = async (form: typeof emptyForm) => {
    try {
      await createArticleMutation.mutateAsync({
        title: form.title,
        content: form.content,
        excerpt: form.summary || form.content.slice(0, 150),
        category: form.category,
      });
      addToast(t('Article submitted!', 'आलेख भेजा गया!'), 'success', t('Sent for Unit Head review', 'यूनिट प्रमुख समीक्षा के लिए भेजा गया'));
      return true;
    } catch {
      addToast(t('Failed to submit article', 'आलेख भेजने में विफल'), 'error');
      return false;
    }
  };

  const handleUpdateStatus = async (id: string, status: ArticleStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      addToast(t('Article updated!', 'आलेख अद्यतन हुआ!'), 'success');
      return true;
    } catch {
      addToast(t('Update failed', 'अद्यतन विफल'), 'error');
      return false;
    }
  };

  const handleResubmit = async (id: string, form: ResubmitForm) => {
    try {
      await resubmitMutation.mutateAsync({ id, form });
      addToast(t('Article resubmitted!', 'आलेख पुनः भेजा गया!'), 'success', t('Sent back for Unit Head review', 'यूनिट प्रमुख समीक्षा को वापस भेजा गया'));
      return true;
    } catch {
      addToast(t('Failed to resubmit article', 'आलेख पुनः भेजने में विफल'), 'error');
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const viewToggle = (
    <div className="flex items-center gap-1 border rounded-lg p-0.5">
      <Button
        variant={viewMode === "list" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 px-2"
        onClick={() => setViewMode("list")}
      >
        <List className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={viewMode === "gallery" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 px-2"
        onClick={() => setViewMode("gallery")}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      <AalekhPipeline role={role} t={t} lang={lang} />

      {viewMode === "gallery" ? (
        <GalleryView articles={articles} />
      ) : role === "karyakarta" ? (
        <KaryakartaView articles={articles} handleSubmit={handleSubmit} viewToggle={viewToggle} initialTitle={initialArticleData.title} initialContent={initialArticleData.content} onResubmit={handleResubmit} />
      ) : role === "unit_head" ? (
        <UnitHeadView articles={articles} updateArticleStatus={handleUpdateStatus} viewToggle={viewToggle} />
      ) : role === "aayam_pramukh" ? (
        <AayamView articles={articles} updateArticleStatus={handleUpdateStatus} viewToggle={viewToggle} />
      ) : (
        <VibhagView
          articles={articles}
          permissions={permissions}
          updateArticleStatus={handleUpdateStatus}
          lastPublished={lastPublished}
          setLastPublished={setLastPublished}
          viewToggle={viewToggle}
        />
      )}
    </div>
  );
}
