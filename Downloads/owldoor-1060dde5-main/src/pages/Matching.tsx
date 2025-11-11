import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useState } from "react";
import { Star, ArrowLeft } from "lucide-react";
import owlDoorLogo from "@/assets/owldoor-logo-light-green.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const Matching = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 11; // Updated from 10 to 11
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Pro Type Selection (NEW)
  const [proType, setProType] = useState<'real_estate_agent' | 'mortgage_officer' | ''>('');

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

  // Experience - Real Estate Agent
  const [yearLicensed, setYearLicensed] = useState("");
  const [totalTransactions, setTotalTransactions] = useState("");
  const [transactions12Months, setTransactions12Months] = useState("");

  // Experience - Mortgage Officer (NEW)
  const [nmlsId, setNmlsId] = useState("");
  const [purchasePercentage, setPurchasePercentage] = useState("");
  const [avgCloseTimeDays, setAvgCloseTimeDays] = useState("");
  const [annualLoanVolume, setAnnualLoanVolume] = useState("");
  const [loanTypesSpecialized, setLoanTypesSpecialized] = useState<string[]>([]);

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

  const handleWorkPreferenceSelect = (value: string) => {
    setClickedOption(value);
    if (value === "Hybrid") {
      setWorkPreference("Remote, Office");
    } else {
      setWorkPreference(value);
    }
    setTimeout(() => {
      setClickedOption(null);
      setCurrentStep(2); // Updated from 1 to 2
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

  const getStepCategory = (step: number) => {
    if (step === 0) return 0; // Pro Type
    if (step <= 2) return 1; // Location
    if (step <= 4) return 2; // Wants & Needs
    if (step <= 6) return 3; // Experience
    return 4; // Matching
  };

  const categories = ["Pro Type", "Location", "Wants & Needs", "Experience", "Matching"];

  const getCompletionTime = () => {
    const baseTime = 90;
    const timePerStep = 9;
    const remaining = Math.max(baseTime - (currentStep * timePerStep), 10);
    return `${remaining}-${remaining + 30}`;
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

  const calculateYearsExperience = () => {
    if (!yearLicensed) return 0;
    const year = parseInt(yearLicensed);
    if (isNaN(year)) return 0;
    return new Date().getFullYear() - year;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const yearsExp = calculateYearsExperience();
      const sourceUrl = window.location.href;
      
      // Determine pipeline stage based on qualification criteria
      const hasWantsNeeds = teamOffers.length > 0;
      const hasMotivation = seriousness > 0;
      const pipelineStage = (hasWantsNeeds && hasMotivation) ? 'qualified' : 'new';
      
      console.log('Pipeline stage determined:', pipelineStage);
      
      // Build base lead data
      const baseLeadData: any = {
        pro_type: proType,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        email: email,
        phone: phone,
        cities: city ? [city] : [],
        states: state ? [state] : [],
        wants: teamOffers,
        motivation: seriousness,
        status: 'new',
        pipeline_type: 'staff',
        pipeline_stage: pipelineStage,
        source: sourceUrl,
        lead_source: 'website_form',
        form_submission_count: 1,
        last_form_submission_at: new Date().toISOString(),
        open_to_company_offers: seriousness > 5,
        interested_in_opportunities: seriousness > 0,
        notes: `Work Preference: ${workPreference}${smsConsent ? '\nSMS Consent: Yes' : ''}`
      };

      // Add pro-type specific fields
      if (proType === 'real_estate_agent') {
        baseLeadData.years_experience = yearsExp;
        baseLeadData.experience = yearsExp;
        baseLeadData.transactions = parseInt(totalTransactions) || null;
        baseLeadData.transactions_12mo = parseInt(transactions12Months) || null;
      } else if (proType === 'mortgage_officer') {
        baseLeadData.nmls_id = nmlsId || null;
        baseLeadData.purchase_percentage = parseInt(purchasePercentage) || null;
        baseLeadData.refinance_percentage = purchasePercentage ? (100 - parseInt(purchasePercentage)) : null;
        baseLeadData.avg_close_time_days = parseInt(avgCloseTimeDays) || null;
        baseLeadData.annual_loan_volume = parseFloat(annualLoanVolume) || null;
        baseLeadData.loan_types_specialized = loanTypesSpecialized.length > 0 ? loanTypesSpecialized : null;
      }

      const { data: insertedLead, error } = await supabase
        .from('pros')
        .insert([baseLeadData])
        .select()
        .single();

      if (error) throw error;

      console.log('Lead inserted successfully:', insertedLead);

      // Trigger auto-matching if lead is qualified
      if (pipelineStage === 'qualified') {
        console.log('Triggering auto-match for qualified lead');
        supabase.functions.invoke('auto-match-leads').then(({ data, error }) => {
          if (error) {
            console.error('Auto-match error:', error);
          } else {
            console.log('Auto-match triggered:', data);
          }
        });
      }

      toast.success("Thank you! We'll match you with opportunities soon.");
      navigate('/');
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
              Are you a Real Estate Agent or Mortgage Officer?
            </h2>
            <div className="grid gap-3">
              {[
                { value: 'real_estate_agent', label: 'Real Estate Agent' },
                { value: 'mortgage_officer', label: 'Mortgage Officer / Loan Officer' }
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={proType === option.value ? "outline" : "default"}
                  size="lg"
                  className={`h-16 text-lg justify-between transition-all ${
                    proType === option.value
                      ? "bg-background text-foreground hover:bg-background/90" 
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                  onClick={() => {
                    setProType(option.value as any);
                    setTimeout(() => setCurrentStep(1), 300);
                  }}
                >
                  <span>{option.label}</span>
                  {proType === option.value && (
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

      case 2:
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

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              What would you like your next {proType === 'mortgage_officer' ? 'Company' : 'Team'} to offer?
            </h2>
            <p className="text-muted-foreground">Select as many as you'd like</p>
            <div className="space-y-3">
              {["Leads/Referrals", "Coaching", "CRM/Tech", "High Splits", "Marketing", "Assistants", "Other"].map((offer) => (
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

      case 4:
        const selectedOffers = teamOffers.join(", ");
        return (
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              If you were offered {selectedOffers} from a {proType === 'mortgage_officer' ? 'Lender' : 'Brokerage'}, how serious would you be about joining?
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

      case 5:
        // Branch based on pro_type
        if (proType === 'real_estate_agent') {
          return (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                What year were you licensed?
              </h2>
              <Input
                type="number"
                value={yearLicensed}
                onChange={(e) => setYearLicensed(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && yearLicensed && handleNext()}
                placeholder="YYYY"
                min="1900"
                max={new Date().getFullYear()}
                className="text-lg"
              />
              {yearLicensed && (
                <p className="text-sm text-muted-foreground">
                  Years of experience: {calculateYearsExperience()}
                </p>
              )}
              <Button onClick={handleNext} size="lg" className="w-full md:w-auto" disabled={!yearLicensed}>
                Continue
              </Button>
            </div>
          );
        } else {
          // Mortgage Officer
          return (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                What's your NMLS ID?
              </h2>
              <Input
                type="text"
                value={nmlsId}
                onChange={(e) => setNmlsId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && nmlsId && handleNext()}
                placeholder="123456"
                className="text-lg"
              />
              <p className="text-sm text-muted-foreground">
                Your NMLS ID helps us verify your license
              </p>
              <Button onClick={handleNext} size="lg" className="w-full md:w-auto" disabled={!nmlsId}>
                Continue
              </Button>
            </div>
          );
        }

      case 6:
        // Branch based on pro_type
        if (proType === 'real_estate_agent') {
          return (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                How many transactions have you completed?
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="total">Total</Label>
                  <Input
                    id="total"
                    type="number"
                    value={totalTransactions}
                    onChange={(e) => setTotalTransactions(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && totalTransactions && transactions12Months && handleNext()}
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
                    value={transactions12Months}
                    onChange={(e) => setTransactions12Months(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && totalTransactions && transactions12Months && handleNext()}
                    placeholder="0"
                    min="0"
                    className="mt-2"
                  />
                </div>
              </div>
              <Button onClick={handleNext} size="lg" className="w-full md:w-auto" disabled={!totalTransactions || !transactions12Months}>
                Continue
              </Button>
            </div>
          );
        } else {
          // Mortgage Officer
          return (
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                What percentage of your business is purchase loans?
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="purchase">Purchase Percentage (%)</Label>
                  <Input
                    id="purchase"
                    type="number"
                    value={purchasePercentage}
                    onChange={(e) => setPurchasePercentage(e.target.value)}
                    placeholder="0-100"
                    min="0"
                    max="100"
                    className="mt-2 text-lg"
                  />
                  {purchasePercentage && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Refinance: {100 - parseInt(purchasePercentage)}%
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="closetime">Average Close Time (days)</Label>
                  <Input
                    id="closetime"
                    type="number"
                    value={avgCloseTimeDays}
                    onChange={(e) => setAvgCloseTimeDays(e.target.value)}
                    placeholder="e.g. 21"
                    min="0"
                    className="mt-2"
                  />
                </div>
              </div>
              <Button onClick={handleNext} size="lg" className="w-full md:w-auto" disabled={!purchasePercentage || !avgCloseTimeDays}>
                Continue
              </Button>
            </div>
          );
        }

      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              What's your name?
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && firstName && lastName && handleNext()}
                  placeholder="First name"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && firstName && lastName && handleNext()}
                  placeholder="Last name"
                  className="mt-2"
                />
              </div>
            </div>
            <Button onClick={handleNext} size="lg" className="w-full md:w-auto" disabled={!firstName || !lastName}>
              Continue
            </Button>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              What's your email address?
            </h2>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && email && handleNext()}
              placeholder="name@example.com"
              className="text-lg"
            />
            <Button onClick={handleNext} size="lg" className="w-full md:w-auto" disabled={!email}>
              Continue
            </Button>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              What's your phone number?
            </h2>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && phone && handleNext()}
              placeholder="(555) 123-4567"
              className="text-lg"
            />
            <Button onClick={handleNext} size="lg" className="w-full md:w-auto" disabled={!phone}>
              Continue
            </Button>
          </div>
        );

      case 10:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              One last thing...
            </h2>
            <div className="flex items-start gap-3 p-4 border border-border rounded-lg">
              <Checkbox
                id="sms-consent"
                checked={smsConsent}
                onCheckedChange={(checked) => setSmsConsent(checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="sms-consent" className="cursor-pointer leading-relaxed">
                By opting in, you'll receive SMS messages from OwlDoor for authentication, account alerts, and marketing. Msg & data rates may apply. Msg frequency varies. Reply STOP to cancel, HELP for help. <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> | <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>
              </Label>
            </div>
            <Button onClick={handleSubmit} size="lg" className="w-full md:w-auto px-12" disabled={!smsConsent || isSubmitting}>
              {isSubmitting ? "Submitting..." : "Match Me"}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={owlDoorLogo} alt="OwlDoor" className="h-8" />
          </Link>
          <ThemeSelector />
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Left Sidebar - Hidden on Mobile */}
        <aside className="hidden lg:block w-80 bg-muted/30 border-r border-border p-8">
          <div className="space-y-8 sticky top-8">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">PROGRESS</h3>
              <Progress value={progress} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground">
                Completion Time: {getCompletionTime()} Seconds
              </p>
            </div>

            <div className="space-y-4">
              {categories.map((category, idx) => {
                const isActive = getStepCategory(currentStep) === idx;
                const isCompleted = getStepCategory(currentStep) > idx;
                
                return (
                  <div
                    key={category}
                    className={`flex items-center gap-3 transition-all ${
                      isActive ? "text-primary font-semibold" : isCompleted ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span>{category}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Back Button - Always visible when not on first step */}
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 p-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          )}

          <div className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
            <Card className="p-8 md:p-12">
              {renderQuestion()}
            </Card>
          </div>
        </main>
      </div>

      {/* Other Dialog */}
      <Dialog open={showOtherDialog} onOpenChange={setShowOtherDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What else would you like?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              value={otherOffer}
              onChange={(e) => setOtherOffer(e.target.value)}
              placeholder="Enter your requirement..."
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowOtherDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleOtherOfferSubmit}>
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Matching;
