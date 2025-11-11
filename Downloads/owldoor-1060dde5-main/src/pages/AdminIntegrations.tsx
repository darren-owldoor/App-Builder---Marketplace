import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SMSIntegrations from "@/components/admin/SMSIntegrations";
import { ZapierIntegration } from "@/components/admin/ZapierIntegration";
import PaymentIntegrations from "@/components/admin/PaymentIntegrations";
import SendGridIntegration from "@/components/admin/SendGridIntegration";
import { PDLEnrichment } from "@/components/admin/PDLEnrichment";
import { PDLIntegration } from "@/components/admin/PDLIntegration";
import { ClaudeDataAssistant } from "@/components/admin/ClaudeDataAssistant";
import { WebhookTester } from "@/components/admin/WebhookTester";
import TwilioAccountsManager from "@/components/admin/TwilioAccountsManager";
import PhoneNumbersManager from "@/components/admin/PhoneNumbersManager";
import PaymentProviderManager from "@/components/admin/PaymentProviderManager";
import owlDoorLogo from "@/assets/owldoor-logo-light-green.png";

const AdminIntegrations = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <img src={owlDoorLogo} alt="OwlDoor" className="h-12 cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
              <p className="text-sm text-muted-foreground">Manage your third-party integrations</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="sms" className="w-full">
          <TabsList className="grid w-full max-w-4xl grid-cols-8">
            <TabsTrigger value="sms">SMS</TabsTrigger>
            <TabsTrigger value="phone-numbers">Phone #s</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="zapier">Zapier</TabsTrigger>
            <TabsTrigger value="pdl">Data Enrich</TabsTrigger>
            <TabsTrigger value="claude">AI Chat</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sms" className="mt-6">
            <SMSIntegrations />
          </TabsContent>

          <TabsContent value="phone-numbers" className="mt-6">
            <div className="space-y-6">
              <TwilioAccountsManager />
              <PhoneNumbersManager />
            </div>
          </TabsContent>
          
          <TabsContent value="email" className="mt-6">
            <SendGridIntegration />
          </TabsContent>
          
          <TabsContent value="payments" className="mt-6">
            <div className="space-y-6">
              <PaymentProviderManager />
              <PaymentIntegrations />
            </div>
          </TabsContent>
          
          <TabsContent value="zapier" className="mt-6">
            <ZapierIntegration />
          </TabsContent>
          
          <TabsContent value="pdl" className="mt-6">
            <div className="space-y-6">
              <PDLIntegration />
              <PDLEnrichment />
            </div>
          </TabsContent>
          
          <TabsContent value="claude" className="mt-6">
            <ClaudeDataAssistant />
          </TabsContent>

          <TabsContent value="webhooks" className="mt-6">
            <WebhookTester />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminIntegrations;
