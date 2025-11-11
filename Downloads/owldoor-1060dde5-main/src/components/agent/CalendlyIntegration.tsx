import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, ExternalLink, RefreshCw, LogOut } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const CalendlyIntegration = () => {
  const [loading, setLoading] = useState(false);
  const [calendlyUser, setCalendlyUser] = useState<any>(null);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [calendlyUrl, setCalendlyUrl] = useState("");

  useEffect(() => {
    fetchCalendlyUser();
  }, []);

  const initiateOAuth = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('calendly-oauth-initiate');
      
      if (error) {
        console.error('Error initiating OAuth:', error);
        toast.error(error.message || "Failed to initiate Calendly connection");
        setLoading(false);
        return;
      }

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;
      
      const popup = window.open(
        data.authUrl,
        'calendly-oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'calendly-oauth-success') {
          window.removeEventListener('message', handleMessage);
          fetchCalendlyUser();
          toast.success("Successfully connected to Calendly");
        } else if (event.data.type === 'calendly-oauth-error') {
          window.removeEventListener('message', handleMessage);
          toast.error(event.data.error || "Failed to connect to Calendly");
          setLoading(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was closed
      const checkPopup = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', handleMessage);
          setLoading(false);
        }
      }, 500);
    } catch (error) {
      console.error('Error:', error);
      toast.error("An unexpected error occurred");
      setLoading(false);
    }
  };

  const fetchCalendlyUser = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('calendly-get-user', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        console.error('Error fetching Calendly user:', error);
        if (error.message?.includes('not connected')) {
          // User needs to connect - this is not an error state
          setCalendlyUser(null);
          setEventTypes([]);
        } else {
          toast.error(error.message || "Failed to fetch Calendly data");
        }
        setLoading(false);
        return;
      }

      if (data?.resource) {
        setCalendlyUser(data.resource);
        await fetchEventTypes(data.resource.uri);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const disconnectCalendly = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in");
        setLoading(false);
        return;
      }

      const { error } = await supabase.functions.invoke('calendly-disconnect', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        console.error('Error disconnecting:', error);
        toast.error(error.message || "Failed to disconnect Calendly");
        setLoading(false);
        return;
      }

      setCalendlyUser(null);
      setEventTypes([]);
      toast.success("Successfully disconnected from Calendly");
    } catch (error) {
      console.error('Error:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchEventTypes = async (userUri: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('calendly-get-events', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { count: 20, status: 'active' },
      });
      
      if (error) throw error;
      
      setEventTypes(data.collection || []);
    } catch (error: any) {
      console.error('Error fetching event types:', error);
    }
  };

  const copySchedulingUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Scheduling URL copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendly Integration
          </CardTitle>
          <CardDescription>
            Connect your Calendly account to manage appointments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!calendlyUser ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Click the button below to connect your Calendly account and sync your availability.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={initiateOAuth} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Connect Calendly
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{calendlyUser.name}</p>
                  <p className="text-sm text-muted-foreground">{calendlyUser.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={fetchCalendlyUser}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={disconnectCalendly}
                    disabled={loading}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>

              {calendlyUser.scheduling_url && (
                <div className="space-y-2">
                  <Label>Your Scheduling Page</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={calendlyUser.scheduling_url} 
                      readOnly 
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copySchedulingUrl(calendlyUser.scheduling_url)}
                    >
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      asChild
                    >
                      <a 
                        href={calendlyUser.scheduling_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {eventTypes.length > 0 && (
                <div className="space-y-3">
                  <Label>Your Event Types</Label>
                  <div className="space-y-2">
                    {eventTypes.map((eventType) => (
                      <div
                        key={eventType.uri}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{eventType.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {eventType.duration} min • {eventType.active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copySchedulingUrl(eventType.scheduling_url)}
                        >
                          Copy Link
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {calendlyUser && (
        <Card>
          <CardHeader>
            <CardTitle>Embed Your Calendar</CardTitle>
            <CardDescription>
              Add this code to your website to display your Calendly booking widget
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{`<!-- Calendly inline widget begin -->
<div class="calendly-inline-widget" 
     data-url="${calendlyUser.scheduling_url}" 
     style="min-width:320px;height:700px;">
</div>
<script type="text/javascript" 
        src="https://assets.calendly.com/assets/external/widget.js" 
        async>
</script>
<!-- Calendly inline widget end -->`}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
