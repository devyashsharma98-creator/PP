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

const baseNavItems: NavItem[] = [
  { label: "Home", sublabel: "मुख्य पृष्ठ", icon: Home, path: "/" },
  { label: "Dashboard", sublabel: "गतिविधियाँ", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Parichay", sublabel: "परिचय", icon: UserCircle, path: "/parichay" },
  { label: "Dayitv", sublabel: "दायित्व", icon: Network, path: "/dayitv" },
  { label: "Vimarsh", sublabel: "विमर्श", icon: MessagesSquare, path: "/vimarsh" },
  { label: "Aalekh & Shodh", sublabel: "आलेख एवं शोध", icon: Newspaper, path: "/feed" },
  { label: "Aalekh Likhna", sublabel: "आलेख लिखें", icon: PenLine, path: "/aalekh" },
  { label: "E-Library", sublabel: "ई-पुस्तकालय", icon: BookOpen, path: "/library" },
  { label: "Calendar", sublabel: "वार्षिक पंचांग", icon: Calendar, path: "/calendar" },
  { label: "Prachar", sublabel: "प्रचार आयाम", icon: Megaphone, path: "/prachar" },
  { label: "Sampark", sublabel: "सम्पर्क", icon: Users, path: "/directory" },
  { label: "Aaj ka Itihas", sublabel: "आज का इतिहास", icon: History, path: "/history" },
];

const adminNavItems: NavItem[] = [
  { label: "System Access", sublabel: "प्रवेश नियंत्रण", icon: ShieldCheck, path: "/super-admin" },
];

export function getNavItems(showAdminControls: boolean) {
  return showAdminControls ? [...baseNavItems, ...adminNavItems] : baseNavItems;
}
