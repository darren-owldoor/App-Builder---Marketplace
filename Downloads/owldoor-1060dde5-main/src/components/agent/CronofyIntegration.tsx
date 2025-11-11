import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, MapPin, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";

interface CronofyEvent {
  calendar_id: string;
  event_id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: {
    description?: string;
  };
}

interface CronofyIntegrationProps {
  onEventsLoaded?: (events: CronofyEvent[]) => void;
}

export function CronofyIntegration({ onEventsLoaded }: CronofyIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<CronofyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('cronofy_tokens')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (data && !error) {
        setIsConnected(true);
        await fetchEvents();
      }
    } catch (error) {
      console.error('Error checking Cronofy connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('cronofy-get-events', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      const upcomingEvents = data.events || [];
      setEvents(upcomingEvents);
      onEventsLoaded?.(upcomingEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch calendar events');
    }
  };

  const connectCronofy = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in first');
        return;
      }

      const { data, error } = await supabase.functions.invoke('cronofy-oauth-initiate');

      if (error) throw error;

      const popup = window.open(
        data.authUrl,
        'Cronofy Authorization',
        'width=600,height=700,menubar=no,toolbar=no'
      );

      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'cronofy-auth-success') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          toast.success('Calendar connected successfully!');
          await checkConnection();
        } else if (event.data.type === 'cronofy-auth-error') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          toast.error('Failed to connect calendar');
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('Error connecting Cronofy:', error);
      toast.error('Failed to initiate calendar connection');
    }
  };

  const disconnectCronofy = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.functions.invoke('cronofy-disconnect', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setIsConnected(false);
      setEvents([]);
      toast.success('Calendar disconnected');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect calendar');
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Calendar</h3>
          <p className="text-muted-foreground mb-4">
            Sync your calendar to see upcoming events
          </p>
          <Button onClick={connectCronofy} className="w-full">
            Connect Calendar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Your Calendar</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={disconnectCronofy}
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No upcoming events
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {events.slice(0, 10).map((event) => {
            const startDate = new Date(event.start);
            const endDate = new Date(event.end);
            
            return (
              <div
                key={event.event_id}
                className="border-l-4 border-primary bg-muted/50 rounded-r-lg p-3 hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{event.summary}</h4>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {event.location?.description && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location.description}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={fetchEvents}
        className="w-full mt-4"
      >
        Refresh Events
      </Button>
    </Card>
  );
}
