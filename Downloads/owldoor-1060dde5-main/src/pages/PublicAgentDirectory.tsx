import heroGradientBg from "@/assets/hero-gradient-bg.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  MapPin, 
  TrendingUp,
  Briefcase,
  DollarSign,
  BarChart3
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as fasStar, faTrophy, faMoneyBillWave, faGem, faHome, faChartLine, faHandshake } from "@fortawesome/free-solid-svg-icons";
import { faStar as farStar } from "@fortawesome/free-regular-svg-icons";
import { useNavigate } from "react-router-dom";

const QUICK_FILTERS = [
  { label: "Top Rated", value: "top_rated", icon: faTrophy },
  { label: "High Volume", value: "high_volume", icon: faMoneyBillWave },
  { label: "Luxury Specialists", value: "luxury", icon: faGem },
  { label: "First-Time Buyers", value: "first_time", icon: faHome },
  { label: "Investment Props", value: "investment", icon: faChartLine },
  { label: "25%+ Referral", value: "high_referral", icon: faHandshake }
];

const SPECIALTIES = [
  { value: "luxury", label: "Luxury Properties" },
  { value: "first_time", label: "First-time Buyers" },
  { value: "tech", label: "Tech Industry Relocations" },
  { value: "investment", label: "Investment Properties" },
  { value: "waterfront", label: "Waterfront Homes" }
];

const DUMMY_AGENTS = [
  {
    id: 'dummy-1',
    referral_fee: 25,
    experience: 16,
    deals: 120,
    volume: 45,
    rating: 4.8,
    cities: ['New York, NY', 'Brooklyn, NY'],
    specializations: ['Luxury Properties', 'First-time Buyers'],
  },
  {
    id: 'dummy-2',
    referral_fee: 30,
    experience: 10,
    deals: 85,
    volume: 45,
    rating: 4.6,
    cities: ['San Francisco, CA'],
    specializations: ['Tech Industry Relocations', 'Investment Properties'],
  },
  {
    id: 'dummy-3',
    referral_fee: 25,
    experience: 11,
    deals: 60,
    volume: 45,
    rating: 4.9,
    cities: ['Miami, FL', 'Fort Lauderdale, FL'],
    specializations: ['Waterfront Homes', 'International Buyers'],
  },
  {
    id: 'dummy-4',
    referral_fee: 35,
    experience: 7,
    deals: 40,
    volume: 45,
    rating: 4.8,
    cities: ['Los Angeles, CA'],
    specializations: ['Celebrity Homes', 'Modern Architecture'],
  },
  {
    id: 'dummy-5',
    referral_fee: 25,
    experience: 12,
    deals: 95,
    volume: 50,
    rating: 4.7,
    cities: ['San Diego, CA'],
    specializations: ['Investment Properties', 'First-time Buyers'],
  },
  {
    id: 'dummy-6',
    referral_fee: 30,
    experience: 8,
    deals: 55,
    volume: 38,
    rating: 4.9,
    cities: ['Austin, TX'],
    specializations: ['Tech Industry Relocations', 'New Construction'],
  },
  {
    id: 'dummy-7',
    referral_fee: 28,
    experience: 15,
    deals: 110,
    volume: 52,
    rating: 4.8,
    cities: ['Seattle, WA'],
    specializations: ['Luxury Properties', 'Waterfront Homes'],
  }
];

export default function PublicAgentDirectory() {
  const navigate = useNavigate();

  const renderStars = (rating: number = 4.8) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FontAwesomeIcon
          key={i}
          icon={i < fullStars ? fasStar : farStar}
          className="text-yellow-400"
          size="sm"
        />
      );
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div 
        className="relative w-full bg-cover bg-center py-16"
        style={{ backgroundImage: `url(${heroGradientBg})` }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Find Your Perfect Referral Partner
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Connect with top-rated real estate agents nationwide. Get matched based on expertise, location, and referral fees.
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-border">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, city, state, or zip..."
                    value=""
                    disabled
                    className="pl-10 bg-muted/50 cursor-not-allowed"
                  />
                </div>
              </div>
              <Button disabled className="md:w-auto cursor-not-allowed opacity-50 bg-primary text-primary-foreground">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {QUICK_FILTERS.map((filter) => (
                  <Button
                    key={filter.value}
                    variant="outline"
                    size="sm"
                    disabled
                    className="justify-start cursor-not-allowed opacity-50"
                  >
                    <FontAwesomeIcon icon={filter.icon} className="mr-2 h-3 w-3" />
                    <span className="text-xs truncate">{filter.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4 space-y-6">
              {/* Referral Fee */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Referral Fee</h3>
                <div className="mb-4">
                  <div className="text-2xl font-bold text-primary">25%</div>
                  <div className="text-sm text-muted-foreground">Minimum</div>
                </div>
                <Slider
                  disabled
                  value={[25]}
                  min={0}
                  max={50}
                  step={5}
                  className="opacity-50 cursor-not-allowed"
                />
              </div>

              {/* Rating */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Rating</h3>
                <div className="mb-4">
                  <div className="text-2xl font-bold text-primary">3.8</div>
                  <div className="text-sm text-muted-foreground">Minimum</div>
                </div>
                <Slider
                  disabled
                  value={[3.8]}
                  min={0}
                  max={5}
                  step={0.1}
                  className="opacity-50 cursor-not-allowed"
                />
              </div>

              {/* Experience */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Experience</h3>
                <div className="mb-4">
                  <div className="text-2xl font-bold text-primary">6+</div>
                  <div className="text-sm text-muted-foreground">Minimum Years</div>
                </div>
                <Slider
                  disabled
                  value={[6]}
                  min={0}
                  max={20}
                  step={1}
                  className="opacity-50 cursor-not-allowed"
                />
              </div>

              {/* Specialties */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Specialties</h3>
                <div className="space-y-2">
                  {SPECIALTIES.map((specialty) => (
                    <div key={specialty.value} className="flex items-center space-x-2 opacity-50">
                      <Checkbox id={specialty.value} disabled />
                      <Label htmlFor={specialty.value} className="text-sm cursor-not-allowed">
                        {specialty.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{DUMMY_AGENTS.length} agents found</h2>
              <div className="text-sm text-muted-foreground">
                Sort by: <span className="font-semibold">Recommended</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {DUMMY_AGENTS.map((agent, index) => (
                <Card key={agent.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                  {index < 2 && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge variant="default" className="bg-yellow-500 text-white">
                        #{index + 1} Top Match
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      {/* Hidden/Blurred Avatar */}
                      <div className="h-20 w-20 rounded-full bg-primary/20 blur-[2px]" />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {renderStars(agent.rating)}
                          <span className="text-sm font-semibold">{agent.rating}</span>
                          <span className="text-sm text-muted-foreground">(50 reviews)</span>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                          Verified Pro
                        </Badge>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="text-center p-3 bg-muted/50 rounded">
                        <div className="text-xs text-muted-foreground mb-1">REFERRAL</div>
                        <div className="font-bold text-primary">{agent.referral_fee}%</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded">
                        <div className="text-xs text-muted-foreground mb-1">EXPERIENCE</div>
                        <div className="font-bold">{agent.experience}y</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded">
                        <div className="text-xs text-muted-foreground mb-1">DEALS</div>
                        <div className="font-bold">{agent.deals}</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded">
                        <div className="text-xs text-muted-foreground mb-1">VOLUME</div>
                        <div className="font-bold">${agent.volume}M</div>
                      </div>
                    </div>

                    {/* Service Areas */}
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-muted-foreground mb-2">SERVICE AREAS</div>
                      <div className="flex flex-wrap gap-2">
                        {agent.cities.map((city, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {city}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Specialties */}
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-muted-foreground mb-2">SPECIALTIES</div>
                      <div className="flex flex-wrap gap-2">
                        {agent.specializations.slice(0, 2).map((spec, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Blurred Bio */}
                    <div className="mb-4 p-3 bg-muted/30 rounded blur-[2px]">
                      <p className="text-sm">
                        Top-producing agent with 10+ years of experience in the NYC luxury market. Dedicated to providing exceptional service...
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => navigate("/join")}
                      >
                        JOIN FREE TO UNLOCK
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => navigate("/join")}
                      >
                        Contact
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
