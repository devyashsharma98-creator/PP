"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { useToast } from '@/components/ToastProvider';
import { useT } from '@/lib/useT';
import { emptyForm } from "./aalekh/shared";
import { KaryakartaView } from "./aalekh/KaryakartaView";
import { UnitHeadView } from "./aalekh/UnitHeadView";
import { AayamView } from "./aalekh/AayamView";
import { VibhagView } from "./aalekh/VibhagView";

export default function Aalekh() {
  const { role, articles, addArticle, updateArticleStatus, permissions } = useAppContext();
  const { addToast } = useToast();
  const t = useT();
  const [lastPublished, setLastPublished] = useState<string | null>(null);

  const handleSubmit = async (form: typeof emptyForm) => {
    const ok = await addArticle({
      title: form.title,
      content: form.content,
      summary: form.summary || form.content.slice(0, 150),
      author: "Current User",
      date: new Date().toISOString().split("T")[0],
      category: form.category,
      socialUrl: form.socialUrl || undefined,
      documentUrl: form.documentUrl || null,
      valuesChecklist: form.valuesChecklist,
    });
    if (!ok) return false;
    addToast(t('Article submitted!', 'आलेख भेजा गया!'), 'success', t('Sent for Unit Head review', 'यूनिट प्रमुख समीक्षा के लिए भेजा गया'));
    return true;
  };

  if (role === "karyakarta") {
    return <KaryakartaView articles={articles} handleSubmit={handleSubmit} />;
  }

  if (role === "unit_head") {
    return <UnitHeadView articles={articles} updateArticleStatus={updateArticleStatus} />;
  }

  if (role === "aayam_pramukh") {
    return <AayamView articles={articles} updateArticleStatus={updateArticleStatus} />;
  }

  return (
    <VibhagView
      articles={articles}
      permissions={permissions}
      updateArticleStatus={updateArticleStatus}
      lastPublished={lastPublished}
      setLastPublished={setLastPublished}
    />
  );
}
