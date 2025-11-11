import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Star, Search, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import owlWave from "@/assets/owl-wave.svg";
import owlHero from "@/assets/owl-with-tie.png";
import owlDoorLogo from "@/assets/owldoor-logo-light-green.png";
import { ThemeSelector } from "@/components/ThemeSelector";
import { BrokerageSearchModal } from "@/components/BrokerageSearchModal";
import { GooglePlacesAutocomplete } from "@/components/GooglePlacesAutocomplete";

const FindBrokerage = () => {
  const navigate = useNavigate();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedState, setSelectedState] = useState("");

  const stats = [
    { value: "10,000+", label: "Agents Matched" },
    { value: "500+", label: "Brokerages" },
    { value: "98%", label: "Satisfaction Rate" },
    { value: "24hrs", label: "Avg Match Time" }
  ];

  const handlePlaceSelected = (city: string, state: string) => {
    setSelectedCity(city);
    setSelectedState(state);
    // Navigate to the join page with pre-filled data
    navigate(`/join/real-estate-agent?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`);
  };

  return (
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={owlDoorLogo} alt="OwlDoor" className="h-8 md:h-10" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {/* Navigation links hidden */}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeSelector />
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">Log In</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/match">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Embedded Search */}
      <section className="pt-32 pb-20 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Market Search Component */}
            <div className="bg-[#5fb596] rounded-3xl p-8 md:p-16 text-center space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                Check Your Market Availability
              </h1>
              
              {/* Search Bar */}
              <div className="relative max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6">
                <GooglePlacesAutocomplete
                  onPlaceSelected={handlePlaceSelected}
                  placeholder="Type in a City or County"
                  className="h-16 text-lg md:text-xl"
                />
              </div>

              {selectedCity && selectedState && (
                <div className="flex items-center justify-center gap-2 text-white pt-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="text-lg font-medium">{selectedCity}, {selectedState}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-12 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-8 h-8 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-2xl font-bold text-foreground">
              Rated #1 Real Estate Recruiting Platform
            </p>
            <p className="text-muted-foreground">
              Based on agent satisfaction ratings and successful matches
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg hover:-translate-y-2 transition-all duration-300">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold">Ready to Find Your Perfect Brokerage?</h2>
            <p className="text-xl text-primary-foreground/90">
              Join thousands of agents who've already found their ideal match
            </p>
            <div className="flex justify-center pt-4">
              <Button 
                asChild 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-12 py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                <Link to="/matching">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-foreground mb-4">OwlDoor</h3>
              <p className="text-sm text-muted-foreground">
                Connecting real estate professionals with their perfect brokerage match.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">For Agents</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/match" className="text-muted-foreground hover:text-primary">
                    Find a Brokerage
                  </Link>
                </li>
                <li>
                  <Link to="/for-agents" className="text-muted-foreground hover:text-primary">
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">For Brokerages</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/apply" className="text-muted-foreground hover:text-primary">
                    Join Network
                  </Link>
                </li>
                <li>
                  <Link to="/for-brokerages" className="text-muted-foreground hover:text-primary">
                    Why OwlDoor
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/story" className="text-muted-foreground hover:text-primary">
                    Our Story
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-muted-foreground hover:text-primary">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms-of-service" className="text-muted-foreground hover:text-primary">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2025 OwlDoor. All rights reserved.
          </div>
        </div>
      </footer>

        <BrokerageSearchModal open={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
      </div>
  );
};

export default FindBrokerage;
