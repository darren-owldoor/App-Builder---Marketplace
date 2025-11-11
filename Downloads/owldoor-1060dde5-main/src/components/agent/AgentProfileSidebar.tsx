import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  MapPin, 
  Calendar, 
  Users, 
  FileText, 
  Settings, 
  MessageSquare,
  DollarSign,
  HeadphonesIcon,
  Menu
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface AgentProfileSidebarProps {
  leadCount?: number;
}

const AgentProfileSidebar = ({ leadCount = 0 }: AgentProfileSidebarProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/agents", badge: undefined },
    { icon: FileText, label: "My Matches", path: "/matches", badge: undefined },
    { icon: Settings, label: "Edit Profile", path: "/edit-agent-profile", badge: undefined },
  ];

  const isActive = (path: string) => location.pathname === path;

  const NavContent = () => (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => isMobile && setOpen(false)}
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            {item.badge !== undefined && item.badge > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {item.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
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
        <SheetContent side="left" className="w-64 p-4">
          <NavContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="w-64 border-r bg-card/50 backdrop-blur-sm min-h-screen p-4">
      <NavContent />
    </aside>
  );
};

export default AgentProfileSidebar;
