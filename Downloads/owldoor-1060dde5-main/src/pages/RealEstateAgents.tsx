import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface FormData {
  licensed: string;
  propertyTypes: string[];
  experience: string;
  marketingHelp: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const steps = [
  { id: 1, title: "License Status", description: "Your credentials" },
  { id: 2, title: "Property Types", description: "Your expertise" },
  { id: 3, title: "Experience", description: "Your background" },
  { id: 4, title: "Goals", description: "Your objectives" },
  { id: 5, title: "Contact Info", description: "Get started" },
];

const RealEstateAgents = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    licensed: "",
    propertyTypes: [],
    experience: "",
    marketingHelp: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.licensed) {
          toast.error("Please select your license status");
          return false;
        }
        break;
      case 2:
        if (formData.propertyTypes.length === 0) {
          toast.error("Please select at least one property type");
          return false;
        }
        break;
      case 3:
        if (!formData.experience) {
          toast.error("Please select your experience level");
          return false;
        }
        break;
      case 4:
        if (!formData.marketingHelp) {
          toast.error("Please select an option");
          return false;
        }
        break;
      case 5:
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
          toast.error("Please fill in all contact information");
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          toast.error("Please enter a valid email address");
          return false;
        }
        break;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (validateStep()) {
      toast.success("Application submitted successfully!");
      // Here you would typically save to database
      console.log("Form submitted:", formData);
      navigate("/application-pending");
    }
  };

  const togglePropertyType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(type)
        ? prev.propertyTypes.filter((t) => t !== type)
        : [...prev.propertyTypes, type],
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Are you currently licensed?</h2>
              <p className="text-muted-foreground">Let us know your current license status</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {["Yes, I'm licensed", "No, but working on it", "No, I'm interested in learning"].map((option) => (
                <Button
                  key={option}
                  variant={formData.licensed === option ? "default" : "outline"}
                  className="h-auto py-4 px-6 text-left justify-start"
                  onClick={() => setFormData({ ...formData, licensed: option })}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">What property types interest you?</h2>
              <p className="text-muted-foreground">Select all that apply</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {["Residential", "Commercial", "Luxury", "Rentals", "Land", "New Construction"].map((type) => (
                <Button
                  key={type}
                  variant={formData.propertyTypes.includes(type) ? "default" : "outline"}
                  className="h-auto py-4 px-6 text-left justify-start"
                  onClick={() => togglePropertyType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">What's your experience level?</h2>
              <p className="text-muted-foreground">Help us understand your background</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                "Just starting out (0-1 years)",
                "Building momentum (1-3 years)",
                "Experienced (3-5 years)",
                "Veteran (5+ years)",
              ].map((level) => (
                <Button
                  key={level}
                  variant={formData.experience === level ? "default" : "outline"}
                  className="h-auto py-4 px-6 text-left justify-start"
                  onClick={() => setFormData({ ...formData, experience: level })}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">What's your biggest goal?</h2>
              <p className="text-muted-foreground">We'll help you achieve it</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                "Generate more leads",
                "Close more deals",
                "Build my brand",
                "Grow my team",
                "All of the above",
              ].map((goal) => (
                <Button
                  key={goal}
                  variant={formData.marketingHelp === goal ? "default" : "outline"}
                  className="h-auto py-4 px-6 text-left justify-start"
                  onClick={() => setFormData({ ...formData, marketingHelp: goal })}
                >
                  {goal}
                </Button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Let's get you started</h2>
              <p className="text-muted-foreground">Enter your contact information</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john.doe@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar - Step Indicators */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="sticky top-8">
                <h1 className="text-3xl font-bold mb-8">Join OwlDoor</h1>
                <div className="space-y-6">
                  {steps.map((step) => (
                    <div key={step.id} className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {currentStep > step.id ? (
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        ) : currentStep === step.id ? (
                          <div className="w-6 h-6 rounded-full border-2 border-primary bg-primary/20" />
                        ) : (
                          <Circle className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div
                          className={`font-medium ${
                            currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {step.title}
                        </div>
                        <div className="text-sm text-muted-foreground">{step.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Step {currentStep} of {steps.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-card rounded-lg shadow-lg p-8 md:p-12">
                {renderStep()}

                {/* Navigation Buttons */}
                <div className="flex gap-4 mt-8">
                  {currentStep > 1 && (
                    <Button variant="outline" onClick={handleBack} className="flex-1">
                      Back
                    </Button>
                  )}
                  {currentStep < steps.length ? (
                    <Button onClick={handleNext} className="flex-1">
                      Continue
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} className="flex-1">
                      Submit Application
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealEstateAgents;
