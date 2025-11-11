import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import heroGradientBg from "@/assets/hero-gradient-bg.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  MapPin, 
  Eye,
  MessageSquare,
  CheckCircle,
  Filter
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as fasStar, faTrophy, faMoneyBillWave, faGem, faHome, faChartLine, faHandshake, faCalendarAlt } from "@fortawesome/free-solid-svg-icons";
import { faStar as farStar } from "@fortawesome/free-regular-svg-icons";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SPECIALTIES = [
  "Luxury Properties",
  "First-time Buyers",
  "Tech Industry Relocations",
  "Investment Properties",
  "Waterfront Homes",
  "International Buyers",
  "New Construction",
  "Single-Family Homes",
  "Celebrity Homes",
  "Modern Architecture",
  "Condos & Lofts",
  "Rent-to-Own",
  "Mountain Properties",
  "Vacation Homes",
  "Military Relocation",
  "Bilingual (Spanish)"
];

const QUICK_FILTERS = [
  { label: "Top Rated", value: "top_rated", icon: faTrophy },
  { label: "High Volume", value: "high_volume", icon: faMoneyBillWave },
  { label: "Luxury Specialists", value: "luxury", icon: faGem },
  { label: "First-Time Buyers", value: "first_time", icon: faHome },
  { label: "Investment Props", value: "investment", icon: faChartLine },
  { label: "25%+ Referral", value: "high_referral", icon: faHandshake }
];

export default function AgentDirectory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pros, setPros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [zipSearch, setZipSearch] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [resultsLimit] = useState(12); // Max 12 agents at a time

  useEffect(() => {
    checkUser();
    // Just show dummy agents on initial load
    setLoading(false);
    showDummyAgents();
  }, []);

  const showDummyAgents = () => {
    const dummyAgents = [
      {
        id: 'dummy-1',
        full_name: '████ ██████',
        email: '████@████.com',
        phone: '(███) ███-████',
        cities: ['San Diego'],
        states: ['CA'],
        zip_codes: ['92101'],
        company: '████████ Realty',
        experience: 8,
        transactions: 45,
        profile_views: 234,
        specializations: ['Luxury Properties', 'First-time Buyers'],
        bio: 'Experienced real estate professional serving the San Diego market...',
        image_url: null,
        isBlurred: true
      },
      {
        id: 'dummy-2',
        full_name: '████ ████████',
        email: '████@████.com',
        phone: '(███) ███-████',
        cities: ['San Diego'],
        states: ['CA'],
        zip_codes: ['92101'],
        company: '██████ Group',
        experience: 12,
        transactions: 78,
        profile_views: 456,
        specializations: ['Investment Properties', 'New Construction'],
        bio: 'Top-producing agent with a proven track record...',
        image_url: null,
        isBlurred: true
      },
      {
        id: 'dummy-3',
        full_name: '████████ ██████',
        email: '████@████.com',
        phone: '(███) ███-████',
        cities: ['San Diego'],
        states: ['CA'],
        zip_codes: ['92101'],
        company: '████████ Team',
        experience: 15,
        transactions: 120,
        profile_views: 789,
        specializations: ['Luxury Properties', 'Waterfront Homes'],
        bio: 'Award-winning luxury specialist in San Diego...',
        image_url: null,
        isBlurred: true
      },
      {
        id: 'dummy-4',
        full_name: '████ ████',
        email: '████@████.com',
        phone: '(███) ███-████',
        cities: ['San Diego'],
        states: ['CA'],
        zip_codes: ['92101'],
        company: '████████',
        experience: 6,
        transactions: 32,
        profile_views: 198,
        specializations: ['First-time Buyers', 'Condos & Lofts'],
        bio: 'Dedicated to helping first-time buyers find their dream home...',
        image_url: null,
        isBlurred: true
      },
      {
        id: 'dummy-5',
        full_name: '██████ ████████',
        email: '████@████.com',
        phone: '(███) ███-████',
        cities: ['San Diego'],
        states: ['CA'],
        zip_codes: ['92101'],
        company: '████ Realty',
        experience: 10,
        transactions: 67,
        profile_views: 345,
        specializations: ['New Construction', 'Single-Family Homes'],
        bio: 'Specializing in new construction and move-in ready homes...',
        image_url: null,
        isBlurred: true
      },
      {
        id: 'dummy-6',
        full_name: '████████ ████',
        email: '████@████.com',
        phone: '(███) ███-████',
        cities: ['San Diego'],
        states: ['CA'],
        zip_codes: ['92101'],
        company: '██████ Properties',
        experience: 14,
        transactions: 95,
        profile_views: 567,
        specializations: ['Investment Properties', 'Rent-to-Own'],
        bio: 'Investment property expert with extensive market knowledge...',
        image_url: null,
        isBlurred: true
      },
      {
        id: 'dummy-7',
        full_name: '████ ██████████',
        email: '████@████.com',
        phone: '(███) ███-████',
        cities: ['San Diego'],
        states: ['CA'],
        zip_codes: ['92101'],
        company: '████████ Group',
        experience: 9,
        transactions: 54,
        profile_views: 287,
        specializations: ['Tech Industry Relocations', 'Modern Architecture'],
        bio: 'Helping tech professionals relocate and find modern homes...',
        image_url: null,
        isBlurred: true
      },
      {
        id: 'dummy-8',
        full_name: '██████ ████',
        email: '████@████.com',
        phone: '(███) ███-████',
        cities: ['San Diego'],
        states: ['CA'],
        zip_codes: ['92101'],
        company: '████████',
        experience: 11,
        transactions: 72,
        profile_views: 412,
        specializations: ['Bilingual (Spanish)', 'Military Relocation'],
        bio: 'Bilingual agent specializing in military relocations...',
        image_url: null,
        isBlurred: true
      }
    ];
    setPros(dummyAgents);
  };

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchPros = async (zipCode: string) => {
    try {
      setLoading(true);
      const query = supabase
        .from("pros")
        .select("id, first_name, last_name, full_name, email, phone, image_url, bio, cities, states, company, brokerage, pro_type, experience, transactions, stats, specializations, certifications, profile_views, zip_codes")
        .overlaps("zip_codes", [zipCode.trim()])
        .order("created_at", { ascending: false })
        .limit(resultsLimit);
      
      // @ts-ignore - Supabase type inference issue
      const result = await query;

      if (result.error) {
        console.error("Error fetching pros:", result.error);
        toast({
          title: "Error",
          description: "Failed to load professionals. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const realAgents = result.data || [];
      console.log("Fetched pros:", result.data);
      setPros(realAgents);
    } catch (error) {
      console.error("Error fetching pros:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPros = pros;

  const handleZipSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (zipSearch.trim()) {
      setHasSearched(true);
      fetchPros(zipSearch);
    }
  };

  const clearSearch = () => {
    setZipSearch("");
    setHasSearched(false);
    showDummyAgents();
  };

  const getInitials = (name: string) => {
    return name?.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2) || "??";
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "$0";
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(0)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <FontAwesomeIcon
            key={i}
            icon={i < fullStars ? fasStar : farStar}
            className={`w-3.5 h-3.5 ${
              i < fullStars
                ? "text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-lg border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <img src="/owldoor-icon.svg" alt="OwlDoor" className="h-12 w-12" />
              <span className="text-2xl font-extrabold">OwlDoor</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate("/login")}>
                Sign In
              </Button>
              <Button onClick={() => navigate("/join-real-estate-agent")}>
                Join as Agent
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div 
        className="py-16 border-b bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroGradientBg})` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-extrabold mb-4 text-white">
            Find Your Perfect<br />Referral Partner
          </h1>
          <p className="text-xl text-white max-w-2xl mx-auto mb-8">
            Connect with top-rated real estate agents nationwide. Get matched based on
            expertise, location, and referral fees.
          </p>

          {/* Zip Code Search Bar */}
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleZipSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by ZIP code to see more agents..."
                value={zipSearch}
                onChange={(e) => setZipSearch(e.target.value)}
                className="pl-12 pr-24 h-14 text-lg"
                maxLength={5}
                pattern="[0-9]*"
              />
              {hasSearched && zipSearch && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  Clear
                </Button>
              )}
            </form>
            {hasSearched && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                Showing results for ZIP code: <strong>{zipSearch}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Results Section */}
          <div className="max-w-7xl mx-auto">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6 pb-5 border-b-2">
              <div className="text-sm text-muted-foreground">
                <span className="text-3xl font-extrabold text-foreground">{filteredPros.length}</span> agents {hasSearched ? `in ZIP ${zipSearch}` : 'available'}
              </div>
              {!hasSearched && (
                <div className="text-sm text-muted-foreground">
                  Search by ZIP code to see all agents in your area
                </div>
              )}
            </div>

            {/* Agent Cards */}
            <div className="space-y-5">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading agents...</p>
                </div>
                ) : filteredPros.length === 0 ? (
                  <Card className="shadow-sm">
                    <CardContent className="p-12 text-center">
                      <p className="text-muted-foreground mb-4">No agents found in this ZIP code</p>
                      <Button 
                        variant="outline" 
                        onClick={clearSearch}
                      >
                        Clear Search
                      </Button>
                    </CardContent>
                  </Card>
              ) : (
                filteredPros.map((pro, index) => {
                  const cities = Array.isArray(pro.cities) ? pro.cities : [];
                  const states = Array.isArray(pro.states) ? pro.states : [];
                  const specializations = Array.isArray(pro.specializations) ? pro.specializations : [];
                  const avgRating = 0; // Default rating for now
                  const reviewCount = 0; // Default review count
                  const isBlurred = pro.isBlurred === true;
                  
                  return (
                    <Card 
                      key={pro.id} 
                      className="hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden border-2 hover:border-primary/30"
                      onClick={() => isBlurred ? navigate("/join-real-estate-agent") : (user ? navigate(`/public-agent-profile/${pro.id}`) : navigate("/join-real-estate-agent"))}
                    >
                      {isBlurred && (
                        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-20 flex items-center justify-center">
                          <div className="text-center p-8 max-w-md">
                            <div className="text-5xl mb-4">🔒</div>
                            <h3 className="text-2xl font-bold mb-3">Sign Up Free to Unlock</h3>
                            <p className="text-muted-foreground mb-5">View full agent profiles, contact information, and connect with top-rated professionals</p>
                            <Button size="lg" className="gap-2">
                              <CheckCircle className="w-5 h-5" />
                              Join Free Now
                            </Button>
                          </div>
                        </div>
                      )}
                      {index < 3 && (
                        <div className="absolute top-4 right-4 z-10">
                          <Badge 
                            className={`text-sm px-4 py-1.5 font-bold shadow-lg gap-1.5 ${
                              index === 0 
                                ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900" 
                                : index === 1 
                                ? "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900"
                                : "bg-gradient-to-r from-orange-400 to-orange-500 text-orange-900"
                            }`}
                          >
                            <FontAwesomeIcon icon={faTrophy} className="w-3.5 h-3.5" />
                            #{index + 1} Top Match
                          </Badge>
                        </div>
                      )}
                      
                      <CardContent className={`p-0 ${isBlurred ? 'filter blur-[3px]' : ''}`}>
                        {/* Card Header */}
                        <div className="p-7 pb-5">
                          <div className="flex gap-5">
                            <Avatar className="h-20 w-20 flex-shrink-0 border-4 border-primary/20 shadow-lg">
                              <AvatarImage src={pro.image_url} alt={pro.full_name} />
                              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                                {getInitials(pro.full_name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <h3 className="text-2xl font-bold mb-1 truncate">{pro.full_name}</h3>
                              <p className="text-muted-foreground mb-2">{pro.company || "Independent Agent"}</p>
                              
                              <div className="flex items-center gap-3 mb-2">
                                {renderStars(avgRating)}
                                <span className="font-bold text-base">{avgRating.toFixed(1)}</span>
                                <span className="text-sm text-muted-foreground">({reviewCount} reviews)</span>
                              </div>
                              
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified Pro
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-1 px-7 py-4 bg-muted/30 border-y">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Referral</div>
                            <div className="text-2xl font-extrabold text-primary">25%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Experience</div>
                            <div className="text-2xl font-extrabold text-primary">{pro.experience || 0}y</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Deals</div>
                            <div className="text-2xl font-extrabold text-primary">{pro.transactions || 0}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Volume</div>
                            <div className="text-2xl font-extrabold text-primary">
                              {formatCurrency(pro.stats?.avg_sale_price || 45000000)}
                            </div>
                          </div>
                        </div>

                        <div className="p-7">
                          {/* Service Areas */}
                          {cities.length > 0 && (
                            <div className="mb-5">
                              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                                📍 Service Areas
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {cities.slice(0, 4).map((city: string, idx: number) => (
                                  <Badge 
                                    key={idx} 
                                    className="bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 font-semibold px-3 py-1.5"
                                  >
                                    {city}{states[idx] ? `, ${states[idx]}` : ""}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Specialties */}
                          {specializations.length > 0 && (
                            <div className="mb-5">
                              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                                💎 Specialties
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {specializations.slice(0, 3).map((spec: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="font-medium px-3 py-1.5">
                                    {spec}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Bio */}
                          {pro.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-5 leading-relaxed">
                              {pro.bio}
                            </p>
                          )}

                          {/* Actions */}
                          <div className="flex gap-3">
                            <Button 
                              className="flex-1 h-12 font-bold shadow-lg bg-gradient-to-r from-primary to-primary/90"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/agent/${pro.id}`);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </Button>
                            <Button 
                              variant="outline"
                              className="flex-1 h-12 font-bold border-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle contact
                              }}
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Contact
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
