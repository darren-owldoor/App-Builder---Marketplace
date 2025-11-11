import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Question {
  field: string;
  text: string;
  field_type: string;
  priority: number;
}

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
  userType: "client" | "pro";
  userId: string;
  profileData: any;
}

export const OnboardingModal = ({ open, onComplete, userType, userId, profileData }: OnboardingModalProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      loadQuestions();
    }
  }, [open, userId, userType]);

  const loadQuestions = async () => {
    const criticalFields = userType === "client"
      ? ["company_name", "first_name", "last_name", "states", "cities"]
      : ["first_name", "last_name", "states", "cities"];

    const incompleteQuestions: Question[] = [];

    for (const field of criticalFields) {
      const value = profileData?.[field];
      const isEmpty = !value || (Array.isArray(value) && value.length === 0) || value === "";

      if (isEmpty) {
        incompleteQuestions.push({
          field,
          text: getQuestionText(field, userType),
          field_type: getFieldType(field),
          priority: 1,
        });
      }
    }

    setQuestions(incompleteQuestions);
  };

  const getQuestionText = (field: string, type: string): string => {
    const questionMap: Record<string, string> = {
      company_name: "What's your company name?",
      first_name: "What's your first name?",
      last_name: "What's your last name?",
      states: "Which states do you operate in?",
      cities: "Which cities do you target?",
      counties: "Which county/counties do you serve?",
    };
    return questionMap[field] || `Please provide your ${field}`;
  };

  const getFieldType = (field: string): string => {
    if (field === "states" || field === "cities") return "text";
    return "text";
  };

  const handleAnswerChange = (value: any) => {
    setAnswers({
      ...answers,
      [questions[currentStep].field]: value,
    });
  };

  const handleNext = async () => {
    const currentQuestion = questions[currentStep];
    const currentAnswer = answers[currentQuestion.field];

    if (!currentAnswer || (typeof currentAnswer === "string" && currentAnswer.trim() === "")) {
      toast.error("Please answer the question before continuing");
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const tableName = userType === "client" ? "clients" : "pros";
      
      // Process answers - convert comma-separated strings to arrays for certain fields
      const processedAnswers: Record<string, any> = {};
      for (const [field, value] of Object.entries(answers)) {
        if ((field === "states" || field === "cities" || field === "counties") && typeof value === "string") {
          processedAnswers[field] = value.split(",").map((v) => v.trim()).filter(Boolean);
        } else {
          processedAnswers[field] = value;
        }
      }

      const { error } = await supabase
        .from(tableName)
        .update({
          ...processedAnswers,
          onboarding_completed: true,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Welcome! Your profile has been set up.");
      
      // Wait for database to propagate
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      onComplete();
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      toast.error(`Failed to save: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome! Let's Get You Started</DialogTitle>
          <DialogDescription>
            Just a few quick questions to set up your profile ({currentStep + 1} of {questions.length})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Progress value={progress} className="h-2" />

          <div className="space-y-4">
            <Label className="text-lg font-semibold">{currentQuestion.text}</Label>

            {currentQuestion.field_type === "text" && (
              <Input
                value={answers[currentQuestion.field] || ""}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Type your answer..."
                className="text-base"
                autoFocus
              />
            )}

            {currentQuestion.field_type === "textarea" && (
              <Textarea
                value={answers[currentQuestion.field] || ""}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Type your answer..."
                className="min-h-[100px]"
                autoFocus
              />
            )}

            {currentQuestion.field_type === "select" && (
              <Select
                value={answers[currentQuestion.field] || ""}
                onValueChange={(value) => handleAnswerChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an option..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                </SelectContent>
              </Select>
            )}

            {(currentQuestion.field === "cities" || currentQuestion.field === "states" || currentQuestion.field === "counties") && (
              <p className="text-sm text-muted-foreground">
                Separate multiple values with commas (e.g., "San Diego, Los Angeles")
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0 || loading}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
                disabled={loading}
              >
                Skip
              </Button>
              <Button onClick={handleNext} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : currentStep < questions.length - 1 ? (
                  "Next"
                ) : (
                  "Complete"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
