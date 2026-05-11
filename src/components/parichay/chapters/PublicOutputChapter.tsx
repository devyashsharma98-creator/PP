"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Newspaper } from "lucide-react";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/utils";
import { PerspectiveCard } from "../effects/PerspectiveCard";

interface ArticleItem {
  id: string;
  title: string;
  titleHi: string;
  excerpt: string;
  excerptHi: string;
  author: string;
  date: string;
  image?: string;
  href: string;
}

const PLACEHOLDER_ARTICLES: ArticleItem[] = [
  {
    id: "1",
    title: "Institutional Rhythm and Public Discourse",
    titleHi: "संस्थागत लय और सार्वजनिक विमर्श",
    excerpt: "On the connection between editorial discipline and field-level public action in cultural institutions.",
    excerptHi: "संस्कृतिक संस्थाओं में संपादकीय अनुशासन और क्षेत्र-स्तरीय सार्वजनिक कार्य के बीच संबंध पर।",
    author: "Editorial Desk",
    date: "2024-12-15",
    href: "/feed",
  },
  {
    id: "2",
    title: "Review Practices in Public Work",
    titleHi: "सार्वजनिक कार्य में समीक्षा प्रक्रिया",
    excerpt: "How structured review cycles improve the quality and accountability of public output.",
    excerptHi: "संरचित समीक्षा चक्र सार्वजनिक उत्पाद की गुणवत्ता और उत्तरदायित्व में सुधार कैसे करते हैं।",
    author: "Research Cell",
    date: "2024-11-28",
    href: "/feed",
  },
  {
    id: "3",
    title: "From Publication to Field Action",
    titleHi: "प्रकाशन से क्षेत्र-कार्य तक",
    excerpt: "Tracing the lifecycle of an idea from draft to public dissemination and operational follow-through.",
    excerptHi: "एक विचार के जीवनचक्र का पता लगाना — प्रारूप से सार्वजनिक प्रसार और परिचालन अनुवर्तन तक।",
    author: "Field Team",
    date: "2024-10-10",
    href: "/feed",
  },
  {
    id: "4",
    title: "Event Documentation Standards",
    titleHi: "आयोजन प्रलेखन मानक",
    excerpt: "Guidelines for consistent and useful event reporting across all workstreams.",
    excerptHi: "सभी कार्य-प्रवाहों में सुसंगत और उपयोगी आयोजन रिपोर्टिंग के लिए दिशानिर्देश।",
    author: "Vritt Desk",
    date: "2024-09-22",
    href: "/feed",
  },
];

export function PublicOutputChapter() {
  const t = useT();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [articles, setArticles] = useState<ArticleItem[]>(PLACEHOLDER_ARTICLES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to fetch real articles
    fetch("/api/public/articles")
      .then((res) => {
        if (!res.ok) throw new Error("No articles");
        return res.json();
      })
      .then((data) => {
        if (data.articles?.length > 0) {
          const mapped = data.articles.slice(0, 4).map((a: { id: string; title: string; title_hi?: string; excerpt?: string; excerpt_hi?: string; author?: string; created_at?: string; slug?: string }) => ({
            id: a.id,
            title: a.title,
            titleHi: a.title_hi || a.title,
            excerpt: a.excerpt || "",
            excerptHi: a.excerpt_hi || a.excerpt || "",
            author: a.author || "Editorial Desk",
            date: a.created_at ? new Date(a.created_at).toISOString().split("T")[0] : "",
            href: `/feed`,
          }));
          setArticles(mapped);
        }
      })
      .catch(() => {
        // Keep placeholders
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-accent/20 py-20 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
            {t("Publications & Media", "प्रकाशन और मीडिया")}
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {t("Public Output", "सार्वजनिक सामग्री")}
          </h2>
        </motion.div>

        {/* Masonry grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.12 }}
              className={cn(
                index === 0 && "md:col-span-2 lg:col-span-2 lg:row-span-2"
              )}
            >
              <PerspectiveCard intensity={6}>
                <Link
                  href={article.href}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-card transition-all duration-500 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                >
                  {/* Image placeholder with shader-like effect */}
                  <div className={cn(
                    "relative overflow-hidden bg-gradient-to-br from-primary/10 to-accent/30",
                    index === 0 ? "h-64 md:h-80" : "h-48"
                  )}>
                    <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--primary))_0%,transparent_50%)]" />
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary backdrop-blur-sm">
                        <Newspaper className="h-3 w-3" />
                        {t("Article", "लेख")}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className={cn(
                      "mb-2 font-bold tracking-tight text-foreground transition-colors group-hover:text-primary",
                      index === 0 ? "text-2xl md:text-3xl" : "text-lg"
                    )}>
                      {t(article.title, article.titleHi)}
                    </h3>
                    <p className={cn(
                      "mb-4 flex-1 text-muted-foreground",
                      index === 0 ? "text-base leading-relaxed" : "text-sm line-clamp-2"
                    )}>
                      {t(article.excerpt, article.excerptHi)}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{article.author}</span>
                        <span>·</span>
                        <span>{article.date}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                  </div>
                </Link>
              </PerspectiveCard>
            </motion.div>
          ))}
        </div>

        {/* View all link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-6 py-3 text-sm font-bold uppercase tracking-[0.15em] text-primary transition-all hover:bg-primary hover:text-primary-foreground"
          >
            {t("View All Publications", "सभी प्रकाशन देखें")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
