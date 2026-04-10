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
  { label: "Overview", sublabel: "शुरुआती अवलोकन", icon: Home, path: "/overview" },
  { label: "Events", sublabel: "à¤•à¤¾à¤°à¥à¤¯à¤•à¥à¤°à¤® à¤µ à¤…à¤¨à¥à¤®à¥‹à¤¦à¤¨", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Aalekh", sublabel: "à¤²à¥‡à¤–à¤¨ à¤µ à¤¸à¤®à¥€à¤•à¥à¤·à¤¾", icon: PenLine, path: "/aalekh" },
  { label: "Prachar", sublabel: "à¤ªà¥à¤°à¤šà¤¾à¤° à¤«à¥‰à¤²à¥‹-à¤¥à¥à¤°à¥‚", icon: Megaphone, path: "/prachar" },
];

const coordinationNavItems: NavItem[] = [
  { label: "Calendar", sublabel: "à¤¯à¥‹à¤œà¤¨à¤¾ à¤µ à¤¤à¤¿à¤¥à¤¿à¤¯à¤¾à¤", icon: Calendar, path: "/calendar" },
  { label: "People", sublabel: "à¤¸à¤®à¥à¤ªà¤°à¥à¤• à¤µ à¤¸à¤®à¤¨à¥à¤µà¤¯", icon: Users, path: "/directory" },
];

const referenceNavItems: NavItem[] = [
  { label: "Vimarsh", sublabel: "à¤µà¤¿à¤·à¤¯ à¤µ à¤µà¤¿à¤®à¤°à¥à¤¶", icon: MessagesSquare, path: "/vimarsh" },
  { label: "Library", sublabel: "à¤ˆ-à¤ªà¥à¤¸à¥à¤¤à¤•à¤¾à¤²à¤¯", icon: BookOpen, path: "/library" },
  { label: "Published", sublabel: "à¤ªà¥à¤°à¤•à¤¾à¤¶à¤¿à¤¤ à¤•à¤¾à¤°à¥à¤¯", icon: Newspaper, path: "/feed" },
  { label: "Structure", sublabel: "à¤­à¥‚à¤®à¤¿à¤•à¤¾ à¤°à¤šà¤¨à¤¾", icon: Network, path: "/dayitv" },
  { label: "Parichay", sublabel: "à¤ªà¤°à¤¿à¤šà¤¯", icon: UserCircle, path: "/parichay" },
  { label: "History", sublabel: "à¤¸à¤‚à¤¦à¤°à¥à¤­ à¤‡à¤¤à¤¿à¤¹à¤¾à¤¸", icon: History, path: "/history" },
];

const adminNavItems: NavItem[] = [
  { label: "System Access", sublabel: "à¤ªà¥à¤°à¤µà¥‡à¤¶ à¤¨à¤¿à¤¯à¤‚à¤¤à¥à¤°à¤£", icon: ShieldCheck, path: "/super-admin" },
];

export function getNavGroups(showAdminControls: boolean): NavGroup[] {
  const groups: NavGroup[] = [
    { title: "Workflow", titleHi: "à¤®à¥à¤–à¥à¤¯ à¤•à¤¾à¤°à¥à¤¯", items: workflowNavItems },
    { title: "Coordination", titleHi: "à¤¸à¤®à¤¨à¥à¤µà¤¯", items: coordinationNavItems },
    { title: "Reference", titleHi: "à¤¸à¤‚à¤¦à¤°à¥à¤­", items: referenceNavItems },
  ];

  if (showAdminControls) {
    groups.push({ title: "Admin", titleHi: "à¤ªà¥à¤°à¤¶à¤¾à¤¸à¤¨", items: adminNavItems });
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
