import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";

interface Question {
  id: string;
  field_name: string;
  question_text: string;
  field_type: string;
  required: boolean;
  priority: number;
  placeholder?: string;
  options?: string[];
}

interface UserProfile {
  user_type: 'client' | 'pro' | 'staff' | 'admin';
  profile_id: string;
  profile_data: any;
}

export default function DynamicOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadUserProfileAndQuestions();
    } else {
      navigate("/auth");
    }
  }, [user]);

  const loadUserProfileAndQuestions = async () => {
    try {
      // Check if user is client
      let { data: client } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (client) {
        setUserProfile({
          user_type: 'client',
          profile_id: client.id,
          profile_data: client
        });
        await loadQuestionsForClient(client);
        setLoading(false);
        return;
      }

      // Check if user is pro
      let { data: pro } = await supabase
        .from("pros")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (pro) {
        setUserProfile({
          user_type: 'pro',
          profile_id: pro.id,
          profile_data: pro
        });
        await loadQuestionsForPro(pro);
        setLoading(false);
        return;
      }

      // Check if user is staff/admin
      let { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);

      if (roles && roles.length > 0) {
        const isAdmin = roles.some(r => r.role === 'admin');
        const isStaff = roles.some(r => r.role === 'staff');
        
        if (isAdmin || isStaff) {
          toast({
            title: "Admin/Staff users don't need onboarding",
            description: "Redirecting to dashboard"
          });
          navigate(isAdmin ? "/admin" : "/staff");
          return;
        }
      }

      // No profile found
      toast({
        title: "Profile not found",
        description: "Please complete signup first",
        variant: "destructive"
      });
      navigate("/auth");
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionsForClient = async (client: any) => {
    const highPriorityQuestions: Question[] = [];
    const completed = new Set<string>();

    // Check which fields are already filled
    const criticalFields = [
      { field: 'company_name', question: 'What is your company name?', type: 'text', priority: 1, required: true },
      { field: 'contact_name', question: 'Primary contact name?', type: 'text', priority: 1, required: true },
      { field: 'email', question: 'Contact email address?', type: 'email', priority: 1, required: true },
      { field: 'phone', question: 'Phone number?', type: 'tel', priority: 1, required: true },
      { field: 'client_type', question: 'What type of company are you?', type: 'select', priority: 2, required: true, options: ['brokerage', 'team', 'independent', 'franchise'] },
      { field: 'cities', question: 'Which cities do you recruit in? (comma separated)', type: 'text', priority: 2, required: false },
      { field: 'states', question: 'Which states do you recruit in? (comma separated)', type: 'text', priority: 2, required: false },
      { field: 'zip_codes', question: 'Target ZIP codes? (comma separated)', type: 'text', priority: 3, required: false },
      { field: 'needs', question: 'What are your main recruiting needs?', type: 'textarea', priority: 2, required: false },
      { field: 'wants', question: 'What qualities do you want in agents?', type: 'textarea', priority: 3, required: false },
      { field: 'website_url', question: 'Company website URL?', type: 'url', priority: 3, required: false },
      { field: 'years_experience', question: 'How many years has your company been in business?', type: 'number', priority: 3, required: false }
    ];

    criticalFields.forEach(field => {
      const value = client[field.field];
      const isEmpty = !value || (Array.isArray(value) && value.length === 0) || value === '';
      
      if (isEmpty) {
        highPriorityQuestions.push({
          id: field.field,
          field_name: field.field,
          question_text: field.question,
          field_type: field.type,
          required: field.required,
          priority: field.priority,
          options: field.options
        });
      } else {
        completed.add(field.field);
      }
    });

    // Sort by priority
    highPriorityQuestions.sort((a, b) => a.priority - b.priority);
    
    setQuestions(highPriorityQuestions);
    setCompletedFields(completed);
  };

  const loadQuestionsForPro = async (pro: any) => {
    const highPriorityQuestions: Question[] = [];
    const completed = new Set<string>();

    // Check which fields are already filled
    const criticalFields = [
      { field: 'first_name', question: 'What is your first name?', type: 'text', priority: 1, required: true },
      { field: 'last_name', question: 'What is your last name?', type: 'text', priority: 1, required: true },
      { field: 'email', question: 'Your email address?', type: 'email', priority: 1, required: true },
      { field: 'phone', question: 'Your phone number?', type: 'tel', priority: 1, required: true },
      { field: 'pro_type', question: 'What type of professional are you?', type: 'select', priority: 1, required: true, options: ['real_estate_agent', 'loan_officer', 'both'] },
      { field: 'cities', question: 'Which cities do you work in? (comma separated)', type: 'text', priority: 2, required: false },
      { field: 'states', question: 'Which states are you licensed in? (comma separated)', type: 'text', priority: 2, required: false },
      { field: 'zip_codes', question: 'Target ZIP codes? (comma separated)', type: 'text', priority: 3, required: false },
      { field: 'experience', question: 'How many years of experience do you have?', type: 'number', priority: 2, required: false },
      { field: 'company', question: 'Current brokerage/company?', type: 'text', priority: 2, required: false },
      { field: 'wants', question: 'What are you looking for in your next opportunity?', type: 'textarea', priority: 2, required: false },
      { field: 'bio', question: 'Tell us about yourself', type: 'textarea', priority: 3, required: false },
      { field: 'specializations', question: 'What are your specializations? (comma separated)', type: 'text', priority: 3, required: false }
    ];

    criticalFields.forEach(field => {
      const value = pro[field.field];
      const isEmpty = !value || (Array.isArray(value) && value.length === 0) || value === '';
      
      if (isEmpty) {
        highPriorityQuestions.push({
          id: field.field,
          field_name: field.field,
          question_text: field.question,
          field_type: field.type,
          required: field.required,
          priority: field.priority,
          options: field.options
        });
      } else {
        completed.add(field.field);
      }
    });

    // Sort by priority
    highPriorityQuestions.sort((a, b) => a.priority - b.priority);
    
    setQuestions(highPriorityQuestions);
    setCompletedFields(completed);
  };

  const handleAnswerChange = (fieldName: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    
    if (currentQuestion.required && !answers[currentQuestion.field_name]) {
      toast({
        title: "Required field",
        description: "Please answer this question before continuing",
        variant: "destructive"
      });
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    const currentQuestion = questions[currentStep];
    
    if (currentQuestion.required) {
      toast({
        title: "Cannot skip",
        description: "This is a required field",
        variant: "destructive"
      });
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setSaving(true);

    try {
      if (!userProfile) throw new Error("No profile loaded");

      // Prepare update object
      const updateData: any = {};
      
      // Process answers
      Object.entries(answers).forEach(([field, value]) => {
        // Convert comma-separated strings to arrays for array fields
        if (['cities', 'states', 'zip_codes', 'specializations', 'skills', 'languages'].includes(field)) {
          if (typeof value === 'string') {
            updateData[field] = value.split(',').map(v => v.trim()).filter(v => v);
          } else {
            updateData[field] = value;
          }
        } else if (field === 'years_experience' || field === 'experience') {
          updateData[field] = parseInt(value) || null;
        } else {
          updateData[field] = value;
        }
      });

      // Update profile based on type
      if (userProfile.user_type === 'client') {
        const { error } = await supabase
          .from("clients")
          .update({
            ...updateData,
            profile_completed: true,
            onboarding_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq("id", userProfile.profile_id);

        if (error) throw error;

        toast({
          title: "Profile Updated! 🎉",
          description: "Your profile has been completed"
        });

        // Delay to ensure database update propagates
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Force a full page reload to ensure fresh data
        window.location.href = "/client";
      } else if (userProfile.user_type === 'pro') {
        const { error } = await supabase
          .from("pros")
          .update({
            ...updateData,
            profile_completed: true,
            onboarding_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq("id", userProfile.profile_id);

        if (error) throw error;

        toast({
          title: "Profile Updated! 🎉",
          description: "Your profile has been completed"
        });

        // Delay to ensure database update propagates
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Force a full page reload to ensure fresh data
        window.location.href = "/pro";
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your profile...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-center text-2xl">Profile Complete!</CardTitle>
            <CardDescription className="text-center">
              Your profile is fully set up. Let's get started!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate(userProfile?.user_type === 'client' ? '/office' : '/pro')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline">
              Question {currentStep + 1} of {questions.length}
            </Badge>
            <Badge variant={currentQuestion.required ? "destructive" : "secondary"}>
              {currentQuestion.required ? "Required" : "Optional"}
            </Badge>
          </div>
          <Progress value={progress} className="mb-4" />
          <CardTitle className="text-2xl">{currentQuestion.question_text}</CardTitle>
          <CardDescription>
            Help us understand your {userProfile?.user_type === 'client' ? 'recruiting needs' : 'professional goals'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Input */}
          <div className="space-y-2">
            <Label htmlFor={currentQuestion.field_name}>
              Your Answer {currentQuestion.required && <span className="text-destructive">*</span>}
            </Label>
            
            {currentQuestion.field_type === 'textarea' ? (
              <Textarea
                id={currentQuestion.field_name}
                value={answers[currentQuestion.field_name] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.field_name, e.target.value)}
                placeholder={currentQuestion.placeholder || "Type your answer here..."}
                rows={4}
                className="resize-none"
              />
            ) : currentQuestion.field_type === 'select' && currentQuestion.options ? (
              <select
                id={currentQuestion.field_name}
                value={answers[currentQuestion.field_name] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.field_name, e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select an option...</option>
                {currentQuestion.options.map(option => (
                  <option key={option} value={option}>
                    {option.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={currentQuestion.field_name}
                type={currentQuestion.field_type}
                value={answers[currentQuestion.field_name] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.field_name, e.target.value)}
                placeholder={currentQuestion.placeholder || "Type your answer here..."}
              />
            )}
          </div>

          {/* Completed Fields Summary */}
          {completedFields.size > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 font-medium mb-2">
                ✅ {completedFields.size} fields already completed
              </p>
              <p className="text-xs text-green-700">
                We're only asking about the fields you haven't filled out yet
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {!currentQuestion.required && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                >
                  Skip
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                disabled={saving}
                className="gap-2"
              >
                {currentStep === questions.length - 1 ? (
                  saving ? "Saving..." : "Complete"
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
