import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Star, ArrowLeft, MapPin, ArrowRight, Target, Sparkles, Users } from "lucide-react";
import { motion } from "framer-motion";
import owlDoorLogo from "@/assets/owldoor-logo-light-green.png";
import usaMapNetwork from "@/assets/usa-map-network.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logSMSConsent, getUserIP } from "@/lib/smsConsent";
import { AnimatedAgentScroll } from "@/components/AnimatedAgentScroll";
import { Header } from "@/components/Header";
import { HomeSignUpForm } from "@/components/HomeSignUpForm";
import { MortgageMarketChecker } from "@/components/MortgageMarketChecker";
import { MortgageQuestionCards } from "@/components/MortgageQuestionCards";
import { LiveMortgageMatchingDemo } from "@/components/LiveMortgageMatchingDemo";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const MortgageMatching = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 10; // Increased from 8 to 10 to add 2 new steps
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Brokerage opportunities for animated feed
  const brokerageOpportunities = [
    {
      initials: "QL",
      name: "Quicken Loans",
      location: "Detroit, MI",
      status: "Hot!",
      match: 96,
      commission: "Top Pay"
    },
    {
      initials: "RM",
      name: "Rocket Mortgage",
      location: "Phoenix, AZ",
      status: "Hot!",
      match: 96,
      commission: "Great Benefits"
    },
    {
      initials: "UW",
      name: "United Wholesale",
      location: "Dallas, TX",
      status: "New!",
      match: 89,
      commission: "Competitive Pay"
    },
    {
      initials: "LB",
      name: "LoanDepot",
      location: "Austin, TX",
      status: "Hot!",
      match: 97,
      commission: "Full Support"
    },
    {
      initials: "FM",
      name: "Freedom Mortgage",
      location: "Portland, OR",
      status: "New!",
      match: 92,
      commission: "Lead Gen"
    },
    {
      initials: "GU",
      name: "Guaranteed Rate",
      location: "Denver, CO",
      status: "Warm",
      match: 88,
      commission: "Tech Platform"
    }
  ];

  const duplicatedBrokerages = [...brokerageOpportunities, ...brokerageOpportunities, ...brokerageOpportunities];

  // Specialization & Account Type (New)
  const [specialization, setSpecialization] = useState<"real_estate" | "mortgage" | "">("");
  const [accountType, setAccountType] = useState<"agent" | "team" | "loan_officer" | "company" | "">("");

  // Location
  const [workPreference, setWorkPreference] = useState<string>("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  // Wants & Needs
  const [teamOffers, setTeamOffers] = useState<string[]>([]);
  const [showOtherDialog, setShowOtherDialog] = useState(false);
  const [otherOffer, setOtherOffer] = useState("");
  const [seriousness, setSeriousness] = useState(0);

  // Experience
  const [yearStarted, setYearStarted] = useState("");
  const [totalLoans, setTotalLoans] = useState("");
  const [loans12Months, setLoans12Months] = useState("");

  // Contact
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);

  const filteredStates = US_STATES.filter(s => 
    s.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const [clickedOption, setClickedOption] = useState<string | null>(null);

  const handleSpecializationSelect = (value: "real_estate" | "mortgage") => {
    setClickedOption(value);
    setSpecialization(value);
    setTimeout(() => {
      setClickedOption(null);
      setCurrentStep(1);
    }, 600);
  };

  const handleWorkPreferenceSelect = (value: string) => {
    setClickedOption(value);
    if (value === "Hybrid") {
      setWorkPreference("Remote, Office");
    } else {
      setWorkPreference(value);
    }
    setTimeout(() => {
      setClickedOption(null);
      setCurrentStep(3); // Skip to step 3 (now location)
    }, 600);
  };

  const handleTeamOfferToggle = (offer: string) => {
    if (offer === "Other") {
      setShowOtherDialog(true);
      return;
    }
    setTeamOffers(prev => 
      prev.includes(offer) 
        ? prev.filter(o => o !== offer)
        : [...prev, offer]
    );
  };

  const handleOtherOfferSubmit = () => {
    if (otherOffer.trim()) {
      setTeamOffers(prev => [...prev, otherOffer]);
    }
    setShowOtherDialog(false);
    setOtherOffer("");
  };

  const calculateYearsExperience = () => {
    if (!yearStarted) return 0;
    const year = parseInt(yearStarted);
    if (isNaN(year)) return 0;
    return new Date().getFullYear() - year;
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!smsConsent) {
      toast.error("Please agree to receive SMS messages");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const yearsExp = calculateYearsExperience();
      const sourceUrl = window.location.href;
      
      // Determine pipeline stage based on qualification criteria
      const hasWantsNeeds = teamOffers.length > 0;
      const hasMotivation = seriousness > 0;
      const pipelineStage = (hasWantsNeeds && hasMotivation) ? 'qualified' : 'new';
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in to continue");
        navigate("/auth");
        return;
      }

      // Update existing agent record with matching data
      const { error: updateError } = await supabase
        .from('pros')
        .update({
          cities: city ? [city] : [],
          states: state ? [state] : [],
          wants: teamOffers,
          motivation: seriousness,
          years_experience: yearsExp,
          transactions: parseInt(totalLoans) || null,
          experience: yearsExp,
          pipeline_stage: pipelineStage,
          notes: `Work Preference: ${workPreference}${smsConsent ? '\nSMS Consent: Yes' : ''}`,
          matching_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Trigger auto-matching if qualified
      if (pipelineStage === 'qualified') {
        supabase.functions.invoke('auto-match-leads').then(({ data, error }) => {
          if (error) {
            console.error('Auto-match error:', error);
          } else {
            console.log('Auto-match triggered:', data);
          }
        });
      }

      toast.success("Profile updated! Redirecting to market coverage...");
      navigate('/market-coverage');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              What is your specialization?
            </h2>
            <div className="grid gap-3">
              {[
                { value: "real_estate" as const, label: "Real Estate" },
                { value: "mortgage" as const, label: "Mortgage" }
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={clickedOption === option.value ? "outline" : "default"}
                  size="lg"
                  className={`h-16 text-lg justify-between transition-all ${
                    clickedOption === option.value 
                      ? "bg-background text-foreground hover:bg-background/90" 
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                  onClick={() => handleSpecializationSelect(option.value)}
                >
                  <span>{option.label}</span>
                  {clickedOption === option.value && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </Button>
              ))}
            </div>
          </div>
        );

      case 1:
        const accountTypeOptions = specialization === "real_estate" 
          ? [
              { value: "agent" as const, label: "Real Estate Agent" },
              { value: "team" as const, label: "Team/Brokerage" }
            ]
          : [
              { value: "loan_officer" as const, label: "Loan Officer" },
              { value: "company" as const, label: "Company/Branch" }
            ];

        return (
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              What type of account?
            </h2>
            <div className="grid gap-3">
              {accountTypeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={accountType === option.value ? "outline" : "default"}
                  size="lg"
                  className={`h-16 text-lg justify-between transition-all ${
                    accountType === option.value 
                      ? "bg-background text-foreground hover:bg-background/90" 
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                  onClick={() => {
                    setAccountType(option.value);
                    setTimeout(() => setCurrentStep(2), 300);
                  }}
                >
                  <span>{option.label}</span>
                  {accountType === option.value && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </Button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Where do you prefer to work?
            </h2>
            <div className="grid gap-3">
              {["Remote", "Office", "Hybrid"].map((option) => (
                <Button
                  key={option}
                  variant={clickedOption === option ? "outline" : "default"}
                  size="lg"
                  className={`h-16 text-lg justify-between transition-all ${
                    clickedOption === option 
                      ? "bg-background text-foreground hover:bg-background/90" 
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                  onClick={() => handleWorkPreferenceSelect(option)}
                >
                  <span>{option}</span>
                  {clickedOption === option && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </Button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              What is your main market?
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && city && state && handleNext()}
                  placeholder="Enter city"
                  className="mt-2"
                />
              </div>
              <div className="relative">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={stateSearch || state}
                  onChange={(e) => {
                    setStateSearch(e.target.value);
                    setState("");
                    setShowStateDropdown(true);
                  }}
                  onFocus={() => setShowStateDropdown(true)}
                  onKeyDown={(e) => e.key === "Enter" && city && state && handleNext()}
                  placeholder="Start typing state name..."
                  className="mt-2"
                />
                {showStateDropdown && filteredStates.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredStates.map((stateName) => (
                      <button
                        key={stateName}
                        className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          setState(stateName);
                          setStateSearch(stateName);
                          setShowStateDropdown(false);
                          if (city) {
                            setTimeout(() => handleNext(), 300);
                          }
                        }}
                      >
                        {stateName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              What would you like your next Company to offer?
            </h2>
            <p className="text-muted-foreground">Select as many as you'd like</p>
            <div className="space-y-3">
              {["Leads/Referrals", "Training", "CRM/Tech", "High Commissions", "Marketing Support", "Administrative Support", "Other"].map((offer) => (
                <div key={offer} className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => handleTeamOfferToggle(offer)}>
                  <Checkbox
                    checked={teamOffers.includes(offer) || teamOffers.some(o => o.startsWith("Other:"))}
                    onCheckedChange={() => handleTeamOfferToggle(offer)}
                  />
                  <Label className="cursor-pointer flex-1">{offer}</Label>
                </div>
              ))}
            </div>
            <Button onClick={handleNext} size="lg" className="w-full md:w-auto" disabled={teamOffers.length === 0}>
              Continue
            </Button>
          </div>
        );

      case 5:
        const selectedOffers = teamOffers.join(", ");
        return (
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              If you were offered {selectedOffers} from a Company, how serious would you be about joining?
            </h2>
            <div className="flex gap-2 justify-center py-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <button
                  key={rating}
                  onClick={() => {
                    setSeriousness(rating);
                    setTimeout(() => setCurrentStep(4), 300);
                  }}
                  className="transition-all hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 md:w-10 md:h-10 ${
                      rating <= seriousness
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-muted-foreground">1 = Not serious, 10 = Very serious</p>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              What year did you start in {specialization === "mortgage" ? "mortgage" : "real estate"}?
            </h2>
            <Input
              type="number"
              value={yearStarted}
              onChange={(e) => setYearStarted(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && yearStarted && handleNext()}
              placeholder="YYYY"
              min="1900"
              max={new Date().getFullYear()}
              className="text-lg"
            />
            {yearStarted && (
              <p className="text-sm text-muted-foreground">
                Years of experience: {calculateYearsExperience()}
              </p>
            )}
            <Button onClick={handleNext} size="lg" className="w-full md:w-auto" disabled={!yearStarted}>
              Continue
            </Button>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              How many loans have you closed?
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="total">Total</Label>
                <Input
                  id="total"
                  type="number"
                  value={totalLoans}
                  onChange={(e) => setTotalLoans(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && totalLoans && loans12Months && handleNext()}
                  placeholder="0"
                  min="0"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="last12">Last 12 Months</Label>
                <Input
                  id="last12"
                  type="number"
                  value={loans12Months}
                  onChange={(e) => setLoans12Months(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && totalLoans && loans12Months && handleNext()}
                  placeholder="0"
                  min="0"
                  className="mt-2"
                />
              </div>
            </div>
            <Button onClick={handleNext} size="lg" className="w-full md:w-auto" disabled={!totalLoans || !loans12Months}>
              Continue
            </Button>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Confirm your contact info
            </h2>
            <p className="text-muted-foreground">Make sure we have the right information</p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="mt-2"
                />
              </div>
            </div>
            <Button onClick={handleNext} size="lg" className="w-full md:w-auto">
              Continue
            </Button>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Almost done!
            </h2>
            <p className="text-muted-foreground">Confirm your preferences and submit</p>
            <div className="flex items-start space-x-3 p-4 border border-border rounded-lg">
              <Checkbox
                id="smsConsent"
                checked={smsConsent}
                onCheckedChange={(checked) => setSmsConsent(checked as boolean)}
              />
              <Label htmlFor="smsConsent" className="text-sm leading-relaxed cursor-pointer">
                By providing your phone number and checking this box, you agree to receive SMS messages from OwlDoor regarding real estate agent matching services. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe or HELP for help. View our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>, <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>, and <Link to="/sms-terms" className="text-primary hover:underline">SMS Terms</Link>.
              </Label>
            </div>
            <Button 
              onClick={handleSubmit} 
              size="lg" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Complete Profile"}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Column - Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-4 w-full tracking-tight">
                Connecting <span className="text-primary md:text-black">Top</span> <span className="text-primary">Real Estate Pros</span>
              </h1>
              <p className="text-muted-foreground mb-8 leading-tight text-base sm:text-xl md:text-2xl lg:text-3xl font-normal w-full whitespace-nowrap overflow-hidden text-ellipsis">
                With Better Opportunities and Networks
              </p>
              
              {/* Inline Join Form */}
              <div className="rounded-2xl p-8 border-0 shadow-lg mb-8 bg-primary">
                <HomeSignUpForm />
              </div>

              {/* Video Section */}
              <div className="rounded-2xl overflow-hidden border shadow-lg bg-card">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src="https://player.vimeo.com/video/1132706705?h=0&badge=0&autopause=0&loop=1&player_id=0&app_id=58479"
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                    title="OwlDoor Video"
                  />
                </div>
              </div>
            </motion.div>

            {/* Right Column - Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Used by teams card */}
              <div className="bg-card rounded-2xl p-8 border shadow-lg">
                <div className="mb-6">
                  <img src={usaMapNetwork} alt="USA Network Map" className="w-full h-auto rounded-lg" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                  We Help Top Teams to Find Top Pros To Join
                </h3>
                <Link to="/teams">
                  <Button className="w-full rounded-lg bg-primary">
                    Hiring Real Estate Pros?
                  </Button>
                </Link>
              </div>

              {/* Agent and Mortgage Sign Up Cards */}
              <div className="space-y-6">
                {/* For Real Estate Agents */}
                <div className="bg-card rounded-2xl p-8 border shadow-lg relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}
                  ></div>
                  <div className="relative z-10">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Star className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-3xl font-bold text-foreground">For Real Estate Agents</h3>
                    </div>
                    <p className="text-lg mb-6 font-medium text-muted-foreground">
                      Explore Your Options. Our Average Agent Finds a Better Team
                    </p>
                    <Link to="/for-agents">
                      <Button size="lg" className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                        Learn More
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* For Loan Officers */}
                <div className="bg-card rounded-2xl p-8 border shadow-lg relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}
                  ></div>
                  <div className="relative z-10">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-3xl font-bold text-foreground">For Loan Officers</h3>
                    </div>
                    <p className="text-lg mb-6 font-medium text-muted-foreground">
                      Find a Better Branch That Provides What You Are Worth
                    </p>
                    <Link to="/for-mortgage">
                      <Button size="lg" className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mortgage Market Checker Section */}
      <MortgageMarketChecker />

      {/* Question Cards Animation */}
      <MortgageQuestionCards />

      {/* Live Matching Demo */}
      <LiveMortgageMatchingDemo />

      {/* CTA Cards Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        {/* Dotted Background */}
        <div
          className="absolute inset-0 opacity-100"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(53, 168, 126, 0.27) 3px, transparent 3px)',
            backgroundSize: '20px 20px'
          }}
        ></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Join Referral Network Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-8 border shadow-lg"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-3xl font-bold mb-3 text-foreground">Join Referral Network</h3>
              <p className="text-lg text-muted-foreground mb-6">For Real Estate Agents and Lenders</p>
              <Link to="/join">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                  Explore Opportunities <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </motion.div>

            {/* For Brokerages Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-8 border shadow-lg"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-3xl font-bold mb-3 text-foreground">For Brokerages</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Recruit top-performing agents who fit your culture and vision.
              </p>
              <Link to="/apply">
                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-lg">
                  Find Top Talent <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-primary">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="font-bold text-stone-50 text-5xl">Common questions</h2>
            <Button variant="link" className="text-primary">
              Visit our Help Center <ArrowRight className="ml-2" />
            </Button>
          </div>
          <div className="space-y-4">
            {[
              {
                question: "How does OwlDoor verify professionals?",
                answer: "We conduct thorough background checks, license verification, and reference validation for all registered professionals."
              },
              {
                question: "What markets do you cover?",
                answer: "OwlDoor operates across all 50 states with a network of over 2,800 verified agents and 150+ brokerages."
              },
              {
                question: "What Does OwlDoor for Real Estate Pros?",
                answer: "We help connect Agents and Loan Officers with Top Teams willing to offer them more compensation and/or resources like leads, tech, etc. We also connect Agents with Referral Networks including our own that provides Thousands of Connections."
              },
              {
                question: "Is It Also Free For Brokerages, Teams and Companies?",
                answer: "We offer both Free and Paid options. You choose what suits you best. Paid platform is invite only or on an approval basis as we only accept the best of the best to keep our platform's integrity."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card rounded-xl border overflow-hidden"
              >
                <div className="px-6 py-4 text-left">
                  <div className="font-semibold flex items-center gap-3 mb-2">
                    <span className="text-muted-foreground">{index + 1}.</span>
                    {faq.question}
                  </div>
                  <div className="px-6 text-muted-foreground">{faq.answer}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <div id="start-form" className="container mx-auto py-8 max-w-4xl px-0 md:px-4">
        <div className="mb-8 text-center px-4 md:px-0">
          <Link to="/">
            <img src={owlDoorLogo} alt="OwlDoor" className="h-12 mx-auto mb-4" />
          </Link>
        </div>

        <Card className="p-6 md:p-8 mx-0 md:mx-auto rounded-none md:rounded-lg">
          <div className="mb-8">
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              Step {currentStep + 1} of {totalSteps}
            </p>
          </div>

          {renderQuestion()}

          {currentStep > 0 && currentStep < totalSteps - 1 && (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mt-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
        </Card>

        <Dialog open={showOtherDialog} onOpenChange={setShowOtherDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>What else are you looking for?</DialogTitle>
            </DialogHeader>
            <Input
              value={otherOffer}
              onChange={(e) => setOtherOffer(e.target.value)}
              placeholder="Type your answer..."
              onKeyDown={(e) => e.key === "Enter" && handleOtherOfferSubmit()}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowOtherDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleOtherOfferSubmit}>Add</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MortgageMatching;
