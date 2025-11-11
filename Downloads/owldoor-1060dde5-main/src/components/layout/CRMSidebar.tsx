import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Target,
  CreditCard,
  Settings,
  Bot,
  MapPin,
  FileText,
  Calendar,
  BarChart3,
} from "lucide-react";

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface CRMSidebarProps {
  items?: SidebarItem[];
  className?: string;
}

const defaultItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/office" },
  { icon: Users, label: "Recruits", path: "/office-recruits" },
  { icon: MessageSquare, label: "Campaigns", path: "/office-campaigns" },
  { icon: Bot, label: "AI Recruiter", path: "/ai-recruiter" },
  { icon: MapPin, label: "Market Coverage", path: "/market-coverage" },
  { icon: CreditCard, label: "Billing", path: "/office-billing" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: Settings, label: "Settings", path: "/user-settings" },
];

export function CRMSidebar({ items = defaultItems, className }: CRMSidebarProps) {
  return (
    <aside
      className={cn(
        "w-60 border-r bg-background h-screen flex flex-col",
        className
      )}
    >
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto pt-6">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-muted text-[#2D5F4F]"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
