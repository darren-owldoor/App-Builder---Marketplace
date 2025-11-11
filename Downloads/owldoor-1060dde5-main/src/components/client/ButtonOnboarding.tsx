import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, Building2, MapPin, Calendar, Users, TrendingUp, DollarSign } from "lucide-react";

interface Question {
  id: string;
  question: string;
  type: "buttons" | "input" | "multiselect";
  options?: string[];
  icon: any;
  field: string;
}

const ONBOARDING_QUESTIONS: Question[] = [
  {
    id: "company_type",
    question: "What type of company are you?",
    type: "buttons",
    options: ["Real Estate Brokerage", "Mortgage Company", "Team/Group", "Other"],
    icon: Building2,
    field: "company_type"
  },
  {
    id: "company_size",
    question: "How many agents/loan officers do you currently have?",
    type: "buttons",
    options: ["1-10", "11-50", "51-200", "200+"],
    icon: Users,
    field: "company_size"
  },
  {
    id: "hiring_locations",
    question: "Where are you looking to hire? (Separate multiple with commas)",
    type: "input",
    icon: MapPin,
    field: "hiring_locations"
  },
  {
    id: "hiring_timeline",
    question: "When do you need to hire?",
    type: "buttons",
    options: ["Immediately", "Within 1 month", "1-3 months", "3-6 months", "Just exploring"],
    icon: Calendar,
    field: "hiring_timeline"
  },
  {
    id: "hiring_count",
    question: "How many professionals are you looking to hire?",
    type: "buttons",
    options: ["1-5", "6-10", "11-20", "20+"],
    icon: TrendingUp,
    field: "hiring_count"
  },
  {
    id: "min_experience",
    question: "Minimum years of experience required?",
    type: "buttons",
    options: ["No minimum", "1+ years", "2+ years", "5+ years", "10+ years"],
    icon: CheckCircle2,
    field: "min_experience"
  },
  {
    id: "min_transactions",
    question: "Minimum annual transactions required?",
    type: "buttons",
    options: ["No minimum", "5+ transactions", "10+ transactions", "20+ transactions", "50+ transactions"],
    icon: DollarSign,
    field: "min_transactions"
  }
];

interface ButtonOnboardingProps {
  onComplete?: () => void;
}

export const ButtonOnboarding = ({ onComplete }: ButtonOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const currentQuestion = ONBOARDING_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_QUESTIONS.length) * 100;
  const Icon = currentQuestion.icon;

  const handleAnswer = async (answer: string) => {
    const newAnswers = { ...answers, [currentQuestion.field]: answer };
    setAnswers(newAnswers);
    console.log('Answer recorded:', { field: currentQuestion.field, answer, allAnswers: newAnswers });

    if (currentStep < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
      setInputValue("");
    } else {
      await submitOnboarding(newAnswers);
    }
  };

  const handleInputSubmit = () => {
    if (inputValue.trim()) {
      handleAnswer(inputValue.trim());
    }
  };

  const submitOnboarding = async (finalAnswers: Record<string, string>) => {
    setIsSubmitting(true);
    try {
      console.log('Submitting onboarding with answers:', finalAnswers);
      
      toast({
        title: "Setup Complete!",
        description: "Your preferences have been saved successfully.",
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete onboarding",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">Quick Setup</CardTitle>
            <CardDescription>
              Step {currentStep + 1} of {ONBOARDING_QUESTIONS.length}
            </CardDescription>
          </div>
          <Badge variant="secondary">{Math.round(progress)}%</Badge>
        </div>
        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-semibold">{currentQuestion.question}</h3>
        </div>

        {currentQuestion.type === "buttons" && (
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options?.map((option) => (
              <Button
                key={option}
                variant="outline"
                size="lg"
                onClick={() => handleAnswer(option)}
                className="h-auto py-4 text-lg hover:bg-primary hover:text-primary-foreground transition-all"
                disabled={isSubmitting}
              >
                {option}
              </Button>
            ))}
          </div>
        )}

        {currentQuestion.type === "input" && (
          <div className="space-y-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleInputSubmit()}
              placeholder="e.g., Phoenix, AZ or 85001, 85002"
              className="text-lg py-6"
              disabled={isSubmitting}
            />
            <Button
              onClick={handleInputSubmit}
              size="lg"
              className="w-full"
              disabled={!inputValue.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        )}

        {currentStep > 0 && (
          <Button
            variant="ghost"
            onClick={handleBack}
            className="w-full"
            disabled={isSubmitting}
          >
            Back
          </Button>
        )}

        {Object.keys(answers).length > 0 && (
          <div className="border-t pt-4 mt-6">
            <p className="text-sm text-muted-foreground mb-2">Your answers:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(answers).map(([key, value]) => (
                <Badge key={key} variant="secondary">
                  {value}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
