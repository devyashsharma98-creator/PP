import {
  Activity,
  BarChart3,
  Bell,
  BellRing,
  BookMarked,
  BookOpen,
  Building2,
  Calendar,
  ClipboardList,
  Cog,
  FlaskConical,
  GraduationCap,
  Hash,
  History,
  Home,
  Image,
  LayoutDashboard,
  ListTodo,
  Megaphone,
  MessagesSquare,
  MessageSquare,
  Network,
  Newspaper,
  PenLine,
  Presentation,
  ShieldCheck,
  Tags,
  Trophy,
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
  description?: string;
  descriptionHi?: string;
};

export type NavGroup = {
  title: string;
  titleHi: string;
  icon?: LucideIcon;
  items: NavItem[];
};

const workflowNavItems: NavItem[] = [
  { label: "Dashboard", sublabel: "डैशबोर्ड", icon: LayoutDashboard, path: "/dashboard", description: "Overview, tasks, notifications", descriptionHi: "अवलोकन, कार्य, सूचनाएँ" },
  { label: "Smaran", sublabel: "स्मरण", icon: BellRing, path: "/smaran", description: "Deadlines & reminders", descriptionHi: "समय-सीमा एवं स्मरण" },
  { label: "Aalekh", sublabel: "लेखन व समीक्षा", icon: PenLine, path: "/aalekh", description: "Write, review, publish", descriptionHi: "लिखें, समीक्षा करें, प्रकाशित करें" },
  { label: "Prakashan", sublabel: "प्रकाशन", icon: BookMarked, path: "/prakashan", description: "Editorial & publishing", descriptionHi: "संपादकीय एवं प्रकाशन" },
  { label: "Shodh", sublabel: "शोध", icon: FlaskConical, path: "/shodh", description: "Research projects", descriptionHi: "शोध परियोजनाएँ" },
  { label: "Prachar", sublabel: "शैक्षिक प्रसार", icon: Megaphone, path: "/prachar", description: "Academic outreach", descriptionHi: "पत्रिका, सम्मेलन एवं परिसर प्रसार" },
  { label: "Prachar Vishleshan", sublabel: "प्रसार विश्लेषण", icon: BarChart3, path: "/prachar-vishleshan", description: "Outreach analytics", descriptionHi: "प्रसार पूर्णता विश्लेषण" },
  { label: "Calendar", sublabel: "योजना व तिथियाँ", icon: Calendar, path: "/calendar", description: "Events & planning", descriptionHi: "कार्यक्रम और योजना" },
  { label: "My Impact", sublabel: "मेरा योगदान", icon: Trophy, path: "/impact", description: "Your contribution & recognition", descriptionHi: "आपका योगदान एवं सम्मान" },
];

const mobilePrimaryNavItems: NavItem[] = [
  { label: "Dashboard", sublabel: "डैशबोर्ड", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Aalekh", sublabel: "आलेख", icon: PenLine, path: "/aalekh" },
  { label: "Prachar", sublabel: "प्रचार", icon: Megaphone, path: "/prachar" },
  { label: "Calendar", sublabel: "कैलेंडर", icon: Calendar, path: "/calendar" },
];

const dashboardModuleNavItems: NavItem[] = [
  { label: "Task Board", sublabel: "कार्य बोर्ड", icon: ListTodo, path: "/task-board", description: "Projects and assignments", descriptionHi: "परियोजना और कार्य" },
  { label: "Notifications", sublabel: "सूचनाएँ", icon: Bell, path: "/notifications", description: "Alerts and updates", descriptionHi: "अलर्ट और अद्यतन" },
  { label: "Circulars", sublabel: "परिपत्र", icon: Megaphone, path: "/circulars", description: "Announcements", descriptionHi: "घोषणाएँ" },
  { label: "Volunteers", sublabel: "स्वयंसेवक", icon: Users, path: "/volunteers", description: "Volunteer records", descriptionHi: "स्वयंसेवक अभिलेख" },
  { label: "Media Library", sublabel: "मीडिया लाइब्रेरी", icon: Image, path: "/media", description: "Photos and files", descriptionHi: "फोटो और फाइल" },
  { label: "Conferences", sublabel: "सम्मेलन", icon: Presentation, path: "/conferences", description: "Sessions and speakers", descriptionHi: "सत्र और वक्ता" },
  { label: "Surveys", sublabel: "सर्वे", icon: ClipboardList, path: "/surveys", description: "Forms and responses", descriptionHi: "फॉर्म और उत्तर" },
];

const coordinationNavItems: NavItem[] = [
  { label: "People", sublabel: "सम्पर्क व समन्वय", icon: Users, path: "/directory", description: "Contact directory", descriptionHi: "सम्पर्क सूची" },
  { label: "Scholars", sublabel: "विद्वत मंडल", icon: GraduationCap, path: "/scholars", description: "Scholar & expert registry", descriptionHi: "विद्वान एवं विशेषज्ञ पंजिका" },
  { label: "Campus Ikai", sublabel: "परिसर इकाई", icon: Building2, path: "/ikai", description: "University & college units", descriptionHi: "विश्वविद्यालय एवं महाविद्यालय इकाइयाँ" },
  { label: "Dayitv", sublabel: "भूमिका रचना", icon: Network, path: "/dayitv", description: "Role & responsibility matrix", descriptionHi: "भूमिका और उत्तरदायित्व मैट्रिक्स" },
];

const referenceNavItems: NavItem[] = [
  { label: "Landing", sublabel: "परिचय पृष्ठ", icon: Home, path: "/parichay", description: "Organisation landing page", descriptionHi: "संगठन परिचय पृष्ठ" },
  { label: "Vimarsh", sublabel: "विषय व विमर्श", icon: MessagesSquare, path: "/vimarsh", description: "Discussion topics", descriptionHi: "विषयगत चर्चा" },
  { label: "Vishay", sublabel: "विषय वर्गीकरण", icon: Tags, path: "/vishay", description: "Subject-area taxonomy", descriptionHi: "विषय-क्षेत्र वर्गीकरण" },
  { label: "Vimarsh Charcha", sublabel: "विमर्श चर्चा", icon: MessageSquare, path: "/charcha", description: "Internal discussion & debate", descriptionHi: "आंतरिक चर्चा एवं विमर्श" },
  { label: "Library", sublabel: "ई-पुस्तकालय", icon: BookOpen, path: "/library", description: "E-library & resources", descriptionHi: "ई-पुस्तकालय और संसाधन" },
  { label: "Published", sublabel: "प्रकाशित कार्य", icon: Newspaper, path: "/feed", description: "Published aalekh feed", descriptionHi: "प्रकाशित आलेख फ़ीड" },
  { label: "History", sublabel: "संदर्भ इतिहास", icon: History, path: "/history", description: "Reference & archives", descriptionHi: "संदर्भ और पुरालेख" },
  { label: "Guide", sublabel: "उपयोगकर्ता मार्गदर्शिका", icon: Hash, path: "/guide", description: "User guide & help", descriptionHi: "उपयोगकर्ता मार्गदर्शिका" },
];

const adminNavItems: NavItem[] = [
  { label: "System Access", sublabel: "प्रवेश नियंत्रण", icon: ShieldCheck, path: "/super-admin", description: "Console & configuration", descriptionHi: "कंसोल और कॉन्फ़िगरेशन" },
  { label: "Users", sublabel: "उपयोगकर्ता प्रबंधन", icon: Users, path: "/users", description: "Accounts & role assignments", descriptionHi: "खाते और भूमिका आवंटन" },
  { label: "Overview", sublabel: "सिस्टम अवलोकन", icon: Activity, path: "/overview", description: "System-wide activity overview", descriptionHi: "सिस्टम-व्यापी गतिविधि अवलोकन" },
];

function filterItemsByRole(items: NavItem[], roleCodes?: readonly RoleCode[] | null) {
  if (!roleCodes) return items;
  return items.filter((item) => canAccessPathForRoles(item.path, roleCodes));
}

export function getNavGroups(showAdminControls: boolean, roleCodes?: readonly RoleCode[] | null): NavGroup[] {
  const groups: NavGroup[] = [
    { title: "Workflow", titleHi: "मुख्य कार्य", icon: LayoutDashboard, items: workflowNavItems },
    { title: "Coordination", titleHi: "समन्वय", icon: Users, items: coordinationNavItems },
    { title: "Reference", titleHi: "संदर्भ", icon: BookOpen, items: referenceNavItems },
  ];

  // Modules are now standalone pages (gated per-route by DASHBOARD_ROLES). Always
  // offer the group; filterItemsByRole + the empty-group filter below handle
  // visibility, so non-admin dashboard roles keep access they had pre-split.
  groups.splice(1, 0, { title: "Modules", titleHi: "मॉड्यूल", icon: Activity, items: dashboardModuleNavItems });

  if (showAdminControls) {
    groups.push({ title: "Admin", titleHi: "प्रशासन", icon: Cog, items: adminNavItems });
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
    [...dashboardModuleNavItems, ...coordinationNavItems, ...referenceNavItems, ...(showAdminControls ? adminNavItems : [])],
    roleCodes,
  );
}
