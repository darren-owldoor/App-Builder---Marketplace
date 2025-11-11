import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Autocomplete, LoadScript } from "@react-google-maps/api";
import { ArrowRight, CheckCircle2, Search } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import owlLogo from "@/assets/owldoor-logo-light.svg";
import { motion, AnimatePresence } from "framer-motion";
import { useGoogleMapsApiKey } from "@/hooks/useGoogleMapsApiKey";

const libraries: ("places")[] = ["places"];

interface FormData {
  specialization: "real_estate" | "mortgage";
  accountType: "agent" | "team" | "loan_officer" | "company";
  city: string;
  state: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  yearsExperience: string;
  annualTransactions: string;
  whatToSee: string[];
  showTeamBrokerages: string;
  idealBrokerageProvides: string[];
  motivationToSwitch: string;
  motivationScore: number;
}

// Helper function to convert single number to range
export const numberToExperienceRange = (years: number): string => {
  if (years <= 2) return "0-2";
  if (years <= 7) return "3-7";
  if (years <= 14) return "8-14";
  if (years <= 30) return "15-30";
  if (years <= 50) return "31-50";
  return "51+";
};

const JoinRealEstateAgent = () => {
  const navigate = useNavigate();
  const { apiKey, loading: apiKeyLoading } = useGoogleMapsApiKey();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [formData, setFormData] = useState<FormData>({
    specialization: "real_estate",
    accountType: "agent",
    city: "",
    state: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    yearsExperience: "",
    annualTransactions: "",
    whatToSee: [],
    showTeamBrokerages: "",
    idealBrokerageProvides: [],
    motivationToSwitch: "",
    motivationScore: 0
  });
  const [optInConsent, setOptInConsent] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const totalSteps = 9;

  const idealBrokerageOptions = [
    "Leads/Referrals",
    "Coaching & Mentorship",
    "High Splits",
    "Great Leadership",
    "Great Support",
    "Referral Partnerships",
    "Growth Opportunities",
    "Free CRM & Tech",
    "Great Atmosphere"
  ];

  const whatToSeeOptions = [
    "Brokerage Offerings",
    "Send/Receive Referrals",
    "Lender Partnerships",
    "See What Teams Provide"
  ];

  const motivationOptions = [
    { text: "Yes", score: 10 },
    { text: "I'm Open", score: 8 },
    { text: "Possibly", score: 7 },
    { text: "Not Now", score: 5 },
    { text: "No Thanks", score: 1 }
  ];

  const handleNext = () => {
    if (!validateStep()) return;
    
    let nextStep = currentStep + 1;
    
    // Skip step 3 (team/brokerages question) if they selected the right options in step 2
    if (currentStep === 2 && !shouldShowTeamBrokeragesQuestion()) {
      nextStep = 4;
    }
    
    // Skip steps 4 and 5 if they shouldn't see the ideal brokerage questions
    if (currentStep === 3 && !shouldShowIdealBrokerageQuestion()) {
      nextStep = 6;
    }
    
    // Skip step 5 if coming from step 4 and shouldn't show motivation
    if (currentStep === 4 && !shouldShowIdealBrokerageQuestion()) {
      nextStep = 6;
    }
    
    setCurrentStep(Math.min(nextStep, totalSteps));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const shouldShowTeamBrokeragesQuestion = () => {
    return !formData.whatToSee.includes("Brokerage Offerings") && 
           !formData.whatToSee.includes("Send/Receive Referrals");
  };

  const shouldShowIdealBrokerageQuestion = () => {
    return (formData.showTeamBrokerages === "Sure") || 
           formData.whatToSee.includes("Brokerage Offerings") || 
           formData.whatToSee.includes("See What Teams Provide");
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.city || !formData.state) {
          toast.error("Please enter your city and state");
          return false;
        }
        break;
      case 2:
        if (formData.whatToSee.length === 0) {
          toast.error("Please select at least one option");
          return false;
        }
        break;
      case 3:
        if (shouldShowTeamBrokeragesQuestion() && !formData.showTeamBrokerages) {
          toast.error("Please make a selection");
          return false;
        }
        break;
      case 4:
        if (shouldShowIdealBrokerageQuestion() && formData.idealBrokerageProvides.length === 0) {
          toast.error("Please select at least one option");
          return false;
        }
        break;
      case 5:
        if (shouldShowIdealBrokerageQuestion() && !formData.motivationToSwitch) {
          toast.error("Please select your motivation level");
          return false;
        }
        break;
      case 6:
        if (!formData.yearsExperience) {
          toast.error("Please select your years of experience");
          return false;
        }
        break;
      case 7:
        if (!formData.annualTransactions) {
          toast.error("Please select your annual transaction volume");
          return false;
        }
        break;
      case 8:
        if (!formData.firstName || !formData.lastName || !formData.email) {
          toast.error("Please complete all fields");
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          toast.error("Please enter a valid email address");
          return false;
        }
        break;
      case 9:
        if (!formData.phone) {
          toast.error("Please enter your phone number");
          return false;
        }
        const digitsOnly = formData.phone.replace(/\D/g, '');
        if (digitsOnly.length !== 10) {
          toast.error("Please enter a valid 10-digit US phone number");
          return false;
        }
        if (!optInConsent) {
          toast.error("Please agree to receive SMS messages");
          return false;
        }
        break;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    try {
      // Create auth account
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase(),
        password: Math.random().toString(36).slice(-12) + 'Aa1!', // Generate random password
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        }
      });

      if (authError) throw authError;
      const authData = await supabase.auth.getUser();
      if (!authData.data.user) throw new Error("Failed to create account");

      // Assign 'lead' role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.data.user.id,
          role: 'lead'
        } as any);

      if (roleError) {
        console.error('Error assigning role:', roleError);
      }

      // Create agent profile and mark as ready to match
      const { error: agentError } = await (supabase as any)
        .from('pros')
        .insert({
          user_id: authData.data.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email.toLowerCase(),
          phone: formData.phone,
          full_name: `${formData.firstName} ${formData.lastName}`,
          specialization: formData.specialization,
          city: formData.city,
          state: formData.state,
          years_experience: formData.yearsExperience,
          annual_transactions: formData.annualTransactions,
          wants: formData.idealBrokerageProvides,
          motivation: formData.motivationScore.toString(),
          status: 'active',
          pipeline_stage: 'qualified',
          pipeline_type: 'staff',
          source: 'directory',
          matching_completed: true, // Mark as ready to match
          market_coverage_completed: false
        });

      if (agentError) throw agentError;

      toast.success("Account created! Check your phone for the magic login link.");
      navigate("/auth");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.address_components) {
        let city = "";
        let state = "";

        for (const component of place.address_components) {
          if (component.types.includes("locality")) {
            city = component.long_name;
          }
          if (component.types.includes("administrative_area_level_1")) {
            state = component.short_name;
          }
        }

        setFormData(prev => ({ ...prev, city, state }));
      }
    }
  };

  const toggleWhatToSeeOption = (option: string) => {
    setFormData(prev => {
      const current = prev.whatToSee;
      if (current.includes(option)) {
        return { ...prev, whatToSee: current.filter(o => o !== option) };
      } else {
        return { ...prev, whatToSee: [...current, option] };
      }
    });
  };

  const toggleIdealBrokerageOption = (option: string) => {
    setFormData(prev => {
      const current = prev.idealBrokerageProvides;
      if (current.includes(option)) {
        return { ...prev, idealBrokerageProvides: current.filter(o => o !== option) };
      } else {
        return { ...prev, idealBrokerageProvides: [...current, option] };
      }
    });
  };

  // Auto-advance on selection for single-choice questions with animation
  useEffect(() => {
    if (isAnimating) return;

    const timer = setTimeout(() => {
      if (currentStep === 1 && formData.city && formData.state) {
        setIsAnimating(true);
        setTimeout(() => {
          handleNext();
          setIsAnimating(false);
        }, 1000);
      } else if (currentStep === 3 && formData.showTeamBrokerages && selectedAnswer) {
        setIsAnimating(true);
        setTimeout(() => {
          handleNext();
          setSelectedAnswer(null);
          setIsAnimating(false);
        }, 800);
      } else if (currentStep === 5 && formData.motivationToSwitch && selectedAnswer) {
        setIsAnimating(true);
        setTimeout(() => {
          handleNext();
          setSelectedAnswer(null);
          setIsAnimating(false);
        }, 800);
      } else if (currentStep === 6 && formData.yearsExperience && selectedAnswer) {
        setIsAnimating(true);
        setTimeout(() => {
          handleNext();
          setSelectedAnswer(null);
          setIsAnimating(false);
        }, 800);
      } else if (currentStep === 7 && formData.annualTransactions && selectedAnswer) {
        setIsAnimating(true);
        setTimeout(() => {
          handleNext();
          setSelectedAnswer(null);
          setIsAnimating(false);
        }, 800);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [currentStep, formData.city, formData.state, formData.showTeamBrokerages, formData.yearsExperience, formData.annualTransactions, formData.motivationToSwitch, selectedAnswer, isAnimating]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 -mx-6">
            <div className="bg-[#5fb596] rounded-3xl p-8 md:p-12 text-center space-y-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                Check Your Market Availability
              </h1>
              
              {/* Search Bar */}
              <div className="relative max-w-3xl mx-auto">
                <Autocomplete
                  onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                  onPlaceChanged={onPlaceChanged}
                  options={{ types: ["(cities)"], componentRestrictions: { country: "us" } }}
                >
                  <div className="relative flex items-center bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="pl-6 pr-4">
                      <Search className="w-6 h-6 text-gray-400" />
                    </div>
                    <Input
                      placeholder="Type in a County, City, or Zip Code"
                      className="flex-1 border-0 h-14 md:h-16 text-base md:text-lg focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                      autoFocus
                    />
                    <button 
                      type="button"
                      className="bg-[#5fb596] hover:bg-[#4ea585] text-white p-3 md:p-4 m-2 rounded-xl transition-colors"
                    >
                      <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  </div>
                </Autocomplete>
              </div>

              {formData.city && formData.state && (
                <div className="flex items-center justify-center gap-2 text-white pt-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="text-lg font-medium">{formData.city}, {formData.state}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                What would you like to see?
              </h2>
              <p className="text-lg md:text-xl text-gray-600">Select as many as you'd like</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {whatToSeeOptions.map(option => (
                <button
                  key={option}
                  onClick={() => toggleWhatToSeeOption(option)}
                  className={`p-6 rounded-2xl border-2 transition-all text-xl font-medium text-left flex items-center gap-4 ${
                    formData.whatToSee.includes(option)
                      ? "border-[#35a87e] bg-[#35a87e]/10 text-[#35a87e]"
                      : "border-gray-200 hover:border-[#35a87e]/50"
                  }`}
                >
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                    formData.whatToSee.includes(option)
                      ? "border-[#35a87e] bg-[#35a87e]"
                      : "border-gray-300"
                  }`}>
                    {formData.whatToSee.includes(option) && (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                  </div>
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        if (!shouldShowTeamBrokeragesQuestion()) return null;
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                Can we show you what Local Teams and Brokerages would offer you?
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {["Sure", "Not Now"].map(option => (
                <motion.button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, showTeamBrokerages: option });
                    setSelectedAnswer(option);
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all text-xl font-medium text-left ${
                    formData.showTeamBrokerages === option
                      ? "border-[#35a87e] bg-[#35a87e]/10 text-[#35a87e]"
                      : "border-gray-200 hover:border-[#35a87e]/50 hover:scale-[1.01]"
                  }`}
                  animate={
                    formData.showTeamBrokerages === option && selectedAnswer === option
                      ? {
                          scale: [1, 1.05, 1.02],
                          boxShadow: [
                            "0 0 0 0 rgba(53, 168, 126, 0)",
                            "0 0 0 10px rgba(53, 168, 126, 0.3)",
                            "0 0 0 0 rgba(53, 168, 126, 0)"
                          ]
                        }
                      : {}
                  }
                  transition={{ duration: 0.6 }}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 4:
        if (!shouldShowIdealBrokerageQuestion()) return null;
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                What Would Your Ideal Brokerage/Team Provide?
              </h2>
              <p className="text-lg md:text-xl text-gray-600">Select what matters most to you</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {idealBrokerageOptions.map(option => (
                <button
                  key={option}
                  onClick={() => toggleIdealBrokerageOption(option)}
                  className={`p-6 rounded-2xl border-2 transition-all text-lg font-medium text-left flex items-center gap-3 ${
                    formData.idealBrokerageProvides.includes(option)
                      ? "border-[#35a87e] bg-[#35a87e]/10 text-[#35a87e]"
                      : "border-gray-200 hover:border-[#35a87e]/50"
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    formData.idealBrokerageProvides.includes(option)
                      ? "border-[#35a87e] bg-[#35a87e]"
                      : "border-gray-300"
                  }`}>
                    {formData.idealBrokerageProvides.includes(option) && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </div>
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        if (!shouldShowIdealBrokerageQuestion()) return null;
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                Are you open to joining a Team/Brokerage that offers:
              </h2>
              <p className="text-lg md:text-xl text-[#35a87e] font-semibold">
                {formData.idealBrokerageProvides.join(", ")}?
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {motivationOptions.map(option => (
                <motion.button
                  key={option.text}
                  onClick={() => {
                    setFormData({ ...formData, motivationToSwitch: option.text, motivationScore: option.score });
                    setSelectedAnswer(option.text);
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all text-xl font-medium text-left ${
                    formData.motivationToSwitch === option.text
                      ? "border-[#35a87e] bg-[#35a87e]/10 text-[#35a87e]"
                      : "border-gray-200 hover:border-[#35a87e]/50 hover:scale-[1.01]"
                  }`}
                  animate={
                    formData.motivationToSwitch === option.text && selectedAnswer === option.text
                      ? {
                          scale: [1, 1.05, 1.02],
                          boxShadow: [
                            "0 0 0 0 rgba(53, 168, 126, 0)",
                            "0 0 0 10px rgba(53, 168, 126, 0.3)",
                            "0 0 0 0 rgba(53, 168, 126, 0)"
                          ]
                        }
                      : {}
                  }
                  transition={{ duration: 0.6 }}
                >
                  {option.text}
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                Years in Real Estate?
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {["0-2 years", "3-7 years", "8-14 years", "15+ years"].map(years => (
                <motion.button
                  key={years}
                  onClick={() => {
                    setFormData({ ...formData, yearsExperience: years });
                    setSelectedAnswer(years);
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all text-xl font-medium text-left ${
                    formData.yearsExperience === years
                      ? "border-[#35a87e] bg-[#35a87e]/10 text-[#35a87e]"
                      : "border-gray-200 hover:border-[#35a87e]/50 hover:scale-[1.01]"
                  }`}
                  animate={
                    formData.yearsExperience === years && selectedAnswer === years
                      ? {
                          scale: [1, 1.05, 1.02],
                          boxShadow: [
                            "0 0 0 0 rgba(53, 168, 126, 0)",
                            "0 0 0 10px rgba(53, 168, 126, 0.3)",
                            "0 0 0 0 rgba(53, 168, 126, 0)"
                          ]
                        }
                      : {}
                  }
                  transition={{ duration: 0.6 }}
                >
                  {years}
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                Annual Transactions?
              </h2>
              <p className="text-lg md:text-xl text-gray-600">How many deals per year?</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {["0-2 deals", "3-7 deals", "8-14 deals", "15-30 deals", "31-50 deals", "51-75 deals", "76-150 deals", "150+ deals"].map(volume => (
                <motion.button
                  key={volume}
                  onClick={() => {
                    setFormData({ ...formData, annualTransactions: volume });
                    setSelectedAnswer(volume);
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all text-lg font-medium text-left ${
                    formData.annualTransactions === volume
                      ? "border-[#35a87e] bg-[#35a87e]/10 text-[#35a87e]"
                      : "border-gray-200 hover:border-[#35a87e]/50 hover:scale-[1.01]"
                  }`}
                  animate={
                    formData.annualTransactions === volume && selectedAnswer === volume
                      ? {
                          scale: [1, 1.05, 1.02],
                          boxShadow: [
                            "0 0 0 0 rgba(53, 168, 126, 0)",
                            "0 0 0 10px rgba(53, 168, 126, 0.3)",
                            "0 0 0 0 rgba(53, 168, 126, 0)"
                          ]
                        }
                      : {}
                  }
                  transition={{ duration: 0.6 }}
                >
                  {volume}
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                Account and Login Info
              </h2>
              <p className="text-lg md:text-xl text-gray-600">Let's get you set up</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-lg text-gray-700">First Name</Label>
                <Input
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  className="h-14 text-xl border-2 border-gray-300 focus:border-[#35a87e]"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label className="text-lg text-gray-700">Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  className="h-14 text-xl border-2 border-gray-300 focus:border-[#35a87e]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-lg text-gray-700">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john.doe@example.com"
                  className="h-14 text-xl border-2 border-gray-300 focus:border-[#35a87e]"
                />
              </div>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                Verify Your Phone Number
              </h2>
              <p className="text-lg md:text-xl text-gray-600">We'll send you a magic login link</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: digits });
                  }}
                  placeholder="5551234567"
                  className="h-16 text-2xl border-2 border-gray-300 focus:border-[#35a87e]"
                  maxLength={10}
                  autoFocus
                />
              </div>
              <div className="flex items-start space-x-4 bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                <Checkbox
                  id="optInConsent"
                  checked={optInConsent}
                  onCheckedChange={(checked) => setOptInConsent(checked as boolean)}
                  className="mt-1"
                />
                <Label htmlFor="optInConsent" className="text-base leading-relaxed text-gray-700 cursor-pointer">
                  By providing your phone number and checking this box, you agree to receive SMS messages from OwlDoor. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe or HELP for help. View our{" "}
                  <Link to="/privacy-policy" className="hover:underline text-[#35a87e] font-medium">Privacy Policy</Link>,{" "}
                  <Link to="/terms-of-service" className="hover:underline text-[#35a87e] font-medium">Terms of Service</Link>, and{" "}
                  <Link to="/sms-terms" className="hover:underline text-[#35a87e] font-medium">SMS Terms</Link>.
                </Label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (apiKeyLoading || !apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col">
        {/* Header */}
        <div className="w-full bg-white border-b border-gray-200 py-4 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <img src={owlLogo} alt="OwlDoor" className="h-8" />
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Step {currentStep} of {totalSteps}
              </span>
              <Progress value={(currentStep / totalSteps) * 100} className="w-32 h-2" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="min-h-[500px]"
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-4 mt-12">
              {currentStep > 1 && (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  size="lg"
                  className="text-lg"
                  disabled={loading}
                >
                  Back
                </Button>
              )}
              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="flex-1 text-lg bg-[#35a87e] hover:bg-[#2d8f6a] text-white h-14"
                  disabled={loading}
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  size="lg"
                  className="flex-1 text-lg bg-[#35a87e] hover:bg-[#2d8f6a] text-white h-14"
                  disabled={loading || !optInConsent}
                >
                  {loading ? "Creating Account..." : "Create Account & Send Magic Link"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <div className="w-full text-center py-4 text-sm text-gray-500">
          Press <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300">Enter ↵</kbd> to continue
        </div>
      </div>
    </LoadScript>
  );
};

export default JoinRealEstateAgent;
