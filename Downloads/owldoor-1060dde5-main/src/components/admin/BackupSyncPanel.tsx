import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database, RefreshCw, CheckCircle, XCircle, Clock, Settings, Download, Upload } from "lucide-react";

interface SyncResult {
  table: string;
  synced: number;
  errors: number;
  status: 'success' | 'partial' | 'failed';
}

export const BackupSyncPanel = () => {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [externalKey, setExternalKey] = useState("");
  const [twoWaySync, setTwoWaySync] = useState(true);
  const [configSaved, setConfigSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const { toast } = useToast();

  const saveConfig = async () => {
    if (!externalUrl || !externalKey) {
      toast({
        title: "Missing Credentials",
        description: "Please provide both URL and service key",
        variant: "destructive",
      });
      return;
    }

    try {
      // Save credentials by invoking edge function to update secrets
      const { error } = await supabase.functions.invoke('admin-update-sync-config', {
        body: {
          externalUrl,
          externalKey,
          twoWaySync,
        },
      });

      if (error) throw error;

      setConfigSaved(true);
      setShowConfig(false);
      toast({
        title: "Configuration Saved",
        description: "External database credentials have been updated",
      });
    } catch (error) {
      console.error('Config save error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save configuration",
        variant: "destructive",
      });
    }
  };

  const triggerSync = async () => {
    if (!configSaved && !externalUrl) {
      toast({
        title: "Configuration Required",
        description: "Please configure external database credentials first",
        variant: "destructive",
      });
      setShowConfig(true);
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('backup-sync', {
        body: {
          twoWaySync,
        },
      });

      if (error) throw error;

      setLastSync(new Date());
      setSyncResults(data.results);
      
      toast({
        title: "Backup Sync Complete",
        description: `Synced ${data.summary.totalSynced} records with ${data.summary.totalErrors} errors.`,
        variant: data.summary.failedTables === 0 ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const exportDatabase = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('database-export');

      if (error) throw error;

      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lovable-cloud-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Complete",
        description: "Database backup downloaded successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const restoreDatabase = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setRestoring(true);
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      const { data, error } = await supabase.functions.invoke('database-restore', {
        body: {
          backupData,
          clearExisting: false, // Use upsert instead of clearing
        },
      });

      if (error) throw error;

      setSyncResults(data.results);
      
      toast({
        title: "Restore Complete",
        description: `Restored ${data.summary.totalRestored} records with ${data.summary.totalErrors} errors.`,
        variant: data.summary.failedTables === 0 ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: "Restore Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setRestoring(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Backup Sync
            </CardTitle>
            <CardDescription>
              {twoWaySync ? "2-way" : "1-way"} sync with external database
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowConfig(!showConfig)}
              variant="outline"
              size="sm"
            >
              <Settings className="mr-2 h-4 w-4" />
              Configure
            </Button>
            <Button
              onClick={exportDatabase}
              disabled={exporting}
              variant="outline"
              size="sm"
            >
              {exporting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Backup
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={restoring}
              onClick={() => document.getElementById('restore-file')?.click()}
            >
              {restoring ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Restore Backup
                </>
              )}
            </Button>
            <input
              id="restore-file"
              type="file"
              accept=".json"
              onChange={restoreDatabase}
              className="hidden"
            />
            <Button
              onClick={triggerSync}
              disabled={syncing}
              size="sm"
            >
              {syncing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync to External
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showConfig && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-semibold text-sm">External Database Configuration</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="external-url">External Supabase URL</Label>
                <Input
                  id="external-url"
                  type="text"
                  placeholder="https://xxxxx.supabase.co"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="external-key">External Service Role Key</Label>
                <Input
                  id="external-key"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={externalKey}
                  onChange={(e) => setExternalKey(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="two-way-sync">2-Way Sync</Label>
                  <p className="text-xs text-muted-foreground">
                    Sync changes in both directions
                  </p>
                </div>
                <Switch
                  id="two-way-sync"
                  checked={twoWaySync}
                  onCheckedChange={setTwoWaySync}
                />
              </div>
              <Button onClick={saveConfig} className="w-full">
                Save Configuration
              </Button>
            </div>
          </div>
        )}

        {lastSync && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Last sync: {lastSync.toLocaleString()}
          </div>
        )}

        {syncResults && syncResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Sync Results</h4>
            <div className="grid gap-2">
              {syncResults.map((result) => (
                <div
                  key={result.table}
                  className="flex items-center justify-between p-2 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {result.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : result.status === 'partial' ? (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-mono text-sm">{result.table}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {result.synced} synced
                    </Badge>
                    {result.errors > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {result.errors} errors
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="font-semibold mb-1">Available Operations:</p>
          <p>• <strong>Export Backup:</strong> Download complete database as JSON file</p>
          <p>• <strong>Restore Backup:</strong> Upload and restore from JSON backup file</p>
          <p>• <strong>Sync to External:</strong> {twoWaySync ? "2-way" : "1-way"} sync with external database</p>
          <p className="mt-2 font-semibold">Configuration:</p>
          <p>• External database: {configSaved ? "Configured" : "Not configured"}</p>
          <p>• Syncs all tables in dependency order</p>
          <p>• Uses upsert with conflict resolution on ID</p>
        </div>
      </CardContent>
    </Card>
  );
};
