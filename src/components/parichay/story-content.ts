export interface StoryVisual {
  glyphEn: string;
  glyphHi: string;
  ringLabel: string;
  tone: "earth" | "saffron" | "ink" | "leaf" | "steel";
}

export interface StoryStage {
  id: "genesis" | "manthan" | "narrative" | "action" | "future";
  titleEn: string;
  titleHi: string;
  labelEn: string;
  labelHi: string;
  summaryEn: string;
  summaryHi: string;
  visual: StoryVisual;
}

export interface ErpFlowStep {
  id: "idea" | "publication" | "dissemination" | "discourse" | "reporting";
  moduleEn: string;
  moduleHi: string;
  titleEn: string;
  titleHi: string;
  summaryEn: string;
  summaryHi: string;
}

export const STORY_STAGES: StoryStage[] = [
  {
    id: "genesis",
    labelEn: "01 / Roots",
    labelHi: "01 / मूल",
    titleEn: "Civilizational Memory",
    titleHi: "सभ्यता की स्मृति",
    summaryEn:
      "The work begins with study, inheritance, and the discipline of preserving knowledge.",
    summaryHi:
      "कार्य अध्ययन, परंपरा और ज्ञान को सुरक्षित रखने के अनुशासन से आरम्भ होता है।",
    visual: {
      glyphEn: "ROOTS",
      glyphHi: "मूल",
      ringLabel: "study / स्मृति",
      tone: "earth",
    },
  },
  {
    id: "manthan",
    labelEn: "02 / Manthan",
    labelHi: "02 / मंथन",
    titleEn: "Thought Takes Shape",
    titleHi: "विचार आकार लेता है",
    summaryEn:
      "Ideas are examined, debated, refined, and prepared for public life.",
    summaryHi:
      "विचारों का परीक्षण, संवाद, परिष्कार और सार्वजनिक जीवन के लिए संयोजन होता है।",
    visual: {
      glyphEn: "IDEA",
      glyphHi: "विचार",
      ringLabel: "dialogue / संवाद",
      tone: "saffron",
    },
  },
  {
    id: "narrative",
    labelEn: "03 / Narrative",
    labelHi: "03 / कथ्य",
    titleEn: "A Shared Narrative",
    titleHi: "साझा कथ्य",
    summaryEn:
      "Research, writing, and discourse turn scattered insight into a clear public position.",
    summaryHi:
      "शोध, लेखन और विमर्श बिखरे हुए बोध को स्पष्ट सार्वजनिक कथ्य में बदलते हैं।",
    visual: {
      glyphEn: "TEXT",
      glyphHi: "लेख",
      ringLabel: "writing / लेखन",
      tone: "ink",
    },
  },
  {
    id: "action",
    labelEn: "04 / Institution",
    labelHi: "04 / संस्था",
    titleEn: "Work Becomes Organized",
    titleHi: "कार्य संगठित होता है",
    summaryEn:
      "Publication, outreach, discussion, and field reporting become repeatable institutional work.",
    summaryHi:
      "प्रकाशन, प्रसार, संवाद और क्षेत्रीय वृत्त नियमित संस्थागत कार्य बनते हैं।",
    visual: {
      glyphEn: "WORK",
      glyphHi: "कार्य",
      ringLabel: "discipline / अनुशासन",
      tone: "leaf",
    },
  },
  {
    id: "future",
    labelEn: "05 / ERP",
    labelHi: "05 / ERP",
    titleEn: "ERP for Continuity",
    titleHi: "निरंतरता के लिए ERP",
    summaryEn:
      "The console connects people, workstreams, outputs, reviews, and reports in one operating system.",
    summaryHi:
      "कंसोल लोगों, कार्य-प्रवाहों, प्रकाशनों, समीक्षाओं और रिपोर्टों को एक संचालन-तंत्र में जोड़ता है।",
    visual: {
      glyphEn: "ERP",
      glyphHi: "तंत्र",
      ringLabel: "continuity / निरंतरता",
      tone: "steel",
    },
  },
];

export const ERP_FLOW_STEPS: ErpFlowStep[] = [
  {
    id: "idea",
    moduleEn: "Study",
    moduleHi: "अध्ययन",
    titleEn: "Idea is formed",
    titleHi: "विचार बनता है",
    summaryEn: "Themes emerge from study, review, and field context.",
    summaryHi: "विषय अध्ययन, समीक्षा और क्षेत्रीय संदर्भ से उभरते हैं।",
  },
  {
    id: "publication",
    moduleEn: "Aalekh",
    moduleHi: "आलेख",
    titleEn: "Idea becomes writing",
    titleHi: "विचार लेखन बनता है",
    summaryEn: "Drafts, notes, and essays move through editorial review.",
    summaryHi: "प्रारूप, टिप्पणियां और लेख संपादकीय समीक्षा से गुजरते हैं।",
  },
  {
    id: "dissemination",
    moduleEn: "Prachar",
    moduleHi: "प्रचार",
    titleEn: "Writing reaches people",
    titleHi: "लेखन समाज तक पहुंचता है",
    summaryEn: "Published material is circulated with campaign discipline.",
    summaryHi: "प्रकाशित सामग्री अभियान अनुशासन के साथ प्रसारित होती है।",
  },
  {
    id: "discourse",
    moduleEn: "Vimarsh",
    moduleHi: "विमर्श",
    titleEn: "Public discussion develops",
    titleHi: "सार्वजनिक विमर्श बढ़ता है",
    summaryEn: "Forums and review sessions turn output into dialogue.",
    summaryHi: "मंच और समीक्षा सत्र सामग्री को संवाद में बदलते हैं।",
  },
  {
    id: "reporting",
    moduleEn: "Vritt",
    moduleHi: "वृत्त",
    titleEn: "Work is recorded",
    titleHi: "कार्य अभिलेखित होता है",
    summaryEn: "Events, attendance, outputs, and follow-through are captured.",
    summaryHi: "आयोजन, उपस्थिति, निष्पादन और अनुवर्तन दर्ज होते हैं।",
  },
];
