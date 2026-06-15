"use client";

import { useMemo } from "react";
import type { Role } from "@/context/AppContext";

interface ShellFrame {
  titleEn: string;
  titleHi: string;
  subtitleEn: string;
  subtitleHi: string;
}

const ROOT_FRAME: ShellFrame = {
  titleEn: "Overview",
  titleHi: "अवलोकन",
  subtitleEn: "Start here for system health, hierarchy checks, and cross-workflow visibility.",
  subtitleHi: "स्वास्थ्य जाँच, पदानुक्रम समीक्षा और कार्यप्रवाह की दृश्यता यहीं से शुरू करें।",
};

const DASHBOARD_FRAMES: Record<string, ShellFrame> = {
  vibhag_pramukh: {
    titleEn: "Institutional Console",
    titleHi: "संस्थागत प्रणाली",
    subtitleEn: "Final approvals, publication, and unit coordination in one operational view.",
    subtitleHi: "एक ही परिचालन दृश्य में अंतिम अनुमोदन, प्रकाशन और इकाई समन्वय।",
  },
  aayam_pramukh: {
    titleEn: "Aayam Review Desk",
    titleHi: "आयाम समीक्षा डेस्क",
    subtitleEn: "Review incoming programmes, forward ready work, and keep the organisational lane clear.",
    subtitleHi: "आगत कार्यक्रमों की समीक्षा करें, तैयार कार्य आगे भेजें और संगठनात्मक धारा स्पष्ट रखें।",
  },
};

const DEFAULT_DASHBOARD: ShellFrame = {
  titleEn: "Events & Approvals",
  titleHi: "कार्यक्रम व अनुमोदन",
  subtitleEn: "Plan programmes, move them through review, and complete the event workflow here.",
  subtitleHi: "कार्यक्रम योजना, समीक्षा प्रवाह और अंतिम आयोजन इसी सतह से चलाएँ।",
};

const ROUTE_FRAMES: (ShellFrame & { match: string })[] = [
  { match: "/super-admin", titleEn: "Access Governance", titleHi: "प्रवेश संचालन", subtitleEn: "Account creation, authority boundaries, and role-based system access in one controlled surface.", subtitleHi: "एक ही नियंत्रित सतह पर खाते बनाना, अधिकार सीमाएँ और भूमिका-आधारित प्रणाली पहुँच।" },
  { match: "/users", titleEn: "Access Governance", titleHi: "प्रवेश संचालन", subtitleEn: "Account creation, authority boundaries, and role-based system access in one controlled surface.", subtitleHi: "एक ही नियंत्रित सतह पर खाते बनाना, अधिकार सीमाएँ और भूमिका-आधारित प्रणाली पहुँच।" },
  { match: "/prachar", titleEn: "Prachar Desk", titleHi: "प्रचार डेस्क", subtitleEn: "Close distribution gaps, confirm channel coverage, and finish outreach follow-through.", subtitleHi: "वितरण में अंतराल बंद करें, माध्यम कवरेज सुनिश्चित करें और प्रसार अनुवर्तन पूरा करें।" },
  { match: "/aalekh", titleEn: "Aalekh Desk", titleHi: "आलेख डेस्क", subtitleEn: "Write, review, revise, and prepare institutional content for publication.", subtitleHi: "लेखन, समीक्षा, संशोधन और प्रकाशन-तैयार सामग्री यहीं तैयार करें।" },
  { match: "/feed", titleEn: "Published Work", titleHi: "प्रकाशित कार्य", subtitleEn: "The current record of approved and circulated institutional writing.", subtitleHi: "अनुमोदित और प्रसारित संस्थागत लेखन का वर्तमान अभिलेख।" },
  { match: "/dayitv", titleEn: "Dayitva Matrix", titleHi: "दायित्व संरचना", subtitleEn: "Organisational roles, reporting lines, and accountability structure.", subtitleHi: "संगठनात्मक भूमिकाएँ, संपर्क धाराएँ और उत्तरदायित्व की संरचना।" },
  { match: "/calendar", titleEn: "Annual Panchang", titleHi: "वार्षिक पंचांग", subtitleEn: "Programme rhythm, dates, and shared institutional calendar visibility.", subtitleHi: "कार्यक्रम लय, तिथियाँ और साझा संस्थागत पंचांग दृश्यता।" },
  { match: "/directory", titleEn: "Sampark Directory", titleHi: "सम्पर्क निर्देशिका", subtitleEn: "Institutional contacts, roles, and points of coordination.", subtitleHi: "संस्थागत सम्पर्क, दायित्व और समन्वय बिंदु।" },
  { match: "/library", titleEn: "E-Library", titleHi: "ई-पुस्तकालय", subtitleEn: "Reference texts, study material, and archived intellectual resources.", subtitleHi: "सन्दर्भ ग्रंथ, अध्ययन सामग्री और संग्रहित बौद्धिक संसाधन।" },
];

const FALLBACK_FRAME: ShellFrame = {
  titleEn: "Pragya Pravah",
  titleHi: "प्रज्ञा प्रवाह",
  subtitleEn: "Civilisational discourse, organised action.",
  subtitleHi: "सभ्यतागत विमर्श, संगठित कार्य।",
};

/**
 * Time: O(1) — bounded linear scan over 9 static frames.
 * Space: O(1) — returns a constant reference when possible.
 */
export function useShellFrame(pathname: string, role: Role): ShellFrame {
  return useMemo(() => {
    if (pathname === "/" || pathname === "/overview") return ROOT_FRAME;
    if (pathname === "/dashboard") return DASHBOARD_FRAMES[role] ?? DEFAULT_DASHBOARD;
    return ROUTE_FRAMES.find((f) => pathname.startsWith(f.match)) ?? FALLBACK_FRAME;
  }, [pathname, role]);
}
