import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, Trash2, Plus } from "lucide-react";
import ZapierAPIKeys from "./ZapierAPIKeys";

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

export function ZapierIntegration() {
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [logs, setLogs] = useState<ZapierLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    type: 'import' as 'import' | 'export',
    entity: 'leads' as string,
    url: '',
  });

  useEffect(() => {
    fetchWebhooks();
    fetchLogs();
  }, []);

  const fetchWebhooks = async () => {
    const { data, error } = await supabase
      .from('zapier_webhooks')
      .select('*')
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
      entity_type: newWebhook.entity,
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
      setNewWebhook({ type: 'import', entity: 'leads', url: '' });
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
          entity_type: webhook.entity_type,
          user_id: user?.id,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Exported ${data.exported} ${webhook.entity_type} records`,
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

  return (
    <div className="space-y-6">
      <ZapierAPIKeys />
      
      <Card>
        <CardHeader>
          <CardTitle>Zapier Integration</CardTitle>
          <CardDescription>
            Configure webhooks to import and export data via Zapier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="import">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="import">Import (Zap In)</TabsTrigger>
              <TabsTrigger value="export">Export (Zap Out)</TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Entity Type</Label>
                  <Select
                    value={newWebhook.entity}
                    onValueChange={(value) => setNewWebhook({ ...newWebhook, entity: value, type: 'import' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leads">Leads</SelectItem>
                      <SelectItem value="agents">Agents</SelectItem>
                      <SelectItem value="clients">Clients</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="users">Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Webhook URL (from Zapier)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://hooks.zapier.com/..."
                      value={newWebhook.type === 'import' ? newWebhook.url : ''}
                      onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value, type: 'import' })}
                    />
                    <Button onClick={addWebhook} disabled={loading}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Import Webhooks</h3>
                  {webhooks.filter(w => w.webhook_type === 'import').map((webhook) => (
                    <div key={webhook.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          <span className="font-medium">{webhook.entity_type}</span>
                          <Badge variant={webhook.active ? "default" : "secondary"}>
                            {webhook.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{webhook.webhook_url}</p>
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
                  <Label>Entity Type</Label>
                  <Select
                    value={newWebhook.entity}
                    onValueChange={(value) => setNewWebhook({ ...newWebhook, entity: value, type: 'export' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leads">Leads</SelectItem>
                      <SelectItem value="clients">Clients</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="users">Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Webhook URL (from Zapier)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://hooks.zapier.com/..."
                      value={newWebhook.type === 'export' ? newWebhook.url : ''}
                      onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value, type: 'export' })}
                    />
                    <Button onClick={addWebhook} disabled={loading}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Export Webhooks</h3>
                  {webhooks.filter(w => w.webhook_type === 'export').map((webhook) => (
                    <div key={webhook.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          <span className="font-medium">{webhook.entity_type}</span>
                          <Badge variant={webhook.active ? "default" : "secondary"}>
                            {webhook.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{webhook.webhook_url}</p>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="flex items-center gap-2">
                    {log.action === 'import' ? <Upload className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                    <span className="font-medium">{log.action} {log.entity_type}</span>
                    <Badge variant={log.status === 'success' ? "default" : "destructive"}>
                      {log.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {log.entity_count} records • {new Date(log.created_at).toLocaleString()}
                  </p>
                  {log.error_message && (
                    <p className="text-sm text-destructive mt-1">{log.error_message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
