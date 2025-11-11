import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquare, CheckCircle2, XCircle, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SMSProvider {
  id: string;
  provider_type: string;
  provider_name: string;
  is_active: boolean;
  is_default: boolean;
  priority: number;
  config_data: any;
  use_for_clients: boolean;
  use_for_admin: boolean;
  created_at: string;
  updated_at: string;
}

const SMSIntegrations = () => {
  const [providers, setProviders] = useState<SMSProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [testNumber, setTestNumber] = useState("");
  const [testMessage, setTestMessage] = useState("Test message from OwlDoor");
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("sms_provider_configs")
        .select("*")
        .order("priority", { ascending: true });

      if (error) throw error;
      setProviders(data || []);
    } catch (error: any) {
      toast.error("Failed to load SMS providers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProvider = async (provider: SMSProvider) => {
    try {
      const { error } = await supabase
        .from("sms_provider_configs")
        .update({ is_active: !provider.is_active })
        .eq("id", provider.id);

      if (error) throw error;
      toast.success(`${provider.provider_name} ${!provider.is_active ? 'enabled' : 'disabled'}`);
      fetchProviders();
    } catch (error: any) {
      toast.error("Failed to update provider");
      console.error(error);
    }
  };

  const toggleUsageContext = async (provider: SMSProvider, context: 'clients' | 'admin') => {
    try {
      const field = context === 'clients' ? 'use_for_clients' : 'use_for_admin';
      const currentValue = context === 'clients' ? provider.use_for_clients : provider.use_for_admin;
      
      const { error } = await supabase
        .from("sms_provider_configs")
        .update({ [field]: !currentValue })
        .eq("id", provider.id);

      if (error) throw error;
      toast.success(`${provider.provider_name} ${context} usage ${!currentValue ? 'enabled' : 'disabled'}`);
      fetchProviders();
    } catch (error: any) {
      toast.error("Failed to update usage context");
      console.error(error);
    }
  };

  const setDefaultProvider = async (provider: SMSProvider) => {
    try {
      // First, remove default from all providers
      await supabase
        .from("sms_provider_configs")
        .update({ is_default: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      // Then set this one as default
      const { error } = await supabase
        .from("sms_provider_configs")
        .update({ is_default: true })
        .eq("id", provider.id);

      if (error) throw error;
      toast.success(`${provider.provider_name} set as default`);
      fetchProviders();
    } catch (error: any) {
      toast.error("Failed to set default provider");
      console.error(error);
    }
  };

  const addProvider = async (providerType: string) => {
    try {
      const providerNames: Record<string, string> = {
        twilio_primary: "Main Twilio",
        twilio_backup: "Twilio Backup",
        messagebird: "MessageBird"
      };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User not authenticated");
        return;
      }

      const { error } = await supabase
        .from("sms_provider_configs")
        .insert({
          provider_type: providerType,
          provider_name: providerNames[providerType],
          is_active: false,
          is_default: false,
          priority: providers.length + 1,
          created_by: user.id,
          config_data: {
            description: providerType === 'messagebird' 
              ? 'MessageBird provider for admin messaging'
              : providerType === 'twilio_primary'
              ? 'Main Twilio account'
              : 'Backup Twilio account'
          }
        });

      if (error) throw error;
      toast.success("Provider added successfully");
      fetchProviders();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error("This provider type already exists");
      } else {
        toast.error("Failed to add provider");
      }
      console.error(error);
    }
  };

  const testProvider = async (provider: SMSProvider) => {
    if (!testNumber) {
      toast.error("Please enter a phone number");
      return;
    }

    setTestingProvider(provider.id);
    try {
      const { data, error } = await supabase.functions.invoke("send-sms-provider", {
        body: {
          provider_type: provider.provider_type,
          to: testNumber,
          message: testMessage,
        },
      });

      if (error) throw error;
      toast.success(`Test message sent via ${provider.provider_name}`);
    } catch (error: any) {
      toast.error(`Failed to send test message: ${error.message}`);
      console.error(error);
    } finally {
      setTestingProvider(null);
    }
  };

  const getProviderIcon = (type: string) => {
    const icons: Record<string, string> = {
      twilio_primary: "🔵",
      twilio_backup: "🟡",
      messagebird: "🟣"
    };
    return icons[type] || "📱";
  };

  if (loading) {
    return <div className="text-center py-8">Loading providers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SMS Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Manage your SMS providers and configure fallback options
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Provider</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add SMS Provider</DialogTitle>
              <DialogDescription>
                Choose a provider to add to your integrations
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => addProvider("twilio_primary")}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔵</span>
                  <div className="text-left">
                    <div className="font-semibold">Main Twilio</div>
                    <div className="text-xs text-muted-foreground">
                      Your primary Twilio account for sending messages
                    </div>
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => addProvider("twilio_backup")}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🟡</span>
                  <div className="text-left">
                    <div className="font-semibold">Twilio Backup</div>
                    <div className="text-xs text-muted-foreground">
                      Add a backup Twilio account for redundancy
                    </div>
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => addProvider("messagebird")}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🟣</span>
                  <div className="text-left">
                    <div className="font-semibold">MessageBird</div>
                    <div className="text-xs text-muted-foreground">
                      MessageBird provider for admin messaging
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {providers.map((provider) => (
          <Card key={provider.id} className={provider.is_default ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getProviderIcon(provider.provider_type)}</span>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {provider.provider_name}
                      {provider.is_default && (
                        <Badge variant="default" className="text-xs">Default</Badge>
                      )}
                      {provider.is_active ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </CardTitle>
                    <CardDescription>
                      Priority: {provider.priority} | {provider.provider_type}
                    </CardDescription>
                  </div>
                </div>
              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${provider.id}`} className="text-xs">
                      Active
                    </Label>
                    <Switch
                      id={`active-${provider.id}`}
                      checked={provider.is_active}
                      onCheckedChange={() => toggleProvider(provider)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`clients-${provider.id}`} className="text-xs">
                      Clients
                    </Label>
                    <Switch
                      id={`clients-${provider.id}`}
                      checked={provider.use_for_clients}
                      onCheckedChange={() => toggleUsageContext(provider, 'clients')}
                      disabled={!provider.is_active}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`admin-${provider.id}`} className="text-xs">
                      Admin
                    </Label>
                    <Switch
                      id={`admin-${provider.id}`}
                      checked={provider.use_for_admin}
                      onCheckedChange={() => toggleUsageContext(provider, 'admin')}
                      disabled={!provider.is_active}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {provider.config_data?.description || 'No description'}
              </div>

              {provider.provider_type === 'messagebird' && (
                <Badge variant="secondary">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Admin Only
                </Badge>
              )}

              <div className="flex gap-2">
                {!provider.is_default && provider.is_active && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDefaultProvider(provider)}
                  >
                    Set as Default
                  </Button>
                )}

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={!provider.is_active}>
                      <Send className="h-4 w-4 mr-2" />
                      Test Provider
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Test {provider.provider_name}</DialogTitle>
                      <DialogDescription>
                        Send a test message to verify the provider is working
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label>Phone Number</Label>
                        <Input
                          placeholder="+1234567890"
                          value={testNumber}
                          onChange={(e) => setTestNumber(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Test Message</Label>
                        <Textarea
                          value={testMessage}
                          onChange={(e) => setTestMessage(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <Button
                        onClick={() => testProvider(provider)}
                        disabled={testingProvider === provider.id}
                        className="w-full"
                      >
                        {testingProvider === provider.id ? "Sending..." : "Send Test Message"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {providers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No SMS providers configured</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first provider to start sending messages
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SMSIntegrations;
