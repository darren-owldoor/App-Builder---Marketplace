import { Link, useNavigate, useLocation } from "react-router-dom";
import { ThemeSelector } from "@/components/ThemeSelector";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isHomePage = location.pathname === "/";
  return <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src="/owldoor-icon.svg" alt="OwlDoor" className="h-8 w-8 md:h-12 md:w-12" />
            <span className="text-2xl md:text-4xl font-extrabold">OwlDoor</span>
          </Link>
          
          {/* Desktop Navigation */}
          

          {/* Mobile Navigation */}
          {!isHomePage && <div className="flex md:hidden items-center gap-2">
              <ThemeSelector />
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <div className="flex flex-col gap-6 mt-8">
                    <Link to="/for-brokerages" className="text-lg font-medium text-foreground hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
                      Teams
                    </Link>
                    <Link to="/for-agents" className="text-lg font-medium text-foreground hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
                      Agents
                    </Link>
                    <Link to="/pricing" className="text-lg font-medium text-foreground hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
                      Pricing
                    </Link>
                    <Link to="/contact" className="text-lg font-medium text-foreground hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
                      Contact
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>}
          {isHomePage && <div className="flex md:hidden items-center">
              <Button onClick={() => navigate("/auth")} className="text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                Login
              </Button>
            </div>}
        </div>
      </div>
    </nav>;
};