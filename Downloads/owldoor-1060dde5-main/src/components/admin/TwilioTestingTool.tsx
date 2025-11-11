import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Send, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function TwilioTestingTool() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("This is a test message from OwlDoor CRM.");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const sendTestSMS = async () => {
    if (!phoneNumber || !message) {
      toast.error("Please enter both phone number and message");
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("send-test-sms", {
        body: {
          to: phoneNumber,
          message: message,
        },
      });

      if (error) throw error;

      setResult({
        success: true,
        data,
      });
      toast.success("Test SMS sent successfully!");
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
      });
      toast.error("Failed to send test SMS");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Twilio SMS Testing Tool</h2>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1234567890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Include country code (e.g., +1 for US)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            placeholder="Enter your test message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            {message.length} characters
          </p>
        </div>

        <Button 
          onClick={sendTestSMS} 
          disabled={testing || !phoneNumber || !message}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Test SMS
            </>
          )}
        </Button>
      </Card>

      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          <div className="flex items-start gap-2">
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
            )}
            <div className="flex-1 space-y-2">
              <div className="font-semibold">
                {result.success ? "✅ Success" : "❌ Failed"}
              </div>
              <AlertDescription className="text-sm">
                {result.success ? (
                  <div className="space-y-2">
                    <div>Message sent successfully!</div>
                    {result.data?.sid && (
                      <div className="font-mono text-xs">
                        <Badge variant="outline">SID: {result.data.sid}</Badge>
                      </div>
                    )}
                    {result.data?.status && (
                      <div>
                        <Badge>{result.data.status}</Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-semibold">Error:</div>
                    <div className="font-mono text-xs break-words">
                      {result.error}
                    </div>
                  </div>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      <Card className="p-4 bg-muted">
        <h3 className="font-semibold mb-2">Testing Tips</h3>
        <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
          <li>Verify phone numbers are in E.164 format (+1XXXXXXXXXX)</li>
          <li>Test with your own verified number first</li>
          <li>Check Twilio console for delivery status</li>
          <li>Rate limit: 10 test messages per hour per user</li>
        </ul>
      </Card>
    </div>
  );
}
