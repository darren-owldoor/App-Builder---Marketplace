import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, MessageSquare, PhoneOff, Info, Clock, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SMSOptIn = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">SMS Communication & Opt-In</h1>
          <p className="text-xl text-muted-foreground">
            Your guide to our text messaging program and your rights
          </p>
        </div>

        {/* What You'll Receive */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              <CardTitle>What You'll Receive</CardTitle>
            </div>
            <CardDescription>
              When you opt-in to our SMS communications, you may receive:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Real estate lead notifications and matching opportunities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Account updates and verification codes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Campaign follow-ups and appointment reminders</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Important service announcements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Promotional messages about our services (optional)</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Frequency */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <CardTitle>Message Frequency</CardTitle>
            </div>
            <CardDescription>
              How often you can expect to hear from us
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Message frequency varies based on your activity and preferences:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span><strong>Lead notifications:</strong> As new matches become available</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span><strong>Account updates:</strong> As needed for security and verification</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span><strong>Campaigns:</strong> Based on your configured campaign schedule</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span><strong>Promotional:</strong> Up to 4 messages per month (you can opt-out)</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* How to Opt-In */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>How to Opt-In</CardTitle>
            </div>
            <CardDescription>
              Ways to consent to receiving SMS messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">1. During Sign-Up</h4>
                <p>
                  When you create an account or sign up for our services, you'll be asked to provide 
                  your phone number and can opt-in to SMS communications by checking the consent box.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">2. Phone Verification</h4>
                <p>
                  When you verify your phone number, you'll receive a code via SMS. Completing 
                  this verification indicates your consent to receive transactional messages.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">3. Account Settings</h4>
                <p>
                  You can manage your SMS preferences at any time in your account settings dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How to Opt-Out */}
        <Card className="mb-6 border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PhoneOff className="w-5 h-5 text-destructive" />
              <CardTitle>How to Opt-Out (Unsubscribe)</CardTitle>
            </div>
            <CardDescription>
              You can stop receiving SMS messages at any time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-muted-foreground">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">Quick Opt-Out: Reply STOP</h4>
                <p>
                  Reply <strong className="text-foreground">STOP</strong>, <strong className="text-foreground">UNSUBSCRIBE</strong>, 
                  <strong className="text-foreground"> QUIT</strong>, or <strong className="text-foreground">CANCEL</strong> to 
                  any message to immediately opt-out of all SMS communications.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Other Methods:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Update your preferences in your account settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Contact our support team at <a href="/support" className="text-primary hover:underline">support</a></span>
                  </li>
                </ul>
              </div>
              <p className="text-sm">
                Note: After opting out, you may still receive important transactional messages 
                related to your account security or ongoing services.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Costs */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <CardTitle>Costs & Charges</CardTitle>
            </div>
            <CardDescription>
              What you need to know about SMS fees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 border rounded-lg p-4">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Message and data rates may apply.</strong> While 
                OwlDoor does not charge you to receive SMS messages, your mobile carrier's standard 
                messaging and data rates will apply. Contact your mobile carrier for details about 
                your specific plan.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Support */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Privacy & Support</CardTitle>
            <CardDescription>
              Your data is protected and help is available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We respect your privacy. Your phone number and SMS data are protected according to 
                our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> and 
                are never shared with third parties for marketing purposes.
              </p>
              <p>
                For help or questions about SMS communications, reply <strong className="text-foreground">HELP</strong> to 
                any message, or contact our support team:
              </p>
              <div className="bg-muted/50 border rounded-lg p-4">
                <ul className="space-y-2">
                  <li>
                    <strong className="text-foreground">Support Page:</strong>{" "}
                    <Link to="/support" className="text-primary hover:underline">
                      OwlDoor Support
                    </Link>
                  </li>
                  <li>
                    <strong className="text-foreground">Terms:</strong>{" "}
                    <Link to="/terms-of-service" className="text-primary hover:underline">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <strong className="text-foreground">Privacy:</strong>{" "}
                    <Link to="/privacy-policy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Notice */}
        <Card className="border-muted">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              By providing your phone number and opting in to SMS communications, you consent to 
              receive text messages from OwlDoor at the number provided. Consent is not a condition 
              of purchase. Message and data rates may apply. Message frequency varies. Reply STOP 
              to opt-out at any time. Reply HELP for help.
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button asChild variant="outline">
            <Link to="/">Return Home</Link>
          </Button>
          <Button asChild>
            <Link to="/support">Contact Support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SMSOptIn;
