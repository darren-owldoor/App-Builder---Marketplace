import {
  Home,
  Users,
  Settings,
  Zap,
  Phone,
  LifeBuoy,
  Package,
  Mail,
  MessageSquare,
  Send,
  Upload,
  UserPlus,
  MapPin,
  TrendingUp,
  FileText,
  Menu,
  Coins,
  Database,
  Bot,
  CreditCard,
  AlertTriangle,
  Palette,
  LayoutTemplate,
  Code,
  Globe,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import owlDoorLogo from "@/assets/owldoor-icon-green.png";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: (pathname: string) => boolean;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: Home,
    isActive: (pathname) => pathname === "/admin"
  },
  {
    title: "Agent Pipeline",
    href: "/admin?view=pipeline",
    icon: TrendingUp,
    isActive: (pathname) => pathname === "/admin"
  },
  {
    title: "Teams/Companies",
    href: "/admin?view=clients",
    icon: Users,
  },
  {
    title: "Credits",
    href: "/admin/credits",
    icon: Coins,
  },
  {
    title: "Payment Links",
    href: "/payments",
    icon: CreditCard,
  },
  {
    title: "User Management",
    href: "/admin?view=users",
    icon: UserPlus,
  },
  {
    title: "Analytics",
    href: "/admin?view=analytics",
    icon: TrendingUp,
  },
  {
    title: "Frappe Designer",
    href: "/admin?view=frappe",
    icon: Code,
  },
  {
    title: "Claudable Builder",
    href: "/admin?view=claudable",
    icon: Palette,
  },
  {
    title: "Vercel Sites",
    href: "/admin?view=vercel",
    icon: Globe,
  },
  {
    title: "Landing Builder",
    href: "/admin?view=landing-builder",
    icon: LayoutTemplate,
  },
  {
    title: "Campaigns",
    href: "/campaigns",
    icon: Send,
  },
  {
    title: "Integrations",
    href: "/admin/integrations",
    icon: Zap,
  },
  {
    title: "Errors & Testing",
    href: "/admin/errors",
    icon: AlertTriangle,
  },
  {
    title: "Field Management",
    href: "/admin/field-management",
    icon: Database,
  },
  {
    title: "AI Tester",
    href: "/admin/ai-tester",
    icon: Bot,
  },
  {
    title: "Phone Numbers",
    href: "/admin?view=phones",
    icon: Phone,
  },
  {
    title: "Support Tickets",
    href: "/admin?view=support",
    icon: LifeBuoy,
  },
  {
    title: "Packages",
    href: "/packages",
    icon: Package,
  },
  {
    title: "Blog Management",
    href: "/blog-management",
    icon: FileText,
  },
  {
    title: "System Settings",
    href: "/admin?view=settings",
    icon: Settings,
  },
  {
    title: "System Limits",
    href: "/admin?view=limits",
    icon: Database,
  },
];

const quickActions: NavItem[] = [
  {
    title: "Import Agents",
    href: "/import-leads",
    icon: Upload,
  },
  {
    title: "Import Clients",
    href: "/import-clients",
    icon: Upload,
  },
  {
    title: "Directory Upload",
    href: "/directory-upload",
    icon: Upload,
  },
  {
    title: "Email Templates",
    href: "/email-templates",
    icon: Mail,
  },
  {
    title: "SMS Templates",
    href: "/sms-templates",
    icon: MessageSquare,
  },
  {
    title: "Onboarding Links",
    href: "/admin?view=onboarding",
    icon: UserPlus,
  },
  {
    title: "ZIP Geocoder",
    href: "/admin?view=geocoder",
    icon: MapPin,
  },
];

export const AdminSidebar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/admin" onClick={() => isMobile && setOpen(false)}>
          <img src={owlDoorLogo} alt="OwlDoor" className="h-12 cursor-pointer hover:opacity-80 transition-opacity" />
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="mb-4">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Main Menu
          </h3>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isActive 
              ? item.isActive(location.pathname)
              : location.pathname === item.href || location.pathname + location.search === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => isMobile && setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </div>

        <div className="pt-4 border-t border-border">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Quick Actions
          </h3>
          {quickActions.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => isMobile && setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="fixed top-4 left-4 z-50 md:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 flex flex-col">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="w-64 h-screen bg-card border-r border-border flex flex-col overflow-y-auto">
      <SidebarContent />
    </div>
  );
};
