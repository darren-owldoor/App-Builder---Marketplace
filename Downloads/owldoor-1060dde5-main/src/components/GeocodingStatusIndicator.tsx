import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GeocodingStatus {
  local: boolean;
  google: boolean;
  nominatim: boolean;
  mapbox: boolean;
  activeService: string;
}

export function GeocodingStatusIndicator() {
  const [status, setStatus] = useState<GeocodingStatus>({
    local: true,
    google: false,
    nominatim: false,
    mapbox: false,
    activeService: 'checking...'
  });

  useEffect(() => {
    checkGeocodingServices();
  }, []);

  const checkGeocodingServices = async () => {
    const newStatus: GeocodingStatus = {
      local: true, // Always available
      google: false,
      nominatim: false,
      mapbox: false,
      activeService: 'local'
    };

    // Check Google Maps
    try {
      const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (googleKey) {
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${googleKey}`);
        newStatus.google = response.ok;
        if (response.ok) newStatus.activeService = 'google';
      }
    } catch (error) {
      console.warn('Google Maps check failed:', error);
    }

    // Check Nominatim
    try {
      const response = await fetch('https://nominatim.openstreetmap.org/search?q=test&format=json&limit=1', {
        headers: { 'User-Agent': 'OwlDoor/1.0' }
      });
      newStatus.nominatim = response.ok;
      if (!newStatus.google && response.ok) newStatus.activeService = 'nominatim';
    } catch (error) {
      console.warn('Nominatim check failed:', error);
    }

    // Check Mapbox
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.functions.invoke('get-maps-config');
      newStatus.mapbox = !!data?.mapboxToken;
      if (!newStatus.google && !newStatus.nominatim && newStatus.mapbox) {
        newStatus.activeService = 'mapbox';
      }
    } catch (error) {
      console.warn('Mapbox check failed:', error);
    }

    setStatus(newStatus);
  };

  const hasAnyService = status.google || status.nominatim || status.mapbox;
  const icon = hasAnyService ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={hasAnyService ? "default" : "secondary"}
            className="cursor-help"
          >
            {icon}
            <span className="ml-1.5">Geocoding: {status.activeService}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2 text-xs">
            <p className="font-semibold">Geocoding Services Status:</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {status.local ? <CheckCircle className="h-3 w-3 text-green-500" /> : <AlertCircle className="h-3 w-3 text-red-500" />}
                <span>Local Database</span>
              </div>
              <div className="flex items-center gap-2">
                {status.google ? <CheckCircle className="h-3 w-3 text-green-500" /> : <AlertCircle className="h-3 w-3 text-yellow-500" />}
                <span>Google Maps</span>
              </div>
              <div className="flex items-center gap-2">
                {status.nominatim ? <CheckCircle className="h-3 w-3 text-green-500" /> : <AlertCircle className="h-3 w-3 text-yellow-500" />}
                <span>OpenStreetMap</span>
              </div>
              <div className="flex items-center gap-2">
                {status.mapbox ? <CheckCircle className="h-3 w-3 text-green-500" /> : <AlertCircle className="h-3 w-3 text-yellow-500" />}
                <span>Mapbox</span>
              </div>
            </div>
            <p className="text-muted-foreground pt-1 border-t">
              System automatically switches to available services
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
