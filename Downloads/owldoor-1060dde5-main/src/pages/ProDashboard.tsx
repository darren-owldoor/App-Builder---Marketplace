import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Settings, Lock, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import owlDoorLogo from "@/assets/owldoor-logo-new.png";
import { CalendarIntegration } from "@/components/agent/CalendarIntegration";
import { useDashboard } from "@/hooks/useDashboard";
import { QuestionModal } from "@/components/pro/QuestionModal";
import { TeamInviteModal } from "@/components/pro/TeamInviteModal";
import { CoverageDisplay } from "@/components/pro/CoverageDisplay";
import { MarketCoverageModal } from "@/components/pro/MarketCoverageModal";
import { WantsSelectionModal } from "@/components/pro/WantsSelectionModal";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingModal } from "@/components/OnboardingModal";
import { CoverageSyncBanner } from "@/components/agent/CoverageSyncBanner";

const ProDashboard = () => {
  const navigate = useNavigate();
  const { pro, matches, profileCompletion, loading, updateField } = useDashboard();
  
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showTeamInvite, setShowTeamInvite] = useState(false);
  const [showCoverageModal, setShowCoverageModal] = useState(false);
  const [showWantsModal, setShowWantsModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    if (profileCompletion?.next) {
      setCurrentQuestion(profileCompletion.next);
    }
  }, [profileCompletion]);

  const checkOnboardingStatus = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      navigate("/auth");
      return;
    }

    setUser(authUser);

    // Check if onboarding has been completed
    const { data: proData } = await supabase
      .from("pros")
      .select("onboarding_completed")
      .eq("user_id", authUser.id)
      .single();

    if (proData && proData.onboarding_completed !== true) {
      setShowOnboarding(true);
    }
  };

  const handleAnswerQuestion = async (answer: any) => {
    if (!currentQuestion || isUpdating) return;

    setIsUpdating(true);
    setShowQuestionModal(false);
    
    try {
      await updateField(currentQuestion.field, answer.value);
      // updateField already calls refresh() which updates profileCompletion
      // The useEffect watching profileCompletion will update currentQuestion
    } catch (error) {
      console.error('Error updating field:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveWants = async (selectedWants: string[]) => {
    setIsUpdating(true);
    setShowWantsModal(false);
    
    try {
      await updateField('wants', selectedWants);
    } catch (error) {
      console.error('Error updating wants:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenWantsModal = () => {
    setShowWantsModal(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleTeamInviteClick = () => {
    setShowTeamInvite(true);
  };

  const handleTeamInviteInterested = () => {
    setShowTeamInvite(false);
    // Show question modal with unanswered questions
    if (currentQuestion) {
      setShowQuestionModal(true);
    }
  };

  const userName = pro?.first_name || "User";
  const completion = profileCompletion?.completion || 0;
  const isProfileComplete = completion >= 75;
  
  const offeringCards = [
    { company: "Keller Williams", match: 95, location: "San Diego" },
    { company: "RE/MAX", match: 92, location: "Los Angeles" },
    { company: "Compass", match: 88, location: "Orange County" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/pro">
              <img src={owlDoorLogo} alt="OwlDoor" className="h-12 cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Agent Dashboard</h1>
              <p className="text-sm text-muted-foreground">Your Brokerage Matches</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Coverage Sync Banner - Show to agents with legacy coverage */}
        <CoverageSyncBanner />
        
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Profile Completion Card */}
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Hi {userName}, Let's Finish Up</h2>
              <Card className="bg-primary-foreground/10 backdrop-blur border-primary-foreground/20">
                <CardContent className="p-6">
                  <p className="text-sm mb-4 text-primary-foreground/90">
                    Your profile is {completion}% Done. Complete in 1-2 Minutes
                  </p>
                  
                  {currentQuestion ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-primary-foreground">{currentQuestion.question}</h3>
                        <span className="text-xs text-primary-foreground/80 bg-primary-foreground/20 px-2 py-1 rounded-full">
                          {currentQuestion.timeEstimate}
                        </span>
                      </div>
                      
                      {currentQuestion.requiresModal || (currentQuestion.options && currentQuestion.options.length === 0) ? (
                        <Button
                          className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold text-lg py-6 transition-all hover:scale-[1.02]"
                          onClick={handleOpenWantsModal}
                          disabled={isUpdating}
                        >
                          Select Your Preferences →
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          {currentQuestion.options?.map((option: any, index: number) => (
                            <Button
                              key={index}
                              className="w-full bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground font-semibold text-lg py-6 disabled:opacity-50 transition-all hover:scale-[1.02]"
                              onClick={() => handleAnswerQuestion(option)}
                              disabled={isUpdating}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-lg font-semibold text-primary-foreground mb-2">🎉 Profile Complete!</p>
                      <p className="text-sm text-primary-foreground/80 mb-4">You've unlocked all premium features</p>
                      <Button
                        className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold"
                        onClick={() => navigate("/edit-agent-profile")}
                      >
                        View Full Profile
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Local Offerings */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Some Local Offerings</h2>
            <div className="grid grid-cols-3 gap-4">
              {offeringCards.map((offering, index) => (
                <Card 
                  key={index} 
                  className="aspect-square relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => !isProfileComplete && navigate("/edit-agent-profile")}
                >
                  <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center relative">
                    {!isProfileComplete ? (
                      <>
                        {/* Real blurred content */}
                        <div className="absolute inset-0 opacity-80" style={{ filter: 'blur(12px)' }}>
                          <div className="p-4 h-full flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/60 to-primary/40 mx-auto mb-2" />
                            <div className="h-4 bg-muted/80 rounded mb-2 w-3/4" />
                            <div className="h-3 bg-muted/60 rounded mb-1 w-1/2" />
                            <div className="h-3 bg-muted/60 rounded w-2/3" />
                          </div>
                        </div>
                        
                        {/* Match badge */}
                        <Badge className="absolute top-2 right-2 bg-success text-white border-0 z-10 shadow-md">
                          {offering.match}% Match
                        </Badge>
                        
                        {/* Lock overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-background/60 backdrop-blur-sm">
                          <div className="bg-background/90 rounded-2xl p-4 text-center max-w-[90%]">
                            <Lock className="w-10 h-10 text-primary mb-2 mx-auto" />
                            <p className="text-xs font-semibold text-foreground mb-3">Complete {75 - completion}% more to unlock</p>
                            <Button 
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate("/edit-agent-profile");
                              }}
                            >
                              Complete Profile
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col">
                        <Badge className="absolute top-2 right-2 bg-success text-white border-0">
                          {offering.match}% Match
                        </Badge>
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 mx-auto mb-3 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary-foreground">{offering.company.charAt(0)}</span>
                        </div>
                        <h4 className="font-bold text-lg text-foreground mb-1">{offering.company}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{offering.location}</p>
                        <Button variant="outline" size="sm" className="mt-auto">View Details</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Updates and Notifications */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Updates and Notifications</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Brokerages and teams interested in recruiting you
              </p>
              <Card className="bg-success/10 border-success/30">
                <CardContent className="p-4">
                  <div className="mb-4">
                    <h4 className="font-bold text-lg mb-2">Keller Williams</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4" />
                      <span>San Diego, CA</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">3,000+</div>
                      <div className="text-xs text-muted-foreground">Sales/Year</div>
                    </div>
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">12</div>
                      <div className="text-xs text-muted-foreground">Avg. Agent Sales</div>
                    </div>
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">90%</div>
                      <div className="text-xs text-muted-foreground">Commission Split</div>
                    </div>
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">$0</div>
                      <div className="text-xs text-muted-foreground">Monthly Fees</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                    >
                      Learn More
                    </Button>
                    <Button 
                      className="flex-1 bg-success hover:bg-success/90 text-white"
                    >
                      I'm Interested
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Coverage and Preferences */}
          <div className="space-y-6">
            <CoverageDisplay 
              coverage={pro?.zip_codes || null} 
              proId={pro?.id || ''} 
              onAddCoverage={() => setShowCoverageModal(true)}
            />
            
            {/* Coverage Areas */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">My Coverage Areas</h3>
                <div className="grid grid-cols-2 gap-2">
                  {pro?.zip_codes && pro.zip_codes.length > 0 ? (
                    pro.zip_codes.slice(0, 6).map((area: string, idx: number) => (
                      <Button 
                        key={idx} 
                        variant="outline" 
                        size="sm"
                        className="hover:bg-accent hover:text-accent-foreground"
                        onClick={() => navigate("/market-coverage")}
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {area}
                      </Button>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-4 text-sm text-muted-foreground">
                      No coverage areas set
                    </div>
                  )}
                </div>
                {pro?.zip_codes && pro.zip_codes.length > 6 && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => navigate("/market-coverage")}
                  >
                    +{pro.zip_codes.length - 6} more areas
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Calendar and Quick Links */}
          <div className="space-y-6">
            <CalendarIntegration />

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Quick Links and Shortcuts</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => navigate("/edit-agent-profile")}>
                    👤 My Profile
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/market-coverage")}>
                    🎯 Preferences
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/settings")}>
                    ⚙️ Settings
                  </Button>
                  <Button variant="outline">
                    💬 Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Your Matches Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">Your Matches</h2>
            {isProfileComplete ? (
              <p className="text-muted-foreground">Your personalized matches will appear here once available.</p>
            ) : (
              <div className="text-center py-8">
                <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Complete Your Profile to See Matches</h3>
                <p className="text-muted-foreground mb-6">You're {75 - completion}% away from unlocking premium matches</p>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setShowQuestionModal(true)}
                >
                  Continue Profile Setup
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      <QuestionModal
        open={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        question={currentQuestion}
        onAnswer={handleAnswerQuestion}
        isUpdating={isUpdating}
      />

      <TeamInviteModal
        open={showTeamInvite}
        onClose={() => setShowTeamInvite(false)}
        onQuestionPrompt={handleTeamInviteInterested}
      />

      <MarketCoverageModal
        open={showCoverageModal}
        onOpenChange={setShowCoverageModal}
      />

      <WantsSelectionModal
        open={showWantsModal}
        onClose={() => setShowWantsModal(false)}
        onSave={handleSaveWants}
        currentWants={pro?.wants || []}
        isUpdating={isUpdating}
      />

      <OnboardingModal
        open={showOnboarding}
        onComplete={() => {
          setShowOnboarding(false);
          window.location.reload(); // Refresh to load updated data
        }}
        userType="pro"
        userId={user?.id || ""}
        profileData={pro}
      />
    </div>
  );
};

export default ProDashboard;
