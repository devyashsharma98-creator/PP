/**
 * Prachar (Academic Outreach) — type definitions.
 *
 * Each outreach type carries bilingual labels, a lucide icon name, a colour
 * token (resolved via outreach-style helpers), and a set of dynamic fields that
 * the create/edit form renders. Stored field values live in outreach_items.metadata.
 */

export type OutreachFieldType = "text" | "url" | "number" | "date" | "select" | "multiselect";

export interface OutreachFieldDef {
  key: string;
  labelEn: string;
  labelHi: string;
  type: OutreachFieldType;
  required?: boolean;
  options?: string[];
  /** For select fields sourced from app data, e.g. "campus-units". */
  source?: string;
}

export interface OutreachTypeDef {
  labelEn: string;
  labelHi: string;
  /** lucide icon name */
  icon: string;
  /** colour token (see outreach-style) */
  color: string;
  descriptionEn: string;
  descriptionHi: string;
  fields: OutreachFieldDef[];
}

export const OUTREACH_TYPES: Record<string, OutreachTypeDef> = {
  journal: {
    labelEn: "Journal Issue",
    labelHi: "पत्रिका अंक",
    icon: "BookOpen",
    color: "violet",
    descriptionEn: "Distribute a published journal issue to scholars and institutions.",
    descriptionHi: "प्रकाशित पत्रिका अंक को विद्वानों एवं संस्थानों तक पहुँचाएँ।",
    fields: [
      { key: "issueName", labelEn: "Issue Name", labelHi: "अंक का नाम", type: "text", required: true },
      { key: "issn", labelEn: "ISSN / Reference", labelHi: "ISSN / संदर्भ", type: "text" },
      { key: "distributionList", labelEn: "Distribution List URL", labelHi: "वितरण सूची लिंक", type: "url" },
      { key: "printCopies", labelEn: "Print Copies", labelHi: "मुद्रित प्रति", type: "number" },
      { key: "digitalCopies", labelEn: "Digital Reach Target", labelHi: "डिजिटल पहुँच लक्ष्य", type: "number" },
    ],
  },
  conference: {
    labelEn: "Conference / Seminar",
    labelHi: "सम्मेलन / संगोष्ठी",
    icon: "Presentation",
    color: "blue",
    descriptionEn: "Outreach for an academic conference or seminar.",
    descriptionHi: "अकादमिक सम्मेलन या संगोष्ठी हेतु प्रसार।",
    fields: [
      { key: "venue", labelEn: "Venue", labelHi: "स्थान", type: "text", required: true },
      { key: "dates", labelEn: "Dates", labelHi: "तिथियाँ", type: "text", required: true },
      { key: "speakers", labelEn: "Speakers Count", labelHi: "वक्ता संख्या", type: "number" },
      { key: "participantsTarget", labelEn: "Participant Target", labelHi: "प्रतिभागी लक्ष्य", type: "number" },
      { key: "proceedingsUrl", labelEn: "Proceedings URL", labelHi: "कार्यवृत्त लिंक", type: "url" },
    ],
  },
  campus: {
    labelEn: "Campus Outreach",
    labelHi: "परिसर प्रसार",
    icon: "GraduationCap",
    color: "emerald",
    descriptionEn: "Programme or follow-up directed at a campus unit.",
    descriptionHi: "किसी परिसर इकाई हेतु कार्यक्रम या अनुवर्तन।",
    fields: [
      { key: "unitId", labelEn: "Campus Unit", labelHi: "परिसर इकाई", type: "select", required: true, source: "campus-units" },
      { key: "programType", labelEn: "Program Type", labelHi: "कार्यक्रम प्रकार", type: "select", required: true,
        options: ["Study Circle", "Workshop", "Guest Lecture", "Book Discussion", "Faculty Meet"] },
      { key: "contactPerson", labelEn: "Contact Person", labelHi: "सम्पर्क व्यक्ति", type: "text" },
      { key: "followUpDate", labelEn: "Next Follow-up", labelHi: "अगला अनुवर्ती", type: "date" },
    ],
  },
  newsletter: {
    labelEn: "Newsletter / Circular",
    labelHi: "समाचार पत्र / परिपत्र",
    icon: "Newspaper",
    color: "amber",
    descriptionEn: "A newsletter or circular sent to a recipient group.",
    descriptionHi: "किसी प्राप्तकर्ता समूह को भेजा गया समाचार पत्र या परिपत्र।",
    fields: [
      { key: "subject", labelEn: "Subject / Topic", labelHi: "विषय", type: "text", required: true },
      { key: "recipientGroup", labelEn: "Recipient Group", labelHi: "प्राप्तकर्ता समूह", type: "select", required: true,
        options: ["All Karyakartas", "Vibhag Level", "Unit Level", "Scholars", "Campus Units"] },
      { key: "medium", labelEn: "Medium", labelHi: "माध्यम", type: "multiselect",
        options: ["Email", "WhatsApp Group", "Physical Copy", "Website Post"] },
    ],
  },
  seminar: {
    labelEn: "Workshop / Shivir",
    labelHi: "कार्यशाला / शिविर",
    icon: "FlaskConical",
    color: "rose",
    descriptionEn: "A workshop or multi-day shivir.",
    descriptionHi: "कार्यशाला या बहु-दिवसीय शिविर।",
    fields: [
      { key: "theme", labelEn: "Theme", labelHi: "विषय", type: "text", required: true },
      { key: "duration", labelEn: "Duration", labelHi: "अवधि", type: "select", required: true,
        options: ["1 day", "2 days", "3 days", "5 days", "7 days"] },
      { key: "participantsCount", labelEn: "Expected Participants", labelHi: "अपेक्षित प्रतिभागी", type: "number" },
      { key: "resourcePersons", labelEn: "Resource Persons", labelHi: "स्रोत व्यक्ति", type: "text" },
    ],
  },
};

export type OutreachTypeKey = keyof typeof OUTREACH_TYPES;
export const OUTREACH_TYPE_KEYS = Object.keys(OUTREACH_TYPES) as OutreachTypeKey[];

export const OUTREACH_STATUSES = ["pending", "in_progress", "completed", "skipped"] as const;
export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];
