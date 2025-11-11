import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const SMSTerms = () => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-4">OwlDoor SMS Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Effective Date: {currentDate}
        </p>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground">
            By opting in to receive SMS messages from OwlDoor (toll-free number: <strong>+1-888-888-8253</strong>), 
            you agree to the following terms:
          </p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. SERVICE DESCRIPTION</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>We provide real estate agent matching notifications via SMS</li>
              <li>Messages include: match alerts, appointment reminders, and service updates</li>
              <li>Message frequency: 2-5 messages per week (varies based on your activity)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. OPT-IN METHODS</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Website form submission at owldoor.com</li>
              <li>Texting START to 888-888-8253</li>
              <li>Verbal consent recorded during phone calls</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. OPT-OUT INSTRUCTIONS</h2>
            <p className="text-muted-foreground mb-4">
              You can opt-out at any time using any of the following methods:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Text STOP to 888-888-8253 at any time</li>
              <li>Call 888-888-8253 and request removal</li>
              <li>Email support@owldoor.com</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. SUPPORT</h2>
            <p className="text-muted-foreground mb-4">
              Need help? Contact us through any of these channels:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Text HELP to 888-888-8253</li>
              <li>Email: <a href="mailto:support@owldoor.com" className="text-primary hover:underline">support@owldoor.com</a></li>
              <li>Phone: <a href="tel:+18888888253" className="text-primary hover:underline">888-888-8253</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. MESSAGE AND DATA RATES</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Standard message and data rates may apply</li>
              <li>OwlDoor does not charge for SMS messages</li>
              <li>Check with your carrier for your plan details</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. PRIVACY</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>We will never sell or share your phone number</li>
              <li>Messages are only sent for service-related purposes</li>
              <li>See our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> for data handling practices</li>
            </ul>
          </section>

          <section className="bg-muted/30 p-6 rounded-lg border border-border">
            <h3 className="text-xl font-semibold mb-3">Sample Messages</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium mb-1">Welcome Message:</p>
                <p className="text-muted-foreground italic">
                  "Welcome to OwlDoor! You'll receive agent match alerts to this number. Reply STOP to unsubscribe or HELP for support. Msg&data rates may apply."
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Match Alert:</p>
                <p className="text-muted-foreground italic">
                  "OwlDoor Alert: 3 new agents match your criteria in San Diego. Log in to view matches: owldoor.com/matches Reply STOP to unsubscribe"
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Appointment Reminder:</p>
                <p className="text-muted-foreground italic">
                  "OwlDoor Reminder: Your consultation with John Smith is tomorrow at 2 PM. Need to reschedule? Reply or call 888-888-8253"
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p className="text-muted-foreground">
              If you have any questions about these SMS Terms of Service, please contact us at{" "}
              <a href="mailto:support@owldoor.com" className="text-primary hover:underline">support@owldoor.com</a> or 
              call <a href="tel:+18888888253" className="text-primary hover:underline">888-888-8253</a>.
            </p>
          </section>

          <p className="text-sm text-muted-foreground italic mt-12 pt-8 border-t border-border">
            Last Updated: {currentDate}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SMSTerms;
