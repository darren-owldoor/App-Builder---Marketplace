import { Shield, CheckCircle, AlertTriangle, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

const RefundPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Shield className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Refund Policy
            </h1>
            <p className="text-lg text-muted-foreground">
              Our commitment to quality and fair business practices
            </p>
          </div>

          {/* Guaranteed Refunds Section */}
          <Card className="mb-8 border-2 border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Guaranteed Full Refunds</CardTitle>
              </div>
              <CardDescription className="text-base">
                We guarantee a 100% refund in the following situations:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Fake Candidate Information
                  </h3>
                  <p className="text-muted-foreground">
                    If you discover that the candidate provided fabricated credentials, false employment history, 
                    or misrepresented their qualifications, you are entitled to a full refund with no questions asked.
                  </p>
                </div>

                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    False Information Provided
                  </h3>
                  <p className="text-muted-foreground">
                    If any critical information about the candidate (contact details, licensing status, production 
                    numbers, availability) is proven to be false or intentionally misleading, we will issue an immediate 
                    full refund.
                  </p>
                </div>

                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Duplicate Candidates
                  </h3>
                  <p className="text-muted-foreground">
                    If we accidentally provide you with a candidate you've already been charged for, or someone you've 
                    already been in contact with through our platform, we will refund the duplicate charge immediately.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Case-by-Case Refunds Section */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                <CardTitle className="text-2xl">Case-by-Case Review Refunds</CardTitle>
              </div>
              <CardDescription className="text-base">
                The following situations may qualify for refunds, subject to review:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-2">Quality Concerns</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    If the candidate's qualifications significantly deviate from what was promised or described, 
                    we will review your case for a potential partial or full refund.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Examples: Candidate lacks stated experience, credentials not as described, or skill level misrepresented
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-2">Unresponsive Candidates</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    If a candidate with a scheduled appointment fails to respond or show up without valid reason, 
                    we may offer a partial refund or credit toward your next candidate.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Must be reported within 48 hours of scheduled appointment
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-2">System or Platform Errors</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    If you were charged incorrectly due to a technical error on our platform, or received incomplete 
                    candidate information due to system issues, we will review and resolve promptly.
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-2">Extraordinary Circumstances</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    We understand that unique situations arise. If you believe you qualify for a refund due to 
                    circumstances beyond what's listed, please reach out. We review each case individually.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Non-Refundable Situations */}
          <Card className="mb-8 border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="text-xl">Non-Refundable Situations</CardTitle>
              <CardDescription>
                Please note that refunds are generally not provided in these cases:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Candidate accepts position with another brokerage after introduction</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Cultural or personality fit concerns (subjective preferences)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Candidate's compensation expectations don't align with your offer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Change in your recruiting needs after candidate introduction</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Candidate declines after legitimate interview or conversation</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Refund Process */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">How to Request a Refund</CardTitle>
              <CardDescription>
                Our refund request process is straightforward:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Submit Your Request</h3>
                    <p className="text-sm text-muted-foreground">
                      Contact our support team via email or through your dashboard with details about the candidate 
                      and reason for the refund request.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Provide Documentation</h3>
                    <p className="text-sm text-muted-foreground">
                      Share any relevant evidence (emails, screenshots, documentation) that supports your refund claim.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Review Period</h3>
                    <p className="text-sm text-muted-foreground">
                      We will review your case within 2-3 business days and respond with our decision and next steps.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Resolution</h3>
                    <p className="text-sm text-muted-foreground">
                      Approved refunds are processed within 5-7 business days to your original payment method or 
                      as account credit.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20">
            <CardContent className="pt-8 pb-8 text-center">
              <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3">Questions About Refunds?</h2>
              <p className="text-muted-foreground mb-6">
                Our support team is here to help. Contact us for any refund-related inquiries.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  onClick={() => navigate("/support")}
                >
                  Contact Support
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/pricing")}
                >
                  View Pricing
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Last Updated */}
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>Last Updated: January 2025</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RefundPolicy;
