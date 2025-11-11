import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GooglePlacesAutocomplete } from "@/components/GooglePlacesAutocomplete";
import { useNavigate } from "react-router-dom";

interface BrokerageSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function BrokerageSearchModal({ open, onClose }: BrokerageSearchModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    location: "",
    city: "",
    state: "",
    experienceLevel: "",
    currentProduction: "",
    splitPreference: "",
    teamSize: "",
    specialization: "",
  });

  const questions = [
    {
      step: 1,
      question: "Where are you looking to work?",
      field: "location",
      type: "location",
    },
    {
      step: 2,
      question: "What's your experience level?",
      field: "experienceLevel",
      type: "select",
      options: [
        { value: "new", label: "New Agent (0-2 years)" },
        { value: "intermediate", label: "Intermediate (3-5 years)" },
        { value: "experienced", label: "Experienced (6-10 years)" },
        { value: "veteran", label: "Veteran (10+ years)" },
      ],
    },
    {
      step: 3,
      question: "What's your current annual production?",
      field: "currentProduction",
      type: "select",
      options: [
        { value: "0-1m", label: "$0 - $1M" },
        { value: "1-3m", label: "$1M - $3M" },
        { value: "3-5m", label: "$3M - $5M" },
        { value: "5-10m", label: "$5M - $10M" },
        { value: "10m+", label: "$10M+" },
      ],
    },
    {
      step: 4,
      question: "What commission split are you looking for?",
      field: "splitPreference",
      type: "select",
      options: [
        { value: "50-50", label: "50/50" },
        { value: "60-40", label: "60/40" },
        { value: "70-30", label: "70/30" },
        { value: "80-20", label: "80/20" },
        { value: "100", label: "100% (with fees)" },
      ],
    },
    {
      step: 5,
      question: "Are you building a team?",
      field: "teamSize",
      type: "select",
      options: [
        { value: "solo", label: "Solo Agent" },
        { value: "small", label: "Small Team (2-5)" },
        { value: "medium", label: "Medium Team (6-15)" },
        { value: "large", label: "Large Team (16+)" },
      ],
    },
    {
      step: 6,
      question: "What's your primary specialization?",
      field: "specialization",
      type: "select",
      options: [
        { value: "residential", label: "Residential Sales" },
        { value: "luxury", label: "Luxury Homes" },
        { value: "commercial", label: "Commercial Real Estate" },
        { value: "investment", label: "Investment Properties" },
        { value: "new-construction", label: "New Construction" },
      ],
    },
  ];

  const currentQuestion = questions[step - 1];

  const handleNext = () => {
    if (step < questions.length) {
      setStep(step + 1);
    } else {
      // Submit and navigate to matching
      console.log("Search criteria:", formData);
      navigate("/join/real-estate-agent", { state: { searchData: formData } });
      onClose();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    const field = currentQuestion.field as keyof typeof formData;
    return formData[field] && formData[field] !== "";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Find Your Perfect Brokerage</DialogTitle>
          <div className="flex items-center gap-2 mt-4">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-all ${
                  index + 1 <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="py-6">
          <Label className="text-lg font-semibold mb-4 block">{currentQuestion.question}</Label>

          {currentQuestion.type === "location" && (
            <div className="space-y-2">
              <GooglePlacesAutocomplete
                onPlaceSelected={(city, state) => {
                  setFormData({ 
                    ...formData, 
                    location: `${city}, ${state}`,
                    city,
                    state
                  });
                }}
                placeholder="Enter city and state"
                value={formData.location}
              />
              {formData.city && formData.state && (
                <p className="text-sm text-muted-foreground">
                  Selected: {formData.city}, {formData.state}
                </p>
              )}
            </div>
          )}

          {currentQuestion.type === "select" && (
            <Select
              value={formData[currentQuestion.field as keyof typeof formData] as string}
              onValueChange={(value) =>
                setFormData({ ...formData, [currentQuestion.field]: value })
              }
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {currentQuestion.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-base">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1"
          >
            {step === questions.length ? "Find Matches" : "Next"}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-2">
          Question {step} of {questions.length}
        </p>
      </DialogContent>
    </Dialog>
  );
}
