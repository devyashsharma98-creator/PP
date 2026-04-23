export type ArticleShowcaseItem = {
  titleEn: string;
  titleHi: string;
  excerptEn: string;
  excerptHi: string;
  authorEn: string;
  authorHi: string;
  laneEn: string;
  laneHi: string;
  channels: string[];
};

export type PublicArticleSummary = {
  id: string;
  title: string;
  summary: string;
  category: string;
  authorName: string;
  socialUrl: string | null;
  publishedAt: string;
  channels?: string[];
};

export type PublicArticlesResponse = {
  success?: boolean;
  data?: PublicArticleSummary[];
};

export const ARTICLE_PLACEHOLDER_ARTIFACTS: ArticleShowcaseItem[] = [
  {
    titleEn: "Swabodh in Public Life",
    titleHi: "जन जीवन में स्वबोध",
    excerptEn:
      "A publication-ready article preview showing how an approved public note can move from review into wider circulation.",
    excerptHi:
      "यह प्रकाशन-योग्य आलेख पूर्वावलोकन दिखाता है कि स्वीकृत सार्वजनिक सामग्री समीक्षा से व्यापक प्रसार तक कैसे जाती है।",
    authorEn: "Aalekh Desk",
    authorHi: "आलेख डेस्क",
    laneEn: "Published output",
    laneHi: "प्रकाशित सामग्री",
    channels: ["Website", "WhatsApp", "Social"],
  },
  {
    titleEn: "Panch Parivartan Notes",
    titleHi: "पंच परिवर्तन टिप्पणी",
    excerptEn:
      "Public notes can surface here with their argument, author, and outward channels once they clear editorial review.",
    excerptHi:
      "संपादकीय समीक्षा पूर्ण होने पर सार्वजनिक टिप्पणियाँ यहाँ अपने तर्क, लेखक और प्रसार माध्यमों सहित दिखाई जा सकती हैं।",
    authorEn: "Research Contributor",
    authorHi: "शोध सहयोगी",
    laneEn: "Editorially cleared",
    laneHi: "संपादकीय स्वीकृति",
    channels: ["Feed", "Poster", "Thread"],
  },
  {
    titleEn: "Research-led Vimarsh",
    titleHi: "शोध-आधारित विमर्श",
    excerptEn:
      "The landing page can foreground current thought work without becoming a dashboard or an internal module directory.",
    excerptHi:
      "यह पृष्ठ वर्तमान वैचारिक कार्य को प्रमुखता दे सकता है, बिना डैशबोर्ड या आंतरिक मॉड्यूल सूची जैसा लगे।",
    authorEn: "Public Forum Team",
    authorHi: "सार्वजनिक विमर्श दल",
    laneEn: "Current discourse",
    laneHi: "वर्तमान विमर्श",
    channels: ["Library", "X", "Forum"],
  },
];

export function normalizePublishedArticle(article: PublicArticleSummary): ArticleShowcaseItem {
  const category = article.category ? article.category.charAt(0).toUpperCase() + article.category.slice(1) : "Aalekh";
  const channels = article.channels?.length
    ? article.channels.map((channel) => channel.charAt(0).toUpperCase() + channel.slice(1))
    : article.socialUrl
      ? ["Website", "Social"]
      : ["Website"];

  return {
    titleEn: article.title,
    titleHi: article.title,
    excerptEn: article.summary || "Approved article ready for public reading and structured dissemination.",
    excerptHi: article.summary || "स्वीकृत आलेख सार्वजनिक पठन और संरचित प्रसार हेतु उपलब्ध है।",
    authorEn: article.authorName || "Karyakarta",
    authorHi: article.authorName || "कार्यकर्ता",
    laneEn: "Published article",
    laneHi: "प्रकाशित आलेख",
    channels: [category, ...channels].slice(0, 3),
  };
}

export function buildArticleShowcaseItems(
  articles: PublicArticleSummary[] | undefined | null,
): ArticleShowcaseItem[] {
  if (!Array.isArray(articles)) {
    return ARTICLE_PLACEHOLDER_ARTIFACTS;
  }

  const normalized = articles
    .filter((article) => article.title?.trim())
    .map(normalizePublishedArticle);

  return normalized.length > 0 ? normalized : ARTICLE_PLACEHOLDER_ARTIFACTS;
}
