import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

interface Question {
  id: string;
  question: string;
  type: "radio" | "checkbox" | "input" | "textarea";
  options?: string[];
  category: string;
  weight: number;
}

interface Answer {
  question_id: string;
  question_text: string;
  answer: string | string[];
  category: string;
  weight: number;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string | string[]>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userType, setUserType] = useState<"broker" | "agent">("agent");

  useEffect(() => {
    loadUserTypeAndQuestions();
  }, []);

  const loadUserTypeAndQuestions = async () => {
    try {
      setIsLoading(true);

      // Get user type from profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      const type = profile?.user_type === 'broker' ? 'broker' : 'agent';
      setUserType(type);

      // Generate AI-powered questions
      const { data, error } = await supabase.functions.invoke('generate-onboarding-questions', {
        body: { userType: type },
      });

      if (error) throw error;

      setQuestions(data.questions || []);
      
      toast.success(
        `${data.questions?.length || 0} AI-generated questions ready!`,
        { description: 'Powered by Claude, Gemini & ChatGPT' }
      );
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load questions');
      // Use fallback questions
      setQuestions(getFallbackQuestions(userType));
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackQuestions = (type: string): Question[] => [
    {
      id: 'location',
      question: 'Which cities or regions do you primarily work in?',
      type: 'input',
      category: 'geographic',
      weight: 10,
    },
    {
      id: 'experience',
      question: 'How many years of experience do you have in real estate?',
      type: 'radio',
      options: ['0-2 years', '3-5 years', '6-10 years', '10+ years'],
      category: 'experience',
      weight: 9,
    },
    {
      id: 'specialization',
      question: 'What are your primary specializations?',
      type: 'checkbox',
      options: ['Residential', 'Commercial', 'Luxury', 'First-time buyers', 'Investment properties'],
      category: 'experience',
      weight: 8,
    },
  ];

  const currentQuestion = questions[currentStep];
  const progress = questions.length > 0 ? ((currentStep + 1) / questions.length) * 100 : 0;

  const handleNext = async () => {
    if (!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)) {
      toast.error('Please answer the question before continuing');
      return;
    }

    // Save current answer
    const newAnswers = [
      ...answers,
      {
        question_id: currentQuestion.id,
        question_text: currentQuestion.question,
        answer: currentAnswer,
        category: currentQuestion.category,
        weight: currentQuestion.weight,
      },
    ];
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
      setCurrentAnswer("");
    } else {
      await saveOnboarding(newAnswers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const previousAnswers = answers.slice(0, -1);
      setAnswers(previousAnswers);
      setCurrentStep(currentStep - 1);
      setCurrentAnswer(previousAnswers[currentStep - 1]?.answer || "");
    }
  };

  const handleSkip = async () => {
    await saveOnboarding(answers);
  };

  const saveOnboarding = async (finalAnswers: Answer[]) => {
    try {
      setIsSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save onboarding responses
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_data: finalAnswers as any,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Onboarding complete! Finding your perfect matches...');
      
      // Navigate to appropriate dashboard
      setTimeout(() => {
        navigate(userType === 'broker' ? '/broker' : '/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error saving onboarding:', error);
      toast.error('Failed to save responses');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Generating Your Questions</h2>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            Consulting Claude, Gemini & ChatGPT...
          </p>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <p className="text-muted-foreground">No questions available</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">
              Question {currentStep + 1} of {questions.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="p-8 mb-6">
          <div className="mb-6">
            <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full mb-4">
              {currentQuestion.category}
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Answer Input */}
          <div className="space-y-4">
            {currentQuestion.type === "radio" && currentQuestion.options && (
              <RadioGroup
                value={currentAnswer as string}
                onValueChange={setCurrentAnswer}
              >
                {currentQuestion.options.map((option) => (
                  <div key={option} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === "checkbox" && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <div key={option} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={option}
                      checked={(currentAnswer as string[]).includes(option)}
                      onCheckedChange={(checked) => {
                        const current = Array.isArray(currentAnswer) ? currentAnswer : [];
                        setCurrentAnswer(
                          checked
                            ? [...current, option]
                            : current.filter((v) => v !== option)
                        );
                      }}
                    />
                    <Label htmlFor={option} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {currentQuestion.type === "input" && (
              <Input
                value={currentAnswer as string}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="text-lg"
              />
            )}

            {currentQuestion.type === "textarea" && (
              <Textarea
                value={currentAnswer as string}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="min-h-[120px] text-lg"
              />
            )}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={isSaving}
          >
            Skip for now
          </Button>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSaving}
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={isSaving || !currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : currentStep === questions.length - 1 ? (
                'Complete'
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </div>

        {/* AI Badge */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            Questions powered by Claude, Gemini & ChatGPT
          </p>
        </div>
      </div>
    </div>
  );
}
