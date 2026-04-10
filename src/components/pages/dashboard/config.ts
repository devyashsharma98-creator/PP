"use client";

import type { GatividhiEvent } from "@/lib/app/contracts";

export type ChecklistKey = keyof GatividhiEvent["checklist"];

export const dashboardStatusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    Draft: "status-draft",
    "Submitted by Unit": "status-pending-review",
    "Pending Aayam Review": "status-pending-review",
    "Pending Vibhag Review": "status-pending-approval",
    "Pending Prant Authorization": "status-pending-approval",
    "Pending Prant Dual Authorization": "status-pending-approval",
    Published: "status-published",
    "Escalated to Kshetra": "status-pending-approval",
    "Returned for Revision": "status-draft",
    Rejected: "status-cancelled",
    Cancelled: "status-cancelled",
  };
  return map[status] || "";
};

export const eventStatusHi: Record<string, string> = {
  Draft: "प्रारूप",
  "Submitted by Unit": "इकाई द्वारा प्रस्तुत",
  "Pending Aayam Review": "आयाम समीक्षा प्रतीक्षित",
  "Pending Vibhag Review": "विभाग समीक्षा प्रतीक्षित",
  "Pending Prant Authorization": "प्रांत अनुमोदन प्रतीक्षित",
  "Pending Prant Dual Authorization": "प्रांत दोहरा अनुमोदन प्रतीक्षित",
  Published: "प्रकाशित",
  "Escalated to Kshetra": "क्षेत्र को अग्रेषित",
  "Returned for Revision": "संशोधन के लिए लौटाया",
  Rejected: "अस्वीकृत",
  Cancelled: "रद्द",
};

export const checklistItems: { key: ChecklistKey; en: string; hi: string }[] = [
  { key: "designing", en: "Designing & Digital", hi: "डिज़ाइनिंग एवं डिजिटल" },
  { key: "food", en: "Food & Refreshments", hi: "भोजन एवं जलपान" },
  { key: "seating", en: "Sitting & Venue", hi: "बैठक व स्थान" },
  { key: "transport", en: "Transport & Logistics", hi: "परिवहन एवं व्यवस्था" },
  { key: "accommodation", en: "Accommodation", hi: "आवास" },
  { key: "soundMic", en: "Sound, Music & Mic", hi: "ध्वनि, संगीत एवं माइक्रोफोन" },
  { key: "camera", en: "Photography & Video", hi: "छायाचित्र एवं वीडियो" },
  { key: "screen", en: "Screen & Projection", hi: "स्क्रीन एवं प्रोजेक्शन" },
  { key: "lights", en: "Lighting Arrangement", hi: "प्रकाश व्यवस्था" },
];

export const eventTemplates: Record<
  string,
  { labelEn: string; labelHi: string; checklist: ChecklistKey[] }
> = {
  seminar: {
    labelEn: "Seminar / Gosthi",
    labelHi: "संगोष्ठी / विचार गोष्ठी",
    checklist: ["designing", "seating", "soundMic", "screen", "camera", "food"],
  },
  protest: {
    labelEn: "Protest / Pradarshan",
    labelHi: "प्रदर्शन / धरना",
    checklist: ["designing", "soundMic", "camera", "transport"],
  },
  study_circle: {
    labelEn: "Study Circle / Adhyayan",
    labelHi: "अध्ययन मंडल / बैठक",
    checklist: ["seating", "food"],
  },
  workshop: {
    labelEn: "Workshop / Karyashala",
    labelHi: "कार्यशाला / प्रशिक्षण",
    checklist: ["designing", "seating", "soundMic", "screen", "camera", "food", "accommodation"],
  },
  outreach: {
    labelEn: "Public Outreach / Prachar",
    labelHi: "जनसंपर्क / प्रचार अभियान",
    checklist: ["designing", "transport", "camera"],
  },
};

export const suggestedQuestions: {
  question: string;
  questionHi: string;
  type: "text" | "yesno";
}[] = [
  { question: "T-shirt size?", questionHi: "टी-शर्ट साइज़?", type: "text" },
  { question: "Vegetarian?", questionHi: "शाकाहारी?", type: "yesno" },
  { question: "Need accommodation?", questionHi: "आवास चाहिए?", type: "yesno" },
  { question: "Coming from outside city?", questionHi: "शहर से बाहर से आ रहे हैं?", type: "yesno" },
  { question: "Preferred session time?", questionHi: "पसंदीदा सत्र समय?", type: "text" },
  { question: "Bringing family?", questionHi: "परिवार ला रहे हैं?", type: "yesno" },
];

export const expertPool = [
  { name: "Anil Verma", nameHi: "अनिल वर्मा", vakshe: ["History", "Colonialism"], keywords: ["seminar", "study_circle"] },
  { name: "Kavita Singh", nameHi: "कविता सिंह", vakshe: ["IKS", "Archaeology"], keywords: ["seminar", "workshop"] },
  { name: "Pradeep Yadav", nameHi: "प्रदीप यादव", vakshe: ["Public Speaking", "Campus Connect"], keywords: ["protest", "outreach"] },
  { name: "Meena Joshi", nameHi: "मीना जोशी", vakshe: ["Education Policy"], keywords: ["seminar", "workshop"] },
  { name: "Deepak Kumar", nameHi: "दीपक कुमार", vakshe: ["Social Media"], keywords: ["outreach", "protest"] },
  { name: "Rajesh Tiwari", nameHi: "राजेश तिवारी", vakshe: ["Sanskrit", "Manuscripts"], keywords: ["seminar", "study_circle"] },
];

export type SuggestedExpert = (typeof expertPool)[number];
