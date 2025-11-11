import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, RefreshCw, Search, Clock, XCircle, AlertTriangle, Database } from "lucide-react";
import { format } from "date-fns";

interface EdgeFunctionLog {
  event_message: string;
  event_type: string;
  function_id: string;
  level: string;
  timestamp: number;
}

export default function AdminErrorLogs() {
  const [verifyCodeLogs, setVerifyCodeLogs] = useState<EdgeFunctionLog[]>([]);
  const [signupLogs, setSignupLogs] = useState<EdgeFunctionLog[]>([]);
  const [passwordResetLogs, setPasswordResetLogs] = useState<EdgeFunctionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const { toast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Fetch verify-code logs
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('get-edge-logs', {
        body: { function_name: 'verify-code', search: '' }
      });

      if (!verifyError && verifyData?.logs) {
        setVerifyCodeLogs(verifyData.logs);
      }

      // Fetch signup logs
      const { data: signupData, error: signupError } = await supabase.functions.invoke('get-edge-logs', {
        body: { function_name: 'agent-directory-signup', search: '' }
      });

      if (!signupError && signupData?.logs) {
        setSignupLogs(signupData.logs);
      }

      // Fetch password reset logs
      const { data: resetData, error: resetError } = await supabase.functions.invoke('get-edge-logs', {
        body: { function_name: 'send-password-reset', search: '' }
      });

      if (!resetError && resetData?.logs) {
        setPasswordResetLogs(resetData.logs);
      }

    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch error logs. Note: This requires backend support.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const allLogs = [...verifyCodeLogs, ...signupLogs, ...passwordResetLogs]
    .filter(log => {
      const matchesSearch = searchTerm === "" || 
        log.event_message?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLevel = filterLevel === "all" || log.level?.toLowerCase() === filterLevel.toLowerCase();
      
      return matchesSearch && matchesLevel;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'error':
        return 'destructive';
      case 'warn':
      case 'warning':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warn':
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Database className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Error & Log Monitoring</h1>
          <p className="text-muted-foreground">Monitor signup, login, and password reset errors</p>
        </div>
        <Button onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Verify Code Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifyCodeLogs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Signup Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signupLogs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Password Reset Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passwordResetLogs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allLogs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Level</label>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>All Edge Function Logs</CardTitle>
            <Badge variant="secondary">{allLogs.length}</Badge>
          </div>
          <CardDescription>Recent edge function errors, warnings, and info logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading logs...</div>
            ) : allLogs.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-muted-foreground">No logs found</p>
                <p className="text-xs text-muted-foreground">Note: Edge function logging may need to be configured</p>
              </div>
            ) : (
              allLogs.map((log, index) => (
                <div key={`${log.function_id}-${log.timestamp}-${index}`} className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {getLevelIcon(log.level)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {log.function_id ? `func-${log.function_id.slice(0, 8)}` : 'unknown'}
                          </Badge>
                          <Badge variant={getLevelColor(log.level)}>
                            {log.level || 'info'}
                          </Badge>
                          {log.event_type && (
                            <Badge variant="secondary">{log.event_type}</Badge>
                          )}
                        </div>
                        <pre className="text-sm whitespace-pre-wrap break-words bg-muted/50 p-3 rounded font-mono">
                          {log.event_message}
                        </pre>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      {log.timestamp ? format(new Date(log.timestamp / 1000), 'MMM d, HH:mm:ss') : 'Unknown'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
