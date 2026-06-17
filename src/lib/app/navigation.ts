import {
  BookOpen,
  Calendar,
  History,
  Home,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  Network,
  Newspaper,
  PenLine,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { RoleCode } from "@/lib/permissions/types";
import { canAccessPathForRoles } from "@/lib/app/role-routing";

export type NavItem = {
  label: string;
  sublabel: string;
  icon: LucideIcon;
  path: string;
};

export type NavGroup = {
  title: string;
  titleHi: string;
  items: NavItem[];
};

const workflowNavItems: NavItem[] = [
  { label: "Dashboard", sublabel: "डैशबोर्ड", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Aalekh", sublabel: "लेखन व समीक्षा", icon: PenLine, path: "/aalekh" },
  { label: "Prachar", sublabel: "प्रचार फॉलो-थ्रू", icon: Megaphone, path: "/prachar" },
  { label: "Calendar", sublabel: "योजना व तिथियाँ", icon: Calendar, path: "/calendar" },
];

const mobilePrimaryNavItems: NavItem[] = [
  { label: "Dashboard", sublabel: "डैशबोर्ड", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Aalekh", sublabel: "आलेख", icon: PenLine, path: "/aalekh" },
  { label: "Prachar", sublabel: "प्रचार", icon: Megaphone, path: "/prachar" },
  { label: "Calendar", sublabel: "कैलेंडर", icon: Calendar, path: "/calendar" },
];

const coordinationNavItems: NavItem[] = [
  { label: "People", sublabel: "सम्पर्क व समन्वय", icon: Users, path: "/directory" },
];

const referenceNavItems: NavItem[] = [
  { label: "Landing", sublabel: "परिचय पृष्ठ", icon: Home, path: "/parichay" },
  { label: "Vimarsh", sublabel: "विषय व विमर्श", icon: MessagesSquare, path: "/vimarsh" },
  { label: "Library", sublabel: "ई-पुस्तकालय", icon: BookOpen, path: "/library" },
  { label: "Published", sublabel: "प्रकाशित कार्य", icon: Newspaper, path: "/feed" },
  { label: "Structure", sublabel: "भूमिका रचना", icon: Network, path: "/dayitv" },
  { label: "History", sublabel: "संदर्भ इतिहास", icon: History, path: "/history" },
];

const adminNavItems: NavItem[] = [
  { label: "System Access", sublabel: "प्रवेश नियंत्रण", icon: ShieldCheck, path: "/super-admin" },
];

function filterItemsByRole(items: NavItem[], roleCodes?: readonly RoleCode[] | null) {
  if (!roleCodes) return items;
  return items.filter((item) => canAccessPathForRoles(item.path, roleCodes));
}

export function getNavGroups(showAdminControls: boolean, roleCodes?: readonly RoleCode[] | null): NavGroup[] {
  const groups: NavGroup[] = [
    { title: "Workflow", titleHi: "मुख्य कार्य", items: workflowNavItems },
    { title: "Coordination", titleHi: "समन्वय", items: coordinationNavItems },
    { title: "Reference", titleHi: "संदर्भ", items: referenceNavItems },
  ];

  if (showAdminControls) {
    groups.push({ title: "Admin", titleHi: "प्रशासन", items: adminNavItems });
  }

  return groups
    .map((group) => ({ ...group, items: filterItemsByRole(group.items, roleCodes) }))
    .filter((group) => group.items.length > 0);
}

export function getNavItems(showAdminControls: boolean, roleCodes?: readonly RoleCode[] | null) {
  return getNavGroups(showAdminControls, roleCodes).flatMap((group) => group.items);
}

export function getMobilePrimaryNav(roleCodes?: readonly RoleCode[] | null) {
  return filterItemsByRole(mobilePrimaryNavItems, roleCodes);
}

export function getOverflowNavItems(showAdminControls: boolean, roleCodes?: readonly RoleCode[] | null) {
  return filterItemsByRole(
    [...coordinationNavItems, ...referenceNavItems, ...(showAdminControls ? adminNavItems : [])],
    roleCodes,
  );
}
