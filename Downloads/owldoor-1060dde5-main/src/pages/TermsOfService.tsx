import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using this service, you accept and agree to be bound by the terms and provision 
              of this agreement. If you do not agree to these terms, you should not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Use of Service</h2>
            <p className="text-muted-foreground mb-4">
              You agree to use the service only for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Use the service in any way that violates any applicable law or regulation</li>
              <li>Engage in any conduct that restricts or inhibits anyone's use of the service</li>
              <li>Attempt to interfere with the proper working of the service</li>
              <li>Use any automated system to access the service</li>
              <li>Impersonate or attempt to impersonate the company or another user</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">User Accounts</h2>
            <p className="text-muted-foreground">
              When you create an account with us, you must provide accurate, complete, and current information. 
              You are responsible for safeguarding your account credentials and for any activities or actions under 
              your account. You must notify us immediately of any breach of security or unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
            <p className="text-muted-foreground">
              The service and its original content, features, and functionality are and will remain the exclusive 
              property of the company and its licensors. The service is protected by copyright, trademark, and other 
              laws. Our trademarks may not be used in connection with any product or service without prior written 
              consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Content</h2>
            <p className="text-muted-foreground">
              Our service may allow you to post, link, store, share, and otherwise make available certain information, 
              text, graphics, or other material. You are responsible for the content that you post on or through the 
              service, including its legality, reliability, and appropriateness.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground">
              In no event shall the company, nor its directors, employees, partners, agents, suppliers, or affiliates, 
              be liable for any indirect, incidental, special, consequential or punitive damages, including without 
              limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access 
              to or use of or inability to access or use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Disclaimer</h2>
            <p className="text-muted-foreground">
              Your use of the service is at your sole risk. The service is provided on an "AS IS" and "AS AVAILABLE" 
              basis. The service is provided without warranties of any kind, whether express or implied, including, 
              but not limited to, implied warranties of merchantability, fitness for a particular purpose, 
              non-infringement or course of performance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason 
              whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use 
              the service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which 
              the company operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will 
              try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material 
              change will be determined at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us at legal@owldoor.com.
            </p>
          </section>

          <p className="text-sm text-muted-foreground italic mt-12">
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
