"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Image, ExternalLink, CalendarDays, User, X } from "lucide-react";

import { useT } from "@/lib/useT";
import { useAppContext } from "@/context/AppContext";
import type { AalekhArticle } from "@/context/AppContext";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { statusColors, statusHi } from "./shared";

interface GalleryViewProps {
  articles: AalekhArticle[];
}

export function GalleryView({ articles }: GalleryViewProps) {
  const t = useT();
  const { lang } = useAppContext();
  const [preview, setPreview] = useState<AalekhArticle | null>(null);

  const withImages = articles.filter((a) => a.imageUrl);

  if (withImages.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Image className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">{t("No articles with images yet.", "अभी तक कोई चित्र सहित आलेख नहीं।")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {withImages.map((article, i) => (
          <motion.button
            key={article.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => setPreview(article)}
            className="group relative rounded-xl overflow-hidden bg-card border hover:border-primary/50 transition-all"
          >
            <div className="aspect-[4/3] bg-muted">
              <img
                src={article.imageUrl}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
              <p className="text-xs font-medium text-white truncate leading-snug">
                {article.title}
              </p>
              <p className="text-[10px] text-white/70 mt-1">
                {article.author}
              </p>
            </div>
            <div className="absolute top-2 left-2">
              <Badge className={cn("text-[9px] px-1.5 py-0", statusColors[article.status])}>
                {lang === "hi" ? statusHi[article.status] : article.status}
              </Badge>
            </div>
          </motion.button>
        ))}
      </div>

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-background">
          {preview && (
            <div className="flex flex-col md:flex-row max-h-[80vh]">
              <div className="md:w-1/2 bg-muted flex items-center justify-center">
                <img
                  src={preview.imageUrl}
                  alt={preview.title}
                  className="w-full h-full object-cover max-h-[40vh] md:max-h-[80vh]"
                />
              </div>
              <div className="md:w-1/2 p-5 overflow-y-auto space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={cn("text-[9px]", statusColors[preview.status])}>
                    {lang === "hi" ? statusHi[preview.status] : preview.status}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] bg-muted/30">{preview.category}</Badge>
                </div>
                <h3 className="font-bold text-sm leading-tight">{preview.title}</h3>
                <div className="text-xs text-muted-foreground flex items-center gap-3">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{preview.author}</span>
                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{preview.date}</span>
                </div>
                {preview.summary && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{preview.summary}</p>
                )}
                {preview.socialUrl && (
                  <a href={preview.socialUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <ExternalLink className="w-3 h-3" /> {t("View Source", "स्रोत देखें")}
                  </a>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
