import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

const SendGridIntegration = () => {
  const [apiKey, setApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [useForClients, setUseForClients] = useState(true);
  const [useForAdmin, setUseForAdmin] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    checkExistingConfig();
  }, []);

  const checkExistingConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('email_configs')
        .select('*')
        .eq('provider', 'sendgrid')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setIsConfigured(true);
        const config = data.config as any;
        setFromEmail(config?.from_email || "");
        setFromName(config?.from_name || "");
        setUseForClients(data.use_for_clients ?? true);
        setUseForAdmin(data.use_for_admin ?? true);
      }
    } catch (error) {
      console.error('Error checking SendGrid config:', error);
    }
  };

  const saveSendGridConfig = async () => {
    if (!apiKey && !isConfigured) {
      toast({
        title: "Missing API Key",
        description: "Please enter your SendGrid API key",
        variant: "destructive",
      });
      return;
    }

    if (!fromEmail) {
      toast({
        title: "Missing From Email",
        description: "Please enter a sender email address",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const config: any = {
        from_email: fromEmail,
        from_name: fromName || "No Reply",
      };

      if (apiKey) {
        config.api_key = apiKey;
      }

      const { error } = await supabase.functions.invoke('save-sendgrid-config', {
        body: { 
          provider: 'sendgrid',
          config,
          use_for_clients: useForClients,
          use_for_admin: useForAdmin,
        },
      });

      if (error) throw error;

      toast({
        title: "SendGrid Configured",
        description: "Your SendGrid settings have been saved successfully.",
      });
      
      setIsConfigured(true);
      setApiKey("");
    } catch (error: any) {
      console.error('Error saving SendGrid config:', error);
      toast({
        title: "Configuration Failed",
        description: error.message || "Failed to save SendGrid configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address for the test",
        variant: "destructive",
      });
      return;
    }

    setIsSendingTest(true);
    try {
      console.log("=== Sending SendGrid Test Email ===");
      console.log("To:", testEmail);
      console.log("From Email:", fromEmail);
      console.log("From Name:", fromName);
      
      const { data, error } = await supabase.functions.invoke('send-email-sendgrid', {
        body: {
          to: testEmail,
          subject: "Test Email from OwlDoor",
          html: `
            <h1>SendGrid Test Email</h1>
            <p>This is a test email from your OwlDoor SendGrid integration.</p>
            <p>If you received this, your SendGrid configuration is working correctly!</p>
            <p><strong>Configuration Details:</strong></p>
            <ul>
              <li>From Email: ${fromEmail}</li>
              <li>From Name: ${fromName || "No Reply"}</li>
              <li>Sent at: ${new Date().toLocaleString()}</li>
            </ul>
          `,
          context: 'admin'
        },
      });

      console.log("=== SendGrid Response ===");
      console.log("Data:", data);
      console.log("Error:", error);

      if (error) {
        console.error("SendGrid error:", error);
        throw error;
      }

      toast({
        title: "Test Email Sent",
        description: `Check ${testEmail} for the test email`,
      });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <CardTitle>SendGrid Configuration</CardTitle>
        </div>
        <CardDescription>
          Configure SendGrid for sending transactional emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConfigured && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md">
            <CheckCircle2 className="h-4 w-4" />
            <span>SendGrid is configured and active</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="sendgrid-api-key">
            SendGrid API Key {isConfigured && "(leave blank to keep current)"}
          </Label>
          <Input
            id="sendgrid-api-key"
            type="password"
            placeholder="SG.xxxxxxxxxxxxxxxxxxxxx"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="from-email">From Email Address *</Label>
          <Input
            id="from-email"
            type="email"
            placeholder="noreply@yourdomain.com"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Must be a verified sender in your SendGrid account
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="from-name">From Name</Label>
          <Input
            id="from-name"
            type="text"
            placeholder="Your Company"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
          />
        </div>

        <div className="border-t pt-4 space-y-4">
          <Label className="text-sm font-medium">Usage Context</Label>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="use-for-clients" className="text-sm font-normal">
                Enable for Clients
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow client-initiated emails to use this provider
              </p>
            </div>
            <Switch
              id="use-for-clients"
              checked={useForClients}
              onCheckedChange={setUseForClients}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="use-for-admin" className="text-sm font-normal">
                Enable for Admin
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow admin-initiated emails to use this provider
              </p>
            </div>
            <Switch
              id="use-for-admin"
              checked={useForAdmin}
              onCheckedChange={setUseForAdmin}
            />
          </div>
        </div>

        <Button 
          onClick={saveSendGridConfig} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isConfigured ? "Update Configuration" : "Save Configuration"}
        </Button>

        {isConfigured && (
          <div className="border-t pt-4 space-y-3">
            <Label className="text-sm font-medium">Send Test Email</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <Button 
                onClick={sendTestEmail} 
                disabled={isSendingTest}
                variant="outline"
              >
                {isSendingTest ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send Test"
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Get your API key from SendGrid Dashboard → Settings → API Keys</p>
          <p>• Verify your sender email at SendGrid Dashboard → Settings → Sender Authentication</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SendGridIntegration;
