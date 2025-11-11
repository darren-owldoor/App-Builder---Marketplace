import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Search, Loader2, Save } from "lucide-react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface ZipRadiusSearchProps {
  onSave?: (data: { name: string; center: { lat: number; lng: number }; radius: number }) => void;
}

export const ZipRadiusSearch = ({ onSave }: ZipRadiusSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [radius, setRadius] = useState<number>(25);
  const [loading, setLoading] = useState(false);
  const [saveName, setSaveName] = useState("");
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const circle = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-maps-config');
        
        if (!data?.mapboxToken) {
          console.error('Mapbox token not configured');
          toast.error('Map configuration unavailable');
          return;
        }

        mapboxgl.accessToken = data.mapboxToken;
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-98.4936, 29.4241], // San Antonio default
          zoom: 10,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      } catch (error) {
        console.error('Failed to initialize map:', error);
        toast.error('Failed to load map');
      }
    };

    initMap();

    return () => {
      map.current?.remove();
    };
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('zip-radius-geocode', {
        body: { action: 'autocomplete', query: searchQuery }
      });

      if (error) throw error;
      setSuggestions(data.suggestions || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to search");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = async (suggestion: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('zip-radius-geocode', {
        body: { action: 'geocode', query: suggestion.description }
      });

      if (error) throw error;
      
      setSelectedLocation(data);
      setSaveName(data.city || suggestion.description);
      updateMap(data.latitude, data.longitude);
      toast.success(`Location selected: ${data.formatted_address}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to geocode");
    } finally {
      setLoading(false);
    }
  };

  const updateMap = (lat: number, lng: number) => {
    if (!map.current) return;

    // Remove existing marker and circle
    if (marker.current) marker.current.remove();
    if (circle.current) {
      map.current.removeLayer('radius-circle');
      map.current.removeSource('radius-circle');
    }

    // Add marker
    marker.current = new mapboxgl.Marker({ color: '#64b57f' })
      .setLngLat([lng, lat])
      .addTo(map.current);

    // Add circle
    const radiusInMeters = radius * 1609.34; // miles to meters
    const radiusInKm = radiusInMeters / 1000;
    
    map.current.addSource('radius-circle', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        properties: {}
      }
    });

    map.current.addLayer({
      id: 'radius-circle',
      type: 'circle',
      source: 'radius-circle',
      paint: {
        'circle-radius': {
          stops: [
            [0, 0],
            [20, radiusInKm * 50]
          ],
          base: 2
        },
        'circle-color': '#64b57f',
        'circle-opacity': 0.1,
        'circle-stroke-color': '#64b57f',
        'circle-stroke-width': 2
      }
    });

    // Fit bounds
    map.current.fitBounds([
      [lng - radius * 0.02, lat - radius * 0.015],
      [lng + radius * 0.02, lat + radius * 0.015]
    ], { padding: 50 });
  };

  useEffect(() => {
    if (selectedLocation) {
      updateMap(selectedLocation.latitude, selectedLocation.longitude);
    }
  }, [radius]);

  const handleSave = () => {
    if (!selectedLocation || !saveName.trim()) {
      toast.error("Please select a location and enter a name");
      return;
    }

    if (onSave) {
      onSave({
        name: saveName,
        center: { lat: selectedLocation.latitude, lng: selectedLocation.longitude },
        radius: radius
      });
      toast.success("Coverage area saved");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Search Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Search Location</CardTitle>
            <CardDescription>
              Find ZIP codes within a radius
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Location</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="City, state, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading} size="icon">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="space-y-2">
                <Label>Suggestions</Label>
                <div className="border rounded-lg divide-y max-h-64 overflow-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectLocation(suggestion)}
                      className="w-full text-left px-3 py-2 hover:bg-accent transition-colors text-sm"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>{suggestion.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="radius">Radius (miles)</Label>
              <Input
                id="radius"
                type="number"
                min="1"
                max="100"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              />
            </div>

            {selectedLocation && (
              <>

                <div className="space-y-2">
                  <Label htmlFor="saveName">Coverage Name</Label>
                  <Input
                    id="saveName"
                    placeholder="e.g., San Antonio 25mi"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                  />
                </div>

                {onSave && (
                  <Button onClick={handleSave} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Coverage Area
                  </Button>
                )}

                <div className="pt-4 border-t space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">City:</span>
                    <span className="font-medium">{selectedLocation.city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">State:</span>
                    <span className="font-medium">{selectedLocation.state}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coordinates:</span>
                    <span className="font-mono text-xs">
                      {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardContent className="p-0 h-[600px]">
            <div ref={mapContainer} className="w-full h-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
