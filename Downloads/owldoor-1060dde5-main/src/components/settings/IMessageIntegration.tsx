import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, RefreshCw, Download, ExternalLink, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function IMessageIntegration() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [secretToken, setSecretToken] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const [existingTokenId, setExistingTokenId] = useState<string | null>(null);

  const apiBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

  // Check for existing token on mount
  useEffect(() => {
    checkExistingToken();
  }, []);

  const checkExistingToken = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('imessage_secrets')
        .select('id, secret_token, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setHasToken(true);
        setExistingTokenId(data.id);
        // Don't show the actual token for security, just that it exists
      }
    } catch (error: any) {
      console.error("Error checking token:", error);
    }
  };

  const generateToken = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate random token
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Save to database
      const { data, error } = await supabase
        .from('imessage_secrets')
        .upsert({
          user_id: user.id,
          secret_token: token,
          device_id: deviceId || null,
          is_active: true
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      setSecretToken(token);
      setHasToken(true);
      setExistingTokenId(data.id);

      toast({
        title: "Token Generated",
        description: "Your iMessage integration token has been created. Copy it now - it won't be shown again.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const revokeToken = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('imessage_secrets')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) throw error;

      setSecretToken("");
      setHasToken(false);
      setExistingTokenId(null);

      toast({
        title: "Token Revoked",
        description: "Your iMessage integration has been disabled.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📱</span> iMessage Integration
        </CardTitle>
        <CardDescription>
          Send and receive iMessages directly through OwlDoor using Apple Shortcuts (no Twilio required)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasToken && !secretToken && (
          <Alert className="bg-green-500/10 border-green-500/50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              ✅ <strong>iMessage Integration Active!</strong> Your iMessage integration is already set up and ready to use.
              You can generate a new token below if needed.
            </AlertDescription>
          </Alert>
        )}
        
        <Alert>
          <AlertDescription>
            This integration uses Apple Shortcuts on your Mac or iPhone to sync iMessages with OwlDoor.
            Perfect for teams who prefer native messaging without SMS costs.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="device-id">Device ID (Your Phone Number)</Label>
            <div className="flex gap-2">
              <Input
                id="device-id"
                placeholder="+15555551234"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                disabled={hasToken}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Enter in E.164 format (e.g., +1 followed by 10 digits)
            </p>
          </div>

          {!hasToken ? (
            <Button onClick={generateToken} disabled={loading || !deviceId}>
              {loading ? "Generating..." : "Generate Secret Token"}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>API Base URL</Label>
                <div className="flex gap-2">
                  <Input value={apiBaseUrl} readOnly />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(apiBaseUrl, "API URL")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Secret Token</Label>
                <div className="flex gap-2">
                  <Input value={secretToken || "••••••••••••••••"} readOnly type="password" />
                  {secretToken && (
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(secretToken, "Secret Token")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {secretToken && (
                  <p className="text-sm text-yellow-600">
                    ⚠️ Save this token securely! It won't be shown again.
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={revokeToken} disabled={loading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Revoke & Generate New
                </Button>
                <Button variant="outline" asChild>
                  <a href="/docs/IMESSAGE_SHORTCUTS_SETUP.md" download>
                    <Download className="mr-2 h-4 w-4" />
                    Download Setup Guide
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-4 space-y-2">
          <h4 className="font-semibold">Next Steps:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Copy your API URL and Secret Token above</li>
            <li>Download and install the OwlDoor Shortcuts on your Mac/iPhone</li>
            <li>Run "OwlDoor Setup" and paste your credentials</li>
            <li>Test by sending a message to yourself</li>
            <li>Enable automation for hands-free operation</li>
          </ol>
          <Button variant="link" className="p-0 h-auto" asChild>
            <a href="/docs/IMESSAGE_SHORTCUTS_SETUP.md" target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Full Setup Documentation
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
