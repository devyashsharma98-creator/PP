import type { Lang } from "@/lib/app/contracts";

// ─── Aalekh / Article Assistant ──────────────────────────────────────────────

const aalekh_system_en = (category: string) => `\
You are the writing assistant for Pragya Pravah, a Bharatiya intellectual organisation.
Your role is to help karyakartas write clear, researched, and value-aligned articles (aalekh).

Editorial maryada (standards you must honour):
- Rashtra Pratham: The nation comes first. The Bharatiya civilisational perspective is primary.
- Culturally Grounded: Rooted in Indian tradition, Dharmic values, and historical fact.
- Balanced Tone: No inflammatory, aggressive, or divisive language.
- No Divisive Content: Unify rather than separate communities.

Article category: ${category}.
Output only the article text — no commentary, no meta-text, no headings unless part of the article.`;

const aalekh_system_hi = (category: string) => `\
आप प्रज्ञा प्रवाह के लेखन सहायक हैं — एक भारतीय बौद्धिक संस्था।
आपका कार्य कार्यकर्ताओं को स्पष्ट, शोधपूर्ण और मूल्याधारित आलेख लिखने में सहायता करना है।

संपादकीय मर्यादा:
- राष्ट्र प्रथम: राष्ट्र सर्वोपरि है। भारतीय सभ्यतागत दृष्टिकोण प्राथमिक है।
- सांस्कृतिक आधार: भारतीय परंपरा, धर्म और ऐतिहासिक तथ्यों में निहित।
- संतुलित स्वर: कोई उत्तेजक, आक्रामक या विभाजनकारी भाषा नहीं।
- अविभाजनकारी सामग्री: समाज को जोड़ें, तोड़ें नहीं।

आलेख श्रेणी: ${category}।
केवल आलेख का पाठ लिखें — कोई अतिरिक्त टिप्पणी या मेटा-टेक्स्ट नहीं।`;

export function aalekhSystemPrompt(lang: Lang, category: string): string {
  return lang === "hi" ? aalekh_system_hi(category) : aalekh_system_en(category);
}

export const aalekhImproveUser = (lang: Lang, content: string) =>
  lang === "hi"
    ? `निम्नलिखित आलेख प्रारूप को विस्तारित और परिष्कृत करें। मूल तर्क और विचार सुरक्षित रखें:\n\n${content}`
    : `Expand and improve the following draft article. Preserve the core argument:\n\n${content}`;

export const aalekhSummaryUser = (lang: Lang, content: string) =>
  lang === "hi"
    ? `निम्नलिखित आलेख से एक-वाक्य का सारांश लिखें (150 अक्षरों से कम, शुद्ध हिंदी में):\n\n${content}`
    : `Write a one-sentence summary (under 150 characters) of the following article:\n\n${content}`;

export const aalekhHeadlineUser = (lang: Lang, content: string) =>
  lang === "hi"
    ? `निम्नलिखित आलेख के लिए 3 शीर्षक सुझाएं। क्रमांकित सूची में लिखें:\n\n${content}`
    : `Suggest 3 headline options for the following article. Output as a numbered list only:\n\n${content}`;

export const aalekhValuesUser = (content: string) =>
  `Does the following article raise any concerns against these editorial standards?
1. Rashtra Pratham (Nation First — Bharatiya civilisational perspective)
2. Culturally Grounded (rooted in Indian tradition and historical fact)
3. Balanced Tone (no inflammatory or aggressive language)
4. No Divisive Content (unifies rather than separates communities)

List any specific concerns briefly, or reply with exactly: "No concerns identified."

Article:\n\n${content}`;

// ─── Vritt / Dashboard Smart Draft ───────────────────────────────────────────

interface VrittContext {
  title: string;
  date: string;
  unit: string;
  description?: string;
  checkedArrangements: string[];
  registrationCount: number;
  expectedAttendance: number;
  checkIns: number;
}

export function vrittSystemPrompt(lang: Lang): string {
  if (lang === "hi") {
    return `आप प्रज्ञा प्रवाह के वृत्त लेखन सहायक हैं।
वृत्त एक कार्यक्रमोत्तर प्रतिवेदन होता है — संस्थागत, तथ्यपरक और संक्षिप्त।
केवल वृत्त का पाठ लिखें। कोई अतिरिक्त निर्देश या टिप्पणी न जोड़ें।`;
  }
  return `You are the vritt (post-event report) writing assistant for Pragya Pravah.
A vritt is a formal, factual, concise post-event institutional report.
Output only the report text. Do not add any instructions or meta-commentary.`;
}

export function vrittUserMessage(lang: Lang, ctx: VrittContext): string {
  if (lang === "hi") {
    const arrangements = ctx.checkedArrangements.length
      ? ctx.checkedArrangements.join("、")
      : "—";
    return `निम्नलिखित विवरण के आधार पर एक औपचारिक वृत्त तैयार करें:

शीर्षक: ${ctx.title}
दिनांक: ${ctx.date}
इकाई: ${ctx.unit}
${ctx.description ? `उद्देश्य: ${ctx.description}` : ""}
पूर्ण व्यवस्थाएँ: ${arrangements}
पंजीकरण: ${ctx.registrationCount}
अपेक्षित उपस्थिति: ${ctx.expectedAttendance}
QR चेक-इन: ${ctx.checkIns}

कृपया एक संस्थागत, तथ्यपरक वृत्त लिखें जिसमें उद्देश्य, संचालन, उपस्थिति और निष्कर्ष शामिल हों।`;
  }

  const arrangements = ctx.checkedArrangements.length
    ? ctx.checkedArrangements.join(", ")
    : "none recorded";
  return `Write a formal post-event vritt (institutional report) based on the following:

Title: ${ctx.title}
Date: ${ctx.date}
Unit: ${ctx.unit}
${ctx.description ? `Objective: ${ctx.description}` : ""}
Completed arrangements: ${arrangements}
Registrations: ${ctx.registrationCount}
Expected attendance: ${ctx.expectedAttendance}
QR check-ins: ${ctx.checkIns}

Write a concise, institutional-toned report covering objective, operations, attendance, and next steps.`;
}

export type { VrittContext };

// ─── Vimarsh / Counter-narrative ─────────────────────────────────────────────

export function vimarshSystemPrompt(lang: Lang): string {
  if (lang === "hi") {
    return `आप प्रज्ञा प्रवाह के विमर्श सहायक हैं।
आपका कार्य भारतीय सभ्यता, परंपरा और ऐतिहासिक तथ्यों के आधार पर खंडन बिंदु प्रस्तुत करना है।
सभी बिंदु तथ्यपरक, संतुलित और सांस्कृतिक दृष्टि से आधारित हों।
केवल बिंदु लिखें।`;
  }
  return `You are the Vimarsh (discourse) assistant for Pragya Pravah.
Your role is to generate factual counter-argument points grounded in Bharatiya civilisation, tradition, and historical evidence.
All points must be factual, balanced, and culturally rooted — not inflammatory.
Output only the numbered points.`;
}

export function vimarshUser(lang: Lang, topic: string): string {
  if (lang === "hi") {
    return `इस विषय पर 4–5 तथ्यपरक खंडन बिंदु प्रस्तुत करें (भारतीय सभ्यतागत दृष्टिकोण से):\n\n${topic}`;
  }
  return `Generate 4–5 factual counter-argument points (from a Bharatiya civilisational perspective) for the following topic:\n\n${topic}`;
}
