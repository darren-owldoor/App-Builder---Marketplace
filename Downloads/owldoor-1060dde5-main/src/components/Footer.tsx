import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemeSelector } from "@/components/ThemeSelector";
import cookieImage from "@/assets/cookie-image.svg";
import footerLogo from "@/assets/owldoor-logo-footer.png";

const Footer = () => {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [cookiesOpen, setCookiesOpen] = useState(false);

  return (
    <>
      <footer className="bg-black border-t border-white/10 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
            {/* Main Pages */}
            <div>
              <h3 className="font-semibold text-white mb-4">Main Pages</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-white/80 hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/for-agents" className="text-white/80 hover:text-white transition-colors">For Agents</Link></li>
                <li><Link to="/for-brokerages" className="text-white/80 hover:text-white transition-colors">For Brokerages</Link></li>
                <li><Link to="/apply" className="text-white/80 hover:text-white transition-colors">Apply</Link></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="font-semibold text-white mb-4">Services</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/for-brokerages" className="text-white/80 hover:text-white transition-colors">Recruiting</Link></li>
                <li><a href="https://recruit.owldoor.com/coaching/" className="text-white/80 hover:text-white transition-colors">Coaching</a></li>
                <li><a href="https://recruit.owldoor.com/ai-tools/" className="text-white/80 hover:text-white transition-colors">AI Tools</a></li>
                <li><a href="https://recruit.owldoor.com/mortgage/" className="text-white/80 hover:text-white transition-colors">Mortgage</a></li>
              </ul>
            </div>

            {/* Knowledge Base */}
            <div>
              <h3 className="font-semibold text-white mb-4">Knowledge Base</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/blog" className="text-white/80 hover:text-white transition-colors">Blog</Link></li>
                <li><a href="https://recruit.owldoor.com/alternatives/" className="text-white/80 hover:text-white transition-colors">Alternatives</a></li>
                <li><a href="https://recruit.owldoor.com/videos/" className="text-white/80 hover:text-white transition-colors">Videos</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/our-team" className="text-white/80 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/story" className="text-white/80 hover:text-white transition-colors">Our Story</Link></li>
                <li><a href="https://recruit.owldoor.com/careers/" className="text-white/80 hover:text-white transition-colors">Careers</a></li>
                <li><a href="https://recruit.owldoor.com/contact/" className="text-white/80 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/privacy-policy" className="text-white/80 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms-of-service" className="text-white/80 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/sms-terms" className="text-white/80 hover:text-white transition-colors">
                    SMS Terms
                  </Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="text-white/80 hover:text-white transition-colors">
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => setCookiesOpen(true)}
                    className="text-white/80 hover:text-white transition-colors text-left"
                  >
                    Cookies Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <img src={footerLogo} alt="OwlDoor" className="h-8" />
              </div>
              <div className="flex items-center gap-4">
                <ThemeSelector />
                <div className="text-sm text-white/80">
                  © {new Date().getFullYear()} OwlDoor. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Dialog */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Privacy Policy</DialogTitle>
            <DialogDescription className="text-base">
              Last updated: {new Date().toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Information We Collect</h3>
              <p className="text-muted-foreground">
                We collect information you provide directly to us, including name, email address, 
                phone number, and professional information related to real estate services.
              </p>
            </section>
            <section>
              <h3 className="font-semibold text-base mb-2">2. How We Use Your Information</h3>
              <p className="text-muted-foreground">
                We use the information we collect to provide, maintain, and improve our services, 
                to match agents with brokerages, and to communicate with you about our services.
              </p>
            </section>
            <section>
              <h3 className="font-semibold text-base mb-2">3. Information Sharing</h3>
              <p className="text-muted-foreground">
                We do not sell your personal information. We may share your information with 
                brokerages or agents as part of our matching service, with your consent.
              </p>
            </section>
            <section>
              <h3 className="font-semibold text-base mb-2">4. Data Security</h3>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to protect your 
                personal information against unauthorized access, alteration, or destruction.
              </p>
            </section>
            <section>
              <h3 className="font-semibold text-base mb-2">5. Your Rights</h3>
              <p className="text-muted-foreground">
                You have the right to access, correct, or delete your personal information. 
                Contact us to exercise these rights.
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Dialog */}
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Terms of Service</DialogTitle>
            <DialogDescription className="text-base">
              Last updated: {new Date().toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground">
                By accessing and using OwlDoor, you accept and agree to be bound by these Terms of Service.
              </p>
            </section>
            <section>
              <h3 className="font-semibold text-base mb-2">2. Use of Service</h3>
              <p className="text-muted-foreground">
                OwlDoor provides a platform to connect real estate agents with brokerages. 
                You agree to use the service only for lawful purposes and in accordance with these terms.
              </p>
            </section>
            <section>
              <h3 className="font-semibold text-base mb-2">3. User Accounts</h3>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account credentials 
                and for all activities under your account.
              </p>
            </section>
            <section>
              <h3 className="font-semibold text-base mb-2">4. Intellectual Property</h3>
              <p className="text-muted-foreground">
                All content, features, and functionality of OwlDoor are owned by us and are protected 
                by copyright, trademark, and other intellectual property laws.
              </p>
            </section>
            <section>
              <h3 className="font-semibold text-base mb-2">5. Limitation of Liability</h3>
              <p className="text-muted-foreground">
                OwlDoor shall not be liable for any indirect, incidental, special, consequential, 
                or punitive damages resulting from your use of the service.
              </p>
            </section>
            <section>
              <h3 className="font-semibold text-base mb-2">6. Termination</h3>
              <p className="text-muted-foreground">
                We may terminate or suspend your access to our service immediately, without prior 
                notice, for any reason, including breach of these Terms.
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cookies Policy Dialog */}
      <Dialog open={cookiesOpen} onOpenChange={setCookiesOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">OwlDoor Cookie Policy</DialogTitle>
            <DialogDescription className="text-base">
              We use the Good Kind of Cookies
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center py-4">
              <img src={cookieImage} alt="Cookie" className="w-32 h-32" />
            </div>
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold text-base mb-2">What Are Cookies?</h3>
                <p className="text-muted-foreground">
                  Cookies are small text files that are stored on your device when you visit our website. 
                  They help us provide you with a better experience and allow certain features to work properly.
                </p>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-2">How We Use Cookies</h3>
                <p className="text-muted-foreground mb-2">We use cookies to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Remember your preferences and settings</li>
                  <li>Understand how you use our service</li>
                  <li>Improve your experience on our platform</li>
                  <li>Keep your account secure</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-2">Types of Cookies We Use</h3>
                <div className="space-y-2">
                  <div>
                    <p className="font-medium">Essential Cookies</p>
                    <p className="text-muted-foreground">Required for the website to function properly</p>
                  </div>
                  <div>
                    <p className="font-medium">Performance Cookies</p>
                    <p className="text-muted-foreground">Help us understand how visitors interact with our website</p>
                  </div>
                  <div>
                    <p className="font-medium">Functional Cookies</p>
                    <p className="text-muted-foreground">Remember your preferences and personalize your experience</p>
                  </div>
                </div>
              </section>
              <section>
                <h3 className="font-semibold text-base mb-2">Managing Cookies</h3>
                <p className="text-muted-foreground">
                  You can control and manage cookies through your browser settings. However, 
                  disabling cookies may affect the functionality of our service.
                </p>
              </section>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Footer;
