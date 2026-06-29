/**
 * Intellectual event types for the calendar / gatividhi workflow.
 *
 * Prajna Pravah events are not generic — a study circle, a multi-day shivir, a
 * faculty development programme, and a Lokmanthan-scale conference each carry
 * different intent and preparation. The `eventType` is stored in the event's
 * `metadata.eventType` (no schema change), and drives the badge + suggested
 * preparation checklist shown in the UI.
 */

export type EventTypeKey =
  | "study_circle"
  | "shivir"
  | "faculty_program"
  | "conference"
  | "lecture"
  | "book_discussion";

export interface EventTypeDef {
  labelEn: string;
  labelHi: string;
  /** lucide icon name */
  icon: string;
  /** colour token (reuses the vishaya palette) */
  color: string;
  descriptionEn: string;
  descriptionHi: string;
  /** Suggested preparation items surfaced in the create form. */
  suggestedChecklist: string[];
}

export const EVENT_TYPES: Record<EventTypeKey, EventTypeDef> = {
  study_circle: {
    labelEn: "Study Circle",
    labelHi: "अध्ययन केंद्र",
    icon: "BookOpen",
    color: "blue",
    descriptionEn: "A recurring reading and discussion session.",
    descriptionHi: "नियमित पठन एवं चर्चा सत्र।",
    suggestedChecklist: ["Reading assigned", "Discussion led", "Attendance marked", "Next session planned"],
  },
  shivir: {
    labelEn: "Shivir / Camp",
    labelHi: "शिविर",
    icon: "Tent",
    color: "orange",
    descriptionEn: "A 1–7 day residential camp.",
    descriptionHi: "1–7 दिवसीय आवासीय शिविर।",
    suggestedChecklist: ["Venue confirmed", "Resource persons", "Participants registered", "Materials ready", "Food arranged", "Certificates ready"],
  },
  faculty_program: {
    labelEn: "Faculty Development Program",
    labelHi: "अध्यापक विकास कार्यक्रम",
    icon: "GraduationCap",
    color: "emerald",
    descriptionEn: "Training and development for educators.",
    descriptionHi: "शिक्षकों हेतु प्रशिक्षण एवं विकास।",
    suggestedChecklist: ["Venue confirmed", "Speakers confirmed", "Participants registered", "Materials ready", "Certificates ready", "Feedback collected"],
  },
  conference: {
    labelEn: "Conference / Sammelan",
    labelHi: "सम्मेलन",
    icon: "Users",
    color: "violet",
    descriptionEn: "A multi-session conference or sammelan.",
    descriptionHi: "बहु-सत्रीय सम्मेलन।",
    suggestedChecklist: ["Venue confirmed", "Speakers confirmed", "Sessions planned", "Registration open", "Proceedings planned"],
  },
  lecture: {
    labelEn: "Guest Lecture / Pravachan",
    labelHi: "अतिथि व्याख्यान / प्रवचन",
    icon: "Mic",
    color: "rose",
    descriptionEn: "A guest lecture or pravachan.",
    descriptionHi: "अतिथि व्याख्यान या प्रवचन।",
    suggestedChecklist: ["Venue confirmed", "Speaker confirmed", "Publicity done", "Attendance marked"],
  },
  book_discussion: {
    labelEn: "Book Discussion / Granth Charcha",
    labelHi: "पुस्तक चर्चा",
    icon: "BookMarked",
    color: "amber",
    descriptionEn: "A book review and discussion session.",
    descriptionHi: "पुस्तक समीक्षा एवं चर्चा सत्र।",
    suggestedChecklist: ["Book selected", "Discussion led", "Notes taken", "Next session planned"],
  },
};

export const EVENT_TYPE_KEYS = Object.keys(EVENT_TYPES) as EventTypeKey[];

export function getEventType(key: string | null | undefined): EventTypeDef | null {
  return key && key in EVENT_TYPES ? EVENT_TYPES[key as EventTypeKey] : null;
}
