import { Home, Users, MessageSquare, BarChart3, Settings } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Overview", tabValue: "overview", icon: Home },
  { title: "Pipeline", tabValue: "pipeline", icon: Users },
  { title: "Conversations", tabValue: "conversations", icon: MessageSquare },
  { title: "Analytics", tabValue: "analytics", icon: BarChart3 },
  { title: "Settings", tabValue: "settings", icon: Settings },
];

export function AIRecruiterSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'overview';

  return (
    <Sidebar collapsible="icon" className="bg-background border-r">
      <SidebarContent className="pt-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-3">
              {menuItems.map((item) => {
                const isActive = currentTab === item.tabValue;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link 
                        to={`/ai-recruiter?tab=${item.tabValue}`}
                        className={`rounded-xl px-4 py-3 transition-colors ${
                          isActive 
                            ? "bg-muted text-[#2D5F4F] font-medium" 
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        {state !== 'collapsed' && <span className="ml-3">{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
