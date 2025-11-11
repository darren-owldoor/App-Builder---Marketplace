import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, MapPin, X } from "lucide-react";
import { toast } from "sonner";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
}

export function CalendarIntegration() {
  const [calendlyConnected, setCalendlyConnected] = useState(false);
  const [cronofyConnected, setCronofyConnected] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProvider, setActiveProvider] = useState<'calendly' | 'cronofy' | null>(null);

  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Check Calendly
      const { data: calendlyData } = await supabase
        .from('calendly_tokens')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (calendlyData) {
        setCalendlyConnected(true);
        setActiveProvider('calendly');
        await fetchCalendlyEvents();
      }

      // Check Cronofy
      const { data: cronofyData } = await supabase
        .from('cronofy_tokens')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (cronofyData) {
        setCronofyConnected(true);
        if (!calendlyData) {
          setActiveProvider('cronofy');
          await fetchCronofyEvents();
        }
      }
    } catch (error) {
      console.error('Error checking connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendlyEvents = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('calendly-get-events', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { count: 10, status: 'active' },
      });

      if (error) throw error;

      // Transform Calendly event types to calendar events format
      const eventTypes = data.collection || [];
      setEvents(eventTypes.map((et: any) => ({
        id: et.uri,
        summary: et.name,
        description: et.description_plain || '',
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        location: et.location?.location || 'Online',
      })));
    } catch (error) {
      console.error('Error fetching Calendly events:', error);
    }
  };

  const fetchCronofyEvents = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('cronofy-get-events', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      const cronofyEvents = data.events || [];
      setEvents(cronofyEvents.map((event: any) => ({
        id: event.event_id,
        summary: event.summary,
        description: event.description || '',
        start: event.start,
        end: event.end,
        location: event.location?.description || '',
      })));
    } catch (error) {
      console.error('Error fetching Cronofy events:', error);
    }
  };

  const connectCalendly = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in first');
        return;
      }

      const { data, error } = await supabase.functions.invoke('calendly-oauth-initiate');
      if (error) throw error;

      const popup = window.open(data.authUrl, 'Calendly Authorization', 'width=600,height=700');

      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'calendly-auth-success') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          toast.success('Calendly connected!');
          await checkConnections();
        } else if (event.data.type === 'calendly-auth-error') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          toast.error('Failed to connect Calendly');
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('Error connecting Calendly:', error);
      toast.error('Failed to connect Calendly');
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

      const popup = window.open(data.authUrl, 'Cronofy Authorization', 'width=600,height=700');

      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'cronofy-auth-success') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          toast.success('Cronofy connected!');
          await checkConnections();
        } else if (event.data.type === 'cronofy-auth-error') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          toast.error('Failed to connect Cronofy');
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('Error connecting Cronofy:', error);
      toast.error('Failed to connect Cronofy');
    }
  };

  const disconnectCalendar = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (activeProvider === 'calendly') {
        const { error } = await supabase.functions.invoke('calendly-disconnect', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (error) throw error;
        setCalendlyConnected(false);
      } else if (activeProvider === 'cronofy') {
        const { error } = await supabase.functions.invoke('cronofy-disconnect', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (error) throw error;
        setCronofyConnected(false);
      }

      setActiveProvider(null);
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

  if (!calendlyConnected && !cronofyConnected) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="text-center mb-6">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Calendar</h3>
            <p className="text-sm text-muted-foreground">
              Sync your calendar to see upcoming events
            </p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={connectCronofy} 
              className="w-full h-14 justify-start px-6 bg-card hover:bg-accent border-2 border-border text-foreground font-medium text-base"
              variant="outline"
            >
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-[#4285F4] flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <span>Connect with Cronofy</span>
              </div>
            </Button>

            <Button 
              onClick={connectCalendly} 
              className="w-full h-14 justify-start px-6 bg-card hover:bg-accent border-2 border-border text-foreground font-medium text-base"
              variant="outline"
            >
              <div className="flex items-center gap-4">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#006BFF"/>
                  <path d="M12 7v10M7 12h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>Connect with Calendly</span>
              </div>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Your Calendar</h3>
            <p className="text-xs text-muted-foreground">
              via {activeProvider === 'calendly' ? 'Calendly' : 'Cronofy'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={disconnectCalendar}
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-4">No upcoming events</p>
          {!calendlyConnected && (
            <Button onClick={connectCalendly} variant="outline" size="sm" className="mr-2">
              Add Calendly
            </Button>
          )}
          {!cronofyConnected && (
            <Button onClick={connectCronofy} variant="outline" size="sm">
              Add Cronofy
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {events.slice(0, 5).map((event) => {
            const startDate = new Date(event.start);
            
            return (
              <div
                key={event.id}
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
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
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

      <div className="flex gap-2 mt-4">
        {!calendlyConnected && (
          <Button onClick={connectCalendly} variant="outline" size="sm" className="flex-1">
            + Calendly
          </Button>
        )}
        {!cronofyConnected && (
          <Button onClick={connectCronofy} variant="outline" size="sm" className="flex-1">
            + Cronofy
          </Button>
        )}
      </div>
    </Card>
  );
}
