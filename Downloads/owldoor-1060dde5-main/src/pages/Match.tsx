import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useState } from "react";
import owlDoorLogo from "@/assets/owldoor-logo-light-green.png";
const Match = () => {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const totalQuestions = 11;
  const progress = currentQuestion / totalQuestions * 100;
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={owlDoorLogo} alt="OwlDoor" className="h-8" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/for-brokerages" className="text-sm text-foreground hover:text-primary transition-colors">
              For Teams
            </Link>
            <Link to="/for-agents" className="text-sm text-foreground hover:text-primary transition-colors">
              For Agents
            </Link>
          </nav>
          <ThemeSelector />
        </div>
      </header>

      {/* Progress Bar */}
      <div className="container mx-auto px-4 pt-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion} of {totalQuestions}
            </span>
            <span className="text-sm font-semibold text-primary">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 md:p-12">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Verify Your Phone Number </h1>
                <p className="text-lg text-foreground mb-2">
                  This is where we'll send your matches.
                </p>
                <p className="text-sm text-muted-foreground italic">
                  (Don't worry, your info is safe with us and won't be shared unless you agree)
                </p>
              </div>

              {/* Phone Number Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Phone Number <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 border border-input rounded-md bg-background min-w-[100px]">
                    <span className="text-xl">🇺🇸</span>
                    <span className="text-sm text-muted-foreground">+1</span>
                  </div>
                  <Input type="tel" placeholder="(555) 123-4567" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="flex-1" />
                  <Button size="lg" className="px-8">
                    Verify
                  </Button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 pt-4">
                <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={checked => setAgreedToTerms(checked as boolean)} className="mt-1" />
                <label htmlFor="terms" className="text-sm text-foreground leading-relaxed cursor-pointer">
                  By providing your phone number and checking this box, you agree to receive SMS messages from OwlDoor regarding real estate agent matching services. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe or HELP for help. View our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>, <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>, and <Link to="/sms-terms" className="text-primary hover:underline">SMS Terms</Link>.
                </label>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>;
};
export default Match;