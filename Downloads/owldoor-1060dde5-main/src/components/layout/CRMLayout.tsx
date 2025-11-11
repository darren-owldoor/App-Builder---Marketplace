import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Settings, Menu } from "lucide-react";
import { CRMSidebar } from "./CRMSidebar";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { supabase } from "@/integrations/supabase/client";
import owlDoorLogo from "@/assets/owldoor-logo-new.png";

interface CRMLayoutProps {
  children: ReactNode;
  userEmail?: string;
  userId?: string;
  companyName?: string;
  className?: string;
}

export function CRMLayout({
  children,
  userEmail,
  userId,
  companyName,
  className,
}: CRMLayoutProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getInitials = (email?: string) => {
    if (!email) return "U";
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <CRMSidebar />
      </div>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-background sticky top-0 z-10">
          <div className="h-full px-6 flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-60">
                  <CRMSidebar />
                </SheetContent>
              </Sheet>
              
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                <img
                  src={owlDoorLogo}
                  alt="OwlDoor"
                  className="h-10"
                />
                <span className="text-xl font-semibold text-[#2D5F4F]">OwlDoor</span>
              </div>
            </div>

            {/* Center: Company Name */}
            <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
              {companyName && (
                <span className="text-base font-semibold">{companyName}</span>
              )}
            </div>

            {/* Right: Plan Badge */}
            <div className="flex items-center gap-3">
              <div className="h-8 px-4 rounded-md bg-muted flex items-center">
                <span className="text-sm text-muted-foreground">Free plan</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(userEmail)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Photo Upload Section */}
                  <div className="px-2 py-3 flex flex-col items-center gap-2">
                    <ProfilePhotoUpload 
                      currentPhotoUrl={photoUrl}
                      userEmail={userEmail}
                      onPhotoUpdated={setPhotoUrl}
                    />
                    <p className="text-xs text-muted-foreground">Click camera icon to change photo</p>
                  </div>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/office-profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/user-settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className={className || "container mx-auto p-6"}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
