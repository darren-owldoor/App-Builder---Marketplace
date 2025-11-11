import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, Trash2, Plus, Key, Eye, EyeOff, Copy, ExternalLink, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface WebhookConfig {
  id: string;
  webhook_type: 'import' | 'export';
  entity_type: string;
  webhook_url: string;
  active: boolean;
  created_at: string;
}

interface ZapierLog {
  id: string;
  action: string;
  entity_type: string;
  entity_count: number;
  status: 'success' | 'error';
  error_message?: string;
  created_at: string;
}

interface ApiKey {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  active: boolean;
  api_key_hash: string;  // SECURITY: Only hash is stored, never plaintext
}

export function ClientZapierIntegration() {
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [logs, setLogs] = useState<ZapierLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    type: 'import' as 'import' | 'export',
    url: '',
  });
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchWebhooks();
    fetchLogs();
    fetchApiKeys();
  }, []);

  const fetchWebhooks = async () => {
    const { data, error } = await supabase
      .from('zapier_webhooks')
      .select('*')
      .eq('entity_type', 'leads')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching webhooks:', error);
      return;
    }

    setWebhooks((data || []) as WebhookConfig[]);
  };

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('zapier_logs')
      .select('*')
      .eq('entity_type', 'leads')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching logs:', error);
      return;
    }

    setLogs((data || []) as ZapierLog[]);
  };

  const addWebhook = async () => {
    if (!newWebhook.url) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('zapier_webhooks').insert({
      user_id: user?.id,
      webhook_type: newWebhook.type,
      entity_type: 'leads',
      webhook_url: newWebhook.url,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Webhook configured successfully",
      });
      setNewWebhook({ type: 'import', url: '' });
      fetchWebhooks();
    }

    setLoading(false);
  };

  const deleteWebhook = async (id: string) => {
    const { error } = await supabase
      .from('zapier_webhooks')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Webhook deleted",
      });
      fetchWebhooks();
    }
  };

  const triggerExport = async (webhook: WebhookConfig) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    try {
      const { data, error } = await supabase.functions.invoke('zapier-export', {
        body: {
          webhook_url: webhook.webhook_url,
          entity_type: 'leads',
          user_id: user?.id,
          filters: { own_only: true },
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Exported ${data.exported} leads`,
      });
      fetchLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from("zapier_api_keys")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error: any) {
      console.error("Error fetching API keys:", error);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the API key",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate secure random API key
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const apiKey = 'owl_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      
      // Hash the API key before storing
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const apiKeyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const { error } = await supabase.from("zapier_api_keys").insert({
        user_id: user.id,
        api_key: apiKey,
        api_key_hash: apiKeyHash,
        name: newKeyName,
        active: true,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "API key generated successfully. Make sure to copy it now!",
      });

      setNewKeyName("");
      fetchApiKeys();
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

  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from("zapier_api_keys")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "API key deleted",
      });

      fetchApiKeys();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const maskApiKey = (key: string) => {
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Zapier Integration
        </CardTitle>
        <CardDescription>
          Connect your OwlDoor account to Zapier to automate lead workflows
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Start Guide */}
        <Alert className="border-primary/50 bg-primary/5">
          <Zap className="h-4 w-4" />
          <AlertTitle>Quick Start: Connect to Zapier in 3 Steps</AlertTitle>
          <AlertDescription className="mt-3 space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                <div>
                  <p className="font-semibold">Accept the Zapier Integration Invite</p>
                  <a 
                    href="https://zapier.com/developer/public-invite/232500/ae757713232c3bd2490fbe9c5c01e4eb/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    Open Zapier Invite <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                <div>
                  <p className="font-semibold">Generate Your API Key</p>
                  <p className="text-sm text-muted-foreground">Go to the "API Keys" tab below and create a new key</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                <div>
                  <p className="font-semibold">Connect in Zapier</p>
                  <p className="text-sm text-muted-foreground">Use your API key to authenticate when setting up your Zaps</p>
                </div>
              </div>
            </div>
            
            <div className="bg-background rounded-lg p-3 mt-4">
              <p className="text-sm font-semibold mb-2">Available Actions:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <strong>Import Leads:</strong> Automatically add new leads from other apps</li>
                <li>• <strong>Export Leads:</strong> Send your matched leads to CRMs, spreadsheets, or email</li>
                <li>• <strong>Real-time Sync:</strong> Keep your data up-to-date across all platforms</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="api-keys">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="import">Import Leads</TabsTrigger>
            <TabsTrigger value="export">Export Leads</TabsTrigger>
          </TabsList>

          <TabsContent value="api-keys" className="space-y-4">
            <Alert>
              <Key className="h-4 w-4" />
              <AlertTitle>Authentication Setup</AlertTitle>
              <AlertDescription className="mt-2">
                Generate API keys to authenticate your Zapier integration. Copy your key and paste it when Zapier asks for authentication.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="keyName">Create New API Key</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="keyName"
                    placeholder="e.g., My Zapier Integration"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                  <Button onClick={createApiKey} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Your API Keys</h3>
                {apiKeys.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No API keys yet. Generate one to get started with Zapier.
                  </p>
                ) : (
                  apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Key className="h-4 w-4" />
                          <span className="font-medium">{key.name}</span>
                          <Badge variant={key.active ? "default" : "secondary"}>
                            {key.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            owl_••••••••••••••••••••••••••••
                          </code>
                          <span className="text-xs text-muted-foreground">
                            (Hashed - not shown for security)
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {new Date(key.created_at).toLocaleDateString()}
                          {key.last_used_at && ` • Last used: ${new Date(key.last_used_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteApiKey(key.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">How to use in Zapier:</h4>
                  <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                    <li>Click "Generate" above to create your API key</li>
                    <li>Copy the key using the copy button</li>
                    <li><a href="https://zapier.com/developer/public-invite/232500/ae757713232c3bd2490fbe9c5c01e4eb/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Accept the OwlDoor invite <ExternalLink className="h-3 w-3 inline" /></a></li>
                    <li>In Zapier, create a new Zap and search for "OwlDoor"</li>
                    <li>Paste your API key when prompted to connect</li>
                    <li>Choose your trigger or action and configure your workflow</li>
                  </ol>
                </div>
                
                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2 text-sm">API Endpoint Information:</h4>
                  <code className="text-xs bg-background px-2 py-1 rounded block">
                    {import.meta.env.VITE_SUPABASE_URL}/functions/v1/zapier-api
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">Use X-API-KEY header for authentication</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Webhook URL (from Zapier)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://hooks.zapier.com/..."
                    value={newWebhook.type === 'import' ? newWebhook.url : ''}
                    onChange={(e) => setNewWebhook({ type: 'import', url: e.target.value })}
                  />
                  <Button onClick={addWebhook} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Create a Zap with a Webhook trigger, then paste the URL here
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Active Import Webhooks</h3>
                {webhooks.filter(w => w.webhook_type === 'import').map((webhook) => (
                  <div key={webhook.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        <span className="font-medium">Import Leads</span>
                        <Badge variant={webhook.active ? "default" : "secondary"}>
                          {webhook.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">{webhook.webhook_url}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteWebhook(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Webhook URL (from Zapier)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://hooks.zapier.com/..."
                    value={newWebhook.type === 'export' ? newWebhook.url : ''}
                    onChange={(e) => setNewWebhook({ type: 'export', url: e.target.value })}
                  />
                  <Button onClick={addWebhook} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Create a Zap with a Webhook trigger to receive your leads
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Active Export Webhooks</h3>
                {webhooks.filter(w => w.webhook_type === 'export').map((webhook) => (
                  <div key={webhook.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        <span className="font-medium">Export Leads</span>
                        <Badge variant={webhook.active ? "default" : "secondary"}>
                          {webhook.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">{webhook.webhook_url}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => triggerExport(webhook)}
                        disabled={loading}
                      >
                        Export Now
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteWebhook(webhook.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <h3 className="font-semibold mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="flex items-center gap-2">
                    {log.action === 'import' ? <Upload className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                    <span className="font-medium capitalize">{log.action}</span>
                    <Badge variant={log.status === 'success' ? "default" : "destructive"}>
                      {log.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {log.entity_count} leads • {new Date(log.created_at).toLocaleString()}
                  </p>
                  {log.error_message && (
                    <p className="text-sm text-destructive mt-1">{log.error_message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
