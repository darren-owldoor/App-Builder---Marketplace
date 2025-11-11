import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Autocomplete, LoadScript } from "@react-google-maps/api";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Search, UserCircle, Building2, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
const libraries: ("places")[] = ["places"];
interface FormData {
  city: string;
  state: string;
  specialization: "real_estate" | "mortgage" | "";
  accountType: "agent" | "team" | "loan_officer" | "company" | "";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}
export const MortgageMarketChecker = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    city: "",
    state: "",
    specialization: "",
    accountType: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const specializationOptions = [{
    value: "real_estate" as const,
    label: "Real Estate",
    icon: Building2
  }, {
    value: "mortgage" as const,
    label: "Mortgage",
    icon: Briefcase
  }];
  const getAccountTypeOptions = () => {
    if (formData.specialization === "real_estate") {
      return [{
        value: "agent" as const,
        label: "Real Estate Agent",
        icon: UserCircle
      }, {
        value: "team" as const,
        label: "Brokerage/Team",
        icon: Building2
      }];
    }
    return [{
      value: "loan_officer" as const,
      label: "Loan Officer",
      icon: UserCircle
    }, {
      value: "company" as const,
      label: "Company/Branch",
      icon: Building2
    }];
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
        if (city && state) {
          setFormData(prev => ({
            ...prev,
            city,
            state
          }));
          setIsModalOpen(true);
        }
      }
    }
  };
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const {
        data,
        error: signupError
      } = await supabase.functions.invoke('agent-directory-signup', {
        body: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email.toLowerCase(),
          phone: formData.phone,
          specialization: "mortgage",
          account_type: formData.accountType,
          city: formData.city,
          state: formData.state
        }
      });
      if (signupError) throw signupError;
      if (data?.success) {
        toast.success(data.message);
        navigate("/verify-code", {
          state: {
            email: formData.email,
            specialization: "mortgage"
          }
        });
      } else {
        throw new Error(data?.error || 'Failed to process signup');
      }
    } catch (error: any) {
      console.error("Error:", error);
      // Show user-friendly message for duplicate email
      if (error.message?.includes('already exists') || error.message?.includes('EMAIL_EXISTS')) {
        toast.error(error.message || "This email is already registered. Please sign in instead.");
      } else {
        toast.error(error.message || "Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };
  const nextStep = () => {
    if (step === 1 && !formData.specialization) {
      toast.error("Please select your specialization");
      return;
    }
    if (step === 2 && !formData.accountType) {
      toast.error("Please select your account type");
      return;
    }
    if (step === 3 && (!formData.firstName || !formData.lastName)) {
      toast.error("Please enter your name");
      return;
    }
    if (step === 4 && (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))) {
      toast.error("Please enter a valid email");
      return;
    }
    if (step === 5) {
      if (!formData.phone) {
        toast.error("Please enter your phone number");
        return;
      }
      const digitsOnly = formData.phone.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        toast.error("Please enter a valid 10-digit US phone number");
        return;
      }
      handleSubmit();
      return;
    }
    setStep(step + 1);
  };
  const prevStep = () => setStep(step - 1);
  const resetForm = () => {
    setStep(1);
    setFormData({
      city: "",
      state: "",
      specialization: "",
      accountType: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: ""
    });
  };
  return <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={libraries}>
      <section className="py-24 px-6 bg-primary relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div style={{
          backgroundImage: "radial-gradient(circle, rgba(255, 255, 255, 0.8) 3px, transparent 3px)",
          backgroundSize: '20px 20px'
        }} className="w-full h-full bg-[#000a00]/0"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center">
            <h2 className="text-4xl mb-12 font-bold text-white md:text-6xl">
              Check Your Market Availability
            </h2>

            <div className="relative">
              <Autocomplete onLoad={autocomplete => {
              autocompleteRef.current = autocomplete;
            }} onPlaceChanged={onPlaceChanged} options={{
              types: ["(cities)"],
              componentRestrictions: {
                country: "us"
              }
            }}>
                <div className="relative flex items-center">
                  <div className="absolute left-6 pointer-events-none">
                    <Search className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <Input placeholder="Type in a County, City, or Zip Code" className="h-20 text-lg pl-16 pr-24 bg-white border-none rounded-2xl shadow-lg text-foreground placeholder:text-muted-foreground border-2 border-border" />
                  <Button type="button" className="absolute right-2 h-16 w-16 text-primary rounded-xl bg-slate-950 hover:bg-slate-800 font-extrabold text-2xl">
                    <ArrowRight className="w-6 h-6" />
                  </Button>
                </div>
              </Autocomplete>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modal with remaining form steps */}
      <Dialog open={isModalOpen} onOpenChange={open => {
      setIsModalOpen(open);
      if (!open) resetForm();
    }}>
        <DialogContent className="sm:max-w-[500px] bg-primary border-none text-primary-foreground">
          <div className="space-y-6 py-4">
            {/* Progress Bar */}
            <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
              <motion.div className="h-full bg-white" initial={{
              width: "0%"
            }} animate={{
              width: `${step / 5 * 100}%`
            }} transition={{
              duration: 0.3
            }} />
            </div>

            {/* Location Selected Banner */}
            <div className="text-center pb-4 border-b border-white/20">
              <p className="text-sm text-primary-foreground/80">Checking availability for:</p>
              <p className="text-xl font-bold text-primary-foreground">{formData.city}, {formData.state}</p>
            </div>

            <AnimatePresence mode="wait">
              {/* Step 1: Specialization */}
              {step === 1 && <motion.div key="step1" initial={{
              opacity: 0,
              x: 20
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: -20
            }} className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-3xl font-bold text-primary-foreground mb-2">What's your specialization?</h3>
                    <p className="text-primary-foreground/80">Select your industry</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {specializationOptions.map(type => <Button key={type.value} type="button" variant="outline" onClick={() => {
                  setFormData({
                    ...formData,
                    specialization: type.value
                  });
                  setTimeout(() => setStep(2), 300);
                }} className="h-20 text-lg font-semibold transition-all bg-white text-foreground border-2 border-white/50 hover:bg-white/90 hover:border-white">
                        <type.icon className="mr-3 h-6 w-6" />
                        {type.label}
                      </Button>)}
                  </div>
                </motion.div>}

              {/* Step 2: Account Type */}
              {step === 2 && <motion.div key="step2" initial={{
              opacity: 0,
              x: 20
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: -20
            }} className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-3xl font-bold text-primary-foreground mb-2">I am a...</h3>
                    <p className="text-primary-foreground/80">Select your role</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {getAccountTypeOptions().map(type => <Button key={type.value} type="button" variant="outline" onClick={() => {
                  setFormData({
                    ...formData,
                    accountType: type.value
                  });
                  setTimeout(() => setStep(3), 300);
                }} className="h-20 text-lg font-semibold transition-all bg-white text-foreground border-2 border-white/50 hover:bg-white/90 hover:border-white">
                        <type.icon className="mr-3 h-6 w-6" />
                        {type.label}
                      </Button>)}
                  </div>
                </motion.div>}

              {/* Step 3: Name */}
              {step === 3 && <motion.div key="step3" initial={{
              opacity: 0,
              x: 20
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: -20
            }} className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-3xl font-bold text-primary-foreground mb-2">What's your name?</h3>
                    <p className="text-primary-foreground/80">Let's get to know you</p>
                  </div>

                  <div className="space-y-4">
                    <Input placeholder="First Name" value={formData.firstName} onChange={e => setFormData({
                  ...formData,
                  firstName: e.target.value
                })} className="h-14 text-lg bg-white border-white text-foreground" autoFocus />
                    <Input placeholder="Last Name" value={formData.lastName} onChange={e => setFormData({
                  ...formData,
                  lastName: e.target.value
                })} className="h-14 text-lg bg-white border-white text-foreground" />
                  </div>
                </motion.div>}

              {/* Step 4: Email */}
              {step === 4 && <motion.div key="step4" initial={{
              opacity: 0,
              x: 20
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: -20
            }} className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-3xl font-bold text-primary-foreground mb-2">What's your email?</h3>
                    <p className="text-primary-foreground/80">We'll use this to create your account</p>
                  </div>

                  <Input type="email" placeholder="your.email@example.com" value={formData.email} onChange={e => setFormData({
                ...formData,
                email: e.target.value
              })} className="h-14 text-lg bg-white border-white text-foreground" autoFocus />
                </motion.div>}

              {/* Step 5: Phone */}
              {step === 5 && <motion.div key="step5" initial={{
              opacity: 0,
              x: 20
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: -20
            }} className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-3xl font-bold text-primary-foreground mb-2">What's your phone?</h3>
                    <p className="text-primary-foreground/80">So we can send you verification code</p>
                  </div>

                  <Input type="tel" placeholder="5551234567" value={formData.phone} onChange={e => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData({
                  ...formData,
                  phone: digits
                });
              }} className="h-14 text-lg bg-white border-white text-foreground" maxLength={10} autoFocus />
                </motion.div>}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-4">
              {step > 1 && <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-14 text-lg bg-card text-card-foreground border-card hover:bg-card/90">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back
                </Button>}
              <Button type="button" onClick={nextStep} disabled={loading} className="flex-1 h-14 text-lg bg-card text-card-foreground hover:bg-card/90 font-semibold">
                {loading ? "Creating Account..." : step === 5 ? formData.accountType === "team" || formData.accountType === "company" ? "Complete Sign Up" : "Join Free" : "Continue"}
                {!loading && step < 5 && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </div>

            <p className="text-xs text-primary-foreground/70 text-center pt-2">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </LoadScript>;
};