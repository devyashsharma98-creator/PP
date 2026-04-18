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
  { label: "Dashboard", sublabel: "\u0921\u0948\u0936\u092c\u094b\u0930\u094d\u0921", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Aalekh", sublabel: "\u0932\u0947\u0916\u0928 \u0935 \u0938\u092e\u0940\u0915\u094d\u0937\u093e", icon: PenLine, path: "/aalekh" },
  { label: "Prachar", sublabel: "\u092a\u094d\u0930\u091a\u093e\u0930 \u092b\u0949\u0932\u094b-\u0925\u094d\u0930\u0942", icon: Megaphone, path: "/prachar" },
];

const mobilePrimaryNavItems: NavItem[] = [
  { label: "Dashboard", sublabel: "\u0921\u0948\u0936\u092c\u094b\u0930\u094d\u0921", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Aalekh", sublabel: "\u0906\u0932\u0947\u0916", icon: PenLine, path: "/aalekh" },
  { label: "Prachar", sublabel: "\u092a\u094d\u0930\u091a\u093e\u0930", icon: Megaphone, path: "/prachar" },
  { label: "Calendar", sublabel: "\u0915\u0948\u0932\u0947\u0902\u0921\u0930", icon: Calendar, path: "/calendar" },
];

const coordinationNavItems: NavItem[] = [
  { label: "Calendar", sublabel: "\u092f\u094b\u091c\u0928\u093e \u0935 \u0924\u093f\u0925\u093f\u092f\u093e\u0901", icon: Calendar, path: "/calendar" },
  { label: "People", sublabel: "\u0938\u092e\u094d\u092a\u0930\u094d\u0915 \u0935 \u0938\u092e\u0928\u094d\u0935\u092f", icon: Users, path: "/directory" },
];

const referenceNavItems: NavItem[] = [
  { label: "Landing", sublabel: "\u092a\u0930\u093f\u091a\u092f \u092a\u0943\u0937\u094d\u0920", icon: Home, path: "/parichay" },
  { label: "Vimarsh", sublabel: "\u0935\u093f\u0937\u092f \u0935 \u0935\u093f\u092e\u0930\u094d\u0936", icon: MessagesSquare, path: "/vimarsh" },
  { label: "Library", sublabel: "\u0908-\u092a\u0941\u0938\u094d\u0924\u0915\u093e\u0932\u092f", icon: BookOpen, path: "/library" },
  { label: "Published", sublabel: "\u092a\u094d\u0930\u0915\u093e\u0936\u093f\u0924 \u0915\u093e\u0930\u094d\u092f", icon: Newspaper, path: "/feed" },
  { label: "Structure", sublabel: "\u092d\u0942\u092e\u093f\u0915\u093e \u0930\u091a\u0928\u093e", icon: Network, path: "/dayitv" },
  { label: "History", sublabel: "\u0938\u0902\u0926\u0930\u094d\u092d \u0907\u0924\u093f\u0939\u093e\u0938", icon: History, path: "/history" },
];

const adminNavItems: NavItem[] = [
  { label: "System Access", sublabel: "\u092a\u094d\u0930\u0935\u0947\u0936 \u0928\u093f\u092f\u0902\u0924\u094d\u0930\u0923", icon: ShieldCheck, path: "/super-admin" },
];

function filterItemsByRole(items: NavItem[], roleCodes?: readonly RoleCode[] | null) {
  if (!roleCodes) return items;
  return items.filter((item) => canAccessPathForRoles(item.path, roleCodes));
}

export function getNavGroups(showAdminControls: boolean, roleCodes?: readonly RoleCode[] | null): NavGroup[] {
  const groups: NavGroup[] = [
    { title: "Workflow", titleHi: "\u092e\u0941\u0916\u094d\u092f \u0915\u093e\u0930\u094d\u092f", items: workflowNavItems },
    { title: "Coordination", titleHi: "\u0938\u092e\u0928\u094d\u0935\u092f", items: coordinationNavItems },
    { title: "Reference", titleHi: "\u0938\u0902\u0926\u0930\u094d\u092d", items: referenceNavItems },
  ];

  if (showAdminControls) {
    groups.push({ title: "Admin", titleHi: "\u092a\u094d\u0930\u0936\u093e\u0938\u0928", items: adminNavItems });
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
