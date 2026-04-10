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
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";

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
  { label: "Overview", sublabel: "शुरुआती अवलोकन", icon: Home, path: "/" },
  { label: "Events", sublabel: "कार्यक्रम व अनुमोदन", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Aalekh", sublabel: "लेखन व समीक्षा", icon: PenLine, path: "/aalekh" },
  { label: "Prachar", sublabel: "प्रचार फॉलो-थ्रू", icon: Megaphone, path: "/prachar" },
];

const coordinationNavItems: NavItem[] = [
  { label: "Calendar", sublabel: "योजना व तिथियाँ", icon: Calendar, path: "/calendar" },
  { label: "People", sublabel: "सम्पर्क व समन्वय", icon: Users, path: "/directory" },
];

const referenceNavItems: NavItem[] = [
  { label: "Vimarsh", sublabel: "विषय व विमर्श", icon: MessagesSquare, path: "/vimarsh" },
  { label: "Library", sublabel: "ई-पुस्तकालय", icon: BookOpen, path: "/library" },
  { label: "Published", sublabel: "प्रकाशित कार्य", icon: Newspaper, path: "/feed" },
  { label: "Structure", sublabel: "भूमिका रचना", icon: Network, path: "/dayitv" },
  { label: "Parichay", sublabel: "परिचय", icon: UserCircle, path: "/parichay" },
  { label: "History", sublabel: "संदर्भ इतिहास", icon: History, path: "/history" },
];

const adminNavItems: NavItem[] = [
  { label: "System Access", sublabel: "प्रवेश नियंत्रण", icon: ShieldCheck, path: "/super-admin" },
];

export function getNavGroups(showAdminControls: boolean): NavGroup[] {
  const groups: NavGroup[] = [
    { title: "Workflow", titleHi: "मुख्य कार्य", items: workflowNavItems },
    { title: "Coordination", titleHi: "समन्वय", items: coordinationNavItems },
    { title: "Reference", titleHi: "संदर्भ", items: referenceNavItems },
  ];

  if (showAdminControls) {
    groups.push({ title: "Admin", titleHi: "प्रशासन", items: adminNavItems });
  }

  return groups;
}

export function getNavItems(showAdminControls: boolean) {
  return getNavGroups(showAdminControls).flatMap((group) => group.items);
}

export function getMobilePrimaryNav() {
  return workflowNavItems;
}

export function getOverflowNavItems(showAdminControls: boolean) {
  return [...coordinationNavItems, ...referenceNavItems, ...(showAdminControls ? adminNavItems : [])];
}
