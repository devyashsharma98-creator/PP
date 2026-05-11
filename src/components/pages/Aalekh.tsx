"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { useArticles, useCreateArticle, useUpdateArticleStatus } from "@/hooks/api/use-aalekh";
import { useToast } from '@/components/ToastProvider';
import { useT } from '@/lib/useT';
import { emptyForm } from "./aalekh/shared";
import { KaryakartaView } from "./aalekh/KaryakartaView";
import { UnitHeadView } from "./aalekh/UnitHeadView";
import { AayamView } from "./aalekh/AayamView";
import { VibhagView } from "./aalekh/VibhagView";

export default function Aalekh() {
  const { role, permissions } = useAppContext();
  const { data: articles = [], isLoading } = useArticles();
  const createArticleMutation = useCreateArticle();
  const updateStatusMutation = useUpdateArticleStatus();
  
  const { addToast } = useToast();
  const t = useT();
  const [lastPublished, setLastPublished] = useState<string | null>(null);

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

  const handleUpdateStatus = async (id: string, status: any) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      addToast(t('Article updated!', 'आलेख अद्यतन हुआ!'), 'success');
      return true;
    } catch {
      addToast(t('Update failed', 'अद्यतन विफल'), 'error');
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

  if (role === "karyakarta") {
    return <KaryakartaView articles={articles} handleSubmit={handleSubmit} />;
  }

  if (role === "unit_head") {
    return <UnitHeadView articles={articles} updateArticleStatus={handleUpdateStatus} />;
  }

  if (role === "aayam_pramukh") {
    return <AayamView articles={articles} updateArticleStatus={handleUpdateStatus} />;
  }

  return (
    <VibhagView
      articles={articles}
      permissions={permissions}
      updateArticleStatus={handleUpdateStatus}
      lastPublished={lastPublished}
      setLastPublished={setLastPublished}
    />
  );
}
